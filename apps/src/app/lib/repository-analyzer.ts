// apps/src/app/lib/repository-analyzer.ts
import { Octokit } from '@octokit/rest';

export interface RepoContext {
  repositoryName: string;
  description?: string;
  mainPurpose: string;
  keyFiles: string[];
  fileStructure: string;
  technologies: string[];
  readme?: string;
}

// GitHub API response types
interface GitHubContentBase {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

interface GitHubFileContent extends GitHubContentBase {
  type: 'file';
  content?: string;
  encoding?: string;
}

interface GitHubDirContent extends GitHubContentBase {
  type: 'dir';
}

interface GitHubSymlinkContent extends GitHubContentBase {
  type: 'symlink';
}

interface GitHubSubmoduleContent extends GitHubContentBase {
  type: 'submodule';
  submodule_git_url?: string;
}

type GitHubContentItem = GitHubFileContent | GitHubDirContent | GitHubSymlinkContent | GitHubSubmoduleContent;

/**
 * Analyzes a GitHub repository without cloning it to the filesystem
 * @param repoUrl GitHub repository URL (e.g., 'https://github.com/username/repo')
 * @param accessToken User's GitHub access token from NextAuth session
 * @returns Repository context as a JSON object
 */
export async function getRepositoryContext(repoUrl: string, accessToken?: string): Promise<RepoContext> {
  try {
    // Parse GitHub repository owner and name from URL
    const urlParts = repoUrl.replace(/\.git$/, '').split('/');
    const repoName = urlParts.pop() || '';
    const owner = urlParts.pop() || '';
    
    if (!owner || !repoName) {
      throw new Error('Invalid GitHub repository URL');
    }
    
    // Initialize GitHub API client with user's access token if available
    // Fall back to environment variable if no token provided
    const octokit = new Octokit({
      auth: accessToken || process.env.GITHUB_TOKEN,
    });
    
    // Get repository information
    const { data: repoData } = await octokit.repos.get({
      owner,
      repo: repoName,
    });
    
    // Get repository contents (root directory)
    const { data: contents } = await octokit.repos.getContent({
      owner,
      repo: repoName,
      path: '',
    });
    
    // Process repository data
    const contentItems = Array.isArray(contents) ? contents as GitHubContentItem[] : [contents as GitHubContentItem];
    const context = await analyzeRepositoryFromApi(octokit, owner, repoName, contentItems, repoData);
    
    return context;
  } catch (error) {
    console.error('Error analyzing repository:', error);
    // Return basic context if analysis fails
    const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'repo';
    return {
      repositoryName: repoName,
      mainPurpose: "Could not determine repository purpose due to analysis error",
      keyFiles: [],
      fileStructure: "",
      technologies: []
    };
  }
}

async function analyzeRepositoryFromApi(
  octokit: Octokit, 
  owner: string, 
  repo: string, 
  contents: GitHubContentItem[], 
  repoData: any
): Promise<RepoContext> {
  // Get README content if available
  let readme: string | undefined;
  try {
    const readmeFile = contents.find(item => 
      item.name.toLowerCase().startsWith('readme') && 
      (item.name.toLowerCase().endsWith('.md') || item.name.toLowerCase().endsWith('.txt'))
    );
    
    if (readmeFile) {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: readmeFile.path,
      });
      
      if (!Array.isArray(data) && 'content' in data) {
        readme = Buffer.from(data.content, 'base64').toString('utf-8');
      }
    }
  } catch (error) {
    console.error('Error reading README:', error);
  }
  
  // Get package.json description if available
  let description = repoData.description;
  let packageJsonDeps: Record<string, string> = {};
  
  try {
    const packageJsonFile = contents.find(item => item.name === 'package.json');
    
    if (packageJsonFile) {
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path: packageJsonFile.path,
      });
      
      if (!Array.isArray(data) && 'content' in data) {
        const packageJson = JSON.parse(
          Buffer.from(data.content, 'base64').toString('utf-8')
        );
        
        if (!description && packageJson.description) {
          description = packageJson.description;
        }
        
        packageJsonDeps = {
          ...(packageJson.dependencies || {}),
          ...(packageJson.devDependencies || {})
        };
      }
    }
  } catch (error) {
    console.error('Error reading package.json:', error);
  }
  
  // Get key files
  const keyFiles = await getKeyFiles(octokit, owner, repo, contents);
  
  // Determine technologies used
  const technologies = await detectTechnologies(octokit, owner, repo, contents, packageJsonDeps);
  
  // Generate file structure overview
  const fileStructure = await generateFileStructure(octokit, owner, repo, contents);
  
  // Determine main purpose based on available information
  const mainPurpose = determineMainPurpose(readme, description, keyFiles, technologies);
  
  return {
    repositoryName: repo,
    description,
    mainPurpose,
    keyFiles,
    fileStructure,
    technologies,
    readme
  };
}

async function getKeyFiles(
  octokit: Octokit, 
  owner: string, 
  repo: string, 
  contents: GitHubContentItem[]
): Promise<string[]> {
  const keyFiles: string[] = [];
  const commonKeyFiles = [
    'package.json',
    'tsconfig.json',
    '.env.example',
    'docker-compose.yml',
    'Dockerfile',
    'Makefile',
    'webpack.config.js',
    'next.config.js',
    'babel.config.js',
    'jest.config.js'
  ];
  
  try {
    // Check for common key files in root directory
    for (const item of contents) {
      if (commonKeyFiles.includes(item.name)) {
        keyFiles.push(item.name);
      }
    }
    
    // Look for source entry points
    const srcEntryPoints = [
      'src/index.ts', 
      'src/index.js', 
      'src/main.ts', 
      'src/main.js', 
      'src/app.ts', 
      'src/app.js'
    ];
    
    // Check if src directory exists
    const srcDir = contents.find(item => item.name === 'src' && item.type === 'dir');
    
    if (srcDir) {
      try {
        const { data: srcContents } = await octokit.repos.getContent({
          owner,
          repo,
          path: 'src',
        });
        
        if (Array.isArray(srcContents)) {
          const entryFiles = srcContents.filter(item => 
            ['index.ts', 'index.js', 'main.ts', 'main.js', 'app.ts', 'app.js'].includes(item.name)
          );
          
          for (const file of entryFiles) {
            keyFiles.push(`src/${file.name}`);
          }
        }
      } catch (error) {
        console.error('Error checking src directory:', error);
      }
    }
  } catch (error) {
    console.error('Error identifying key files:', error);
  }
  
  return keyFiles;
}

async function detectTechnologies(
  octokit: Octokit, 
  owner: string, 
  repo: string, 
  contents: GitHubContentItem[],
  packageJsonDeps: Record<string, string> = {}
): Promise<string[]> {
  const technologies: string[] = [];
  
  try {
    // Check for common technology indicators in package.json
    if (Object.keys(packageJsonDeps).length > 0) {
      // Common frameworks and libraries
      if (packageJsonDeps.react) technologies.push('React');
      if (packageJsonDeps.next) technologies.push('Next.js');
      if (packageJsonDeps.vue) technologies.push('Vue.js');
      if (packageJsonDeps.angular) technologies.push('Angular');
      if (packageJsonDeps.express) technologies.push('Express');
      if (packageJsonDeps.nestjs) technologies.push('NestJS');
      if (packageJsonDeps.typescript) technologies.push('TypeScript');
      if (packageJsonDeps.tailwindcss) technologies.push('Tailwind CSS');
      if (packageJsonDeps.prisma) technologies.push('Prisma');
      if (packageJsonDeps.mongoose) technologies.push('MongoDB');
      if (packageJsonDeps.sequelize || packageJsonDeps.typeorm) technologies.push('SQL Database');
    }
    
    // Get repository languages from GitHub API
    try {
      const { data: languages } = await octokit.repos.listLanguages({
        owner,
        repo,
      });
      
      // Add languages with significant usage
      const totalBytes = Object.values(languages).reduce((sum: number, bytes: number) => sum + bytes, 0);
      
      for (const [language, bytes] of Object.entries(languages)) {
        // Only add languages that make up at least 5% of the codebase
        if (bytes / totalBytes >= 0.05) {
          // Map GitHub language names to our technology names
          const techName = mapLanguageToTechnology(language);
          if (techName) technologies.push(techName);
        }
      }
    } catch (error) {
      console.error('Error fetching repository languages:', error);
    }
  } catch (error) {
    console.error('Error detecting technologies:', error);
  }
  
  // Remove duplicates
  return [...new Set(technologies)];
}

function mapLanguageToTechnology(language: string): string | null {
  // Map GitHub language names to our technology names
  const languageMap: Record<string, string> = {
    'TypeScript': 'TypeScript',
    'JavaScript': 'JavaScript',
    'Python': 'Python',
    'Go': 'Go',
    'Rust': 'Rust',
    'Java': 'Java',
    'Ruby': 'Ruby',
    'PHP': 'PHP',
    'C#': 'C#',
    'C++': 'C++',
    'HTML': 'HTML',
    'CSS': 'CSS',
    'Shell': 'Shell/Bash',
  };
  
  return languageMap[language] || language;
}

async function generateFileStructure(
  octokit: Octokit, 
  owner: string, 
  repo: string, 
  rootContents: GitHubContentItem[]
): Promise<string> {
  let result = '';
  
  async function processDir(contents: GitHubContentItem[], prefix: string = '', level: number = 0) {
    if (level > 3) return; // Limit depth to 3 levels
    
    for (const item of contents) {
      if (item.type === 'dir' && 
          !item.name.startsWith('.') && 
          item.name !== 'node_modules' && 
          item.name !== 'dist' && 
          item.name !== 'build') {
        
        result += `${prefix}/${item.name}/\n`;
        
        if (level < 3) {
          try {
            const { data: dirContents } = await octokit.repos.getContent({
              owner,
              repo,
              path: item.path,
            });
            
            if (Array.isArray(dirContents)) {
              await processDir(dirContents as GitHubContentItem[], `${prefix}/${item.name}`, level + 1);
            }
          } catch (error) {
            console.error(`Error processing directory ${item.path}:`, error);
          }
        }
      }
    }
  }
  
  await processDir(rootContents);
  
  return result;
}

function determineMainPurpose(
  readme?: string, 
  description?: string, 
  keyFiles: string[] = [], 
  technologies: string[] = []
): string {
  // If README exists, extract first paragraph as likely project description
  if (readme) {
    const firstParagraph = readme.split('\n\n')[0].replace(/\s+/g, ' ').trim();
    if (firstParagraph.length > 30) {
      return firstParagraph;
    }
  }
  
  // Use repository description if available
  if (description && description.length > 10) {
    return description;
  }
  
  // Make an educated guess based on available information
  const techString = technologies.join(', ');
  
  if (keyFiles.includes('next.config.js') || technologies.includes('Next.js')) {
    return `A Next.js web application using ${techString}.`;
  } else if (technologies.includes('React')) {
    return `A React web application using ${techString}.`;
  } else if (technologies.includes('Express') || technologies.includes('NestJS')) {
    return `A backend/API server built with ${techString}.`;
  } else if (keyFiles.includes('package.json') && technologies.length > 0) {
    return `A JavaScript/TypeScript project using ${techString}.`;
  }
  
  return "A software project whose main purpose couldn't be automatically determined.";
}