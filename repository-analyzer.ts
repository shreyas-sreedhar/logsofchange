import * as fs from 'fs';
import * as path from 'path';
import simpleGit, { SimpleGit } from 'simple-git';

export interface FileData {
    name: string;
    path: string;
    type: 'file' | 'directory';
    children?: FileData[];
    content?: string;
    size?: number;
    lastModified?: Date;
    fileType?: string;
}

export interface CommitInfo {
    hash: string;
    date: string;
    message: string;
    author: string;
    email?: string;
}

export interface FileChange {
    path: string;
    status: 'added' | 'modified' | 'deleted';
    additions?: number;
    deletions?: number;
    diff?: string;
    content?: string;
}

export interface RepositoryContext {
    repositoryUrl: string;
    repositoryName: string;
    description?: string;
    readme?: string;
    defaultBranch?: string;
    commits: CommitInfo[];
    fileChanges: FileChange[];
    fileStructure: FileData[];
    insightsMarkdown: string;
}

export class RepositoryAnalyzer {
    private git: SimpleGit;
    private repoUrl: string;
    private repoPath: string;
    private repoName: string;

    constructor(repoUrl: string, localPath?: string) {
        this.repoUrl = repoUrl;
        this.repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'repo';
        this.repoPath = localPath || `./${this.repoName}`;
        this.git = simpleGit();
    }

    public async initialize(): Promise<void> {
        if (fs.existsSync(this.repoPath)) {
            console.log(`Repository already exists at ${this.repoPath}`);
            // Initialize git in the existing directory
            this.git = simpleGit(this.repoPath);
        } else {
            console.log(`Cloning repository to ${this.repoPath}`);
            await this.cloneRepository();
        }
    }

    private async cloneRepository(): Promise<void> {
        await this.git.clone(this.repoUrl, this.repoPath);
        console.log(`Repository cloned to ${this.repoPath}`);
        this.git = simpleGit(this.repoPath);
    }

    public async analyzeRepository(options: {
        commitCount?: number;
        includeFileContent?: boolean;
        maxFileSize?: number; // in KB
        ignorePatterns?: string[];
    } = {}): Promise<RepositoryContext> {
        const {
            commitCount = 10,
            includeFileContent = true,
            maxFileSize = 500, // 500KB
            ignorePatterns = ['.git', 'node_modules', 'dist', 'build']
        } = options;

        await this.initialize();

        // Get repository info
        const defaultBranch = await this.getDefaultBranch();
        const readme = await this.getReadmeContent();
        
        // Get commit history
        const commits = await this.getCommitHistory(commitCount);
        
        // Get file changes from recent commits
        const fileChanges = await this.getFileChanges(commits);
        
        // Get file structure
        const fileStructure = this.scrapeDirectoryToJson(
            this.repoPath, 
            ignorePatterns, 
            includeFileContent, 
            maxFileSize
        );

        // Generate insights
        const insightsMarkdown = this.generateInsightsMarkdown({
            commits,
            fileChanges,
            fileStructure,
            readme,
            defaultBranch
        });

        return {
            repositoryUrl: this.repoUrl,
            repositoryName: this.repoName,
            description: await this.getRepositoryDescription(),
            readme,
            defaultBranch,
            commits,
            fileChanges,
            fileStructure,
            insightsMarkdown
        };
    }

    private async getDefaultBranch(): Promise<string> {
        try {
            const branches = await this.git.branch();
            return branches.current || 'main';
        } catch (error) {
            console.error('Error getting default branch:', error);
            return 'main'; // Default fallback
        }
    }

    private async getRepositoryDescription(): Promise<string | undefined> {
        try {
            // Try to get description from package.json if it exists
            const packageJsonPath = path.join(this.repoPath, 'package.json');
            if (fs.existsSync(packageJsonPath)) {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
                if (packageJson.description) {
                    return packageJson.description;
                }
            }
            return undefined;
        } catch (error) {
            console.error('Error getting repository description:', error);
            return undefined;
        }
    }

    private async getReadmeContent(): Promise<string | undefined> {
        try {
            // Look for README files (case insensitive)
            const files = fs.readdirSync(this.repoPath);
            const readmeFile = files.find(file => 
                file.toLowerCase().startsWith('readme') && 
                (file.toLowerCase().endsWith('.md') || file.toLowerCase().endsWith('.txt'))
            );
            
            if (readmeFile) {
                return fs.readFileSync(path.join(this.repoPath, readmeFile), 'utf-8');
            }
            return undefined;
        } catch (error) {
            console.error('Error getting README content:', error);
            return undefined;
        }
    }

    private async getCommitHistory(count: number): Promise<CommitInfo[]> {
        try {
            const log = await this.git.log({ maxCount: count });
            return log.all.map((commit: any) => ({
                hash: commit.hash,
                date: commit.date,
                message: commit.message,
                author: commit.author_name,
                email: commit.author_email
            }));
        } catch (error) {
            console.error('Error getting commit history:', error);
            return [];
        }
    }

    private async getFileChanges(commits: CommitInfo[]): Promise<FileChange[]> {
        if (commits.length < 2) {
            return [];
        }

        const changes: FileChange[] = [];
        
        // Analyze last commit changes
        const latestCommit = commits[0];
        const previousCommit = commits[1];
        
        try {
            // Get diff between latest and previous commit
            const diff = await this.git.diff([`${previousCommit.hash}..${latestCommit.hash}`, '--name-status']);
            const diffStats = await this.git.diffSummary([`${previousCommit.hash}..${latestCommit.hash}`]);
            const fullDiff = await this.git.diff([`${previousCommit.hash}..${latestCommit.hash}`]);
            
            // Parse name-status output to get changed files
            const statusLines = diff.trim().split('\n').filter(line => line.trim());
            
            for (const line of statusLines) {
                const [status, ...pathParts] = line.trim().split('\t');
                const filePath = pathParts.join('\t'); // Handle paths with tabs
                
                if (!filePath) continue;
                
                let fileStatus: 'added' | 'modified' | 'deleted';
                if (status.startsWith('A')) fileStatus = 'added';
                else if (status.startsWith('M')) fileStatus = 'modified';
                else if (status.startsWith('D')) fileStatus = 'deleted';
                else continue; // Skip other statuses
                
                // Find stat for this file
                const fileStat = diffStats.files.find((f: any) => f.file === filePath);
                
                // Extract diff for this file
                const fileDiff = this.extractFileDiff(fullDiff, filePath);
                
                let fileContent: string | undefined;
                if (fileStatus !== 'deleted') {
                    try {
                        // Checkout latest commit to get file content
                        await this.git.checkout([latestCommit.hash]);
                        const filePath2 = path.join(this.repoPath, filePath);
                        if (fs.existsSync(filePath2)) {
                            fileContent = fs.readFileSync(filePath2, 'utf-8');
                        }
                    } catch (error) {
                        console.error(`Error getting content for ${filePath}:`, error);
                    }
                }
                
                changes.push({
                    path: filePath,
                    status: fileStatus,
                    additions: fileStat ? (fileStat as any).insertions : undefined,
                    deletions: fileStat ? (fileStat as any).deletions : undefined,
                    diff: fileDiff,
                    content: fileContent
                });
            }
            
            // Checkout back to default branch
            const defaultBranch = await this.getDefaultBranch();
            await this.git.checkout([defaultBranch]);
            
        } catch (error) {
            console.error('Error getting file changes:', error);
        }
        
        return changes;
    }

    private extractFileDiff(fullDiff: string, filePath: string): string {
        // Escape special regex characters in the file path
        const escapedPath = filePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Pattern to match diff section for this file
        const diffPattern = new RegExp(
            `diff --git a/${escapedPath} b/${escapedPath}[\\s\\S]*?(?=diff --git|$)`, 
            'g'
        );
        
        const matches = fullDiff.match(diffPattern);
        return matches ? matches[0] : '';
    }

    private shouldIgnoreFile(fileName: string, maxFileSize?: number, filePath?: string): boolean {
        const lowerCaseFileName = fileName.toLowerCase();
        
        // Check file size if path is provided and maxFileSize is set
        if (maxFileSize && filePath && fs.existsSync(filePath)) {
            const stats = fs.statSync(filePath);
            if (stats.size > maxFileSize * 1024) {
                return true;
            }
        }
        
        return (
            lowerCaseFileName === 'package-lock.json' ||
            lowerCaseFileName === 'yarn.lock' ||
            lowerCaseFileName.endsWith('.pdf') ||
            lowerCaseFileName.endsWith('.png') ||
            lowerCaseFileName.endsWith('.jpg') ||
            lowerCaseFileName.endsWith('.jpeg') ||
            lowerCaseFileName.endsWith('.gif') ||
            lowerCaseFileName.endsWith('.ico') ||
            lowerCaseFileName.endsWith('.svg') ||
            lowerCaseFileName.endsWith('.woff') ||
            lowerCaseFileName.endsWith('.woff2') ||
            lowerCaseFileName.endsWith('.eot') ||
            lowerCaseFileName.endsWith('.ttf') ||
            lowerCaseFileName.endsWith('.otf') ||
            lowerCaseFileName.endsWith('.mp4') ||
            lowerCaseFileName.endsWith('.avi') ||
            lowerCaseFileName.endsWith('.webm') ||
            lowerCaseFileName.endsWith('.mov') ||
            lowerCaseFileName.endsWith('.mp3') ||
            lowerCaseFileName.endsWith('.wav') ||
            lowerCaseFileName.endsWith('.flac') ||
            lowerCaseFileName.endsWith('.ogg') ||
            lowerCaseFileName.endsWith('.webp') ||
            lowerCaseFileName.startsWith('package-lock') ||
            lowerCaseFileName.startsWith('yarn-lock') ||
            lowerCaseFileName.startsWith('npm-debug') ||
            lowerCaseFileName.startsWith('yarn-debug') ||
            lowerCaseFileName.startsWith('yarn-error') ||
            lowerCaseFileName.startsWith('tsconfig') ||
            lowerCaseFileName.startsWith('jest.config') 
        );
    }

    private scrapeDirectoryToJson(
        dir: string, 
        ignorePatterns: string[] = [],
        includeContent: boolean = false,
        maxFileSize?: number
    ): FileData[] {
        try {
            const files = fs.readdirSync(dir);
            return files.filter(file => {
                const filePath = path.join(dir, file);
                return (
                    !ignorePatterns.some(pattern => filePath.includes(pattern)) &&
                    !this.shouldIgnoreFile(file, maxFileSize, filePath)
                );
            }).map(file => {
                const filePath = path.join(dir, file);
                const stat = fs.statSync(filePath);
                
                if (stat.isDirectory()) {
                    return {
                        name: file,
                        path: path.relative(this.repoPath, filePath),
                        type: 'directory',
                        lastModified: stat.mtime,
                        children: this.scrapeDirectoryToJson(filePath, ignorePatterns, includeContent, maxFileSize)
                    };
                } else {
                    // Get file extension
                    const fileType = path.extname(file).substring(1);
                    
                    // Only include content if requested and file size is below limit
                    let content: string | undefined;
                    if (includeContent && (!maxFileSize || stat.size <= maxFileSize * 1024)) {
                        try {
                            content = fs.readFileSync(filePath, 'utf-8');
                        } catch (error) {
                            console.error(`Error reading file ${filePath}:`, error);
                        }
                    }
                    
                    return {
                        name: file,
                        path: path.relative(this.repoPath, filePath),
                        type: 'file',
                        size: stat.size,
                        lastModified: stat.mtime,
                        fileType,
                        content
                    };
                }
            }).filter(item => item !== null) as FileData[];
        } catch (error) {
            console.error(`Error scraping directory ${dir}:`, error);
            return [];
        }
    }

    private generateInsightsMarkdown(data: {
        commits: CommitInfo[],
        fileChanges: FileChange[],
        fileStructure: FileData[],
        readme?: string,
        defaultBranch?: string
    }): string {
        let markdown = `# Repository Analysis: ${this.repoName}\n\n`;
        
        // Repository overview
        markdown += `## Repository Overview\n\n`;
        markdown += `- **Repository URL:** ${this.repoUrl}\n`;
        markdown += `- **Default Branch:** ${data.defaultBranch || 'main'}\n`;
        
        // File structure summary
        markdown += this.generateFileStructureSummary(data.fileStructure);
        
        // Recent commits
        markdown += `\n## Recent Commits\n\n`;
        for (const commit of data.commits.slice(0, 5)) {
            markdown += `### ${commit.hash.substring(0, 7)} - ${commit.date}\n`;
            markdown += `**Author:** ${commit.author}\n\n`;
            markdown += `**Message:**\n${commit.message}\n\n`;
        }
        
        // File changes
        if (data.fileChanges.length > 0) {
            markdown += `\n## Recent Changes\n\n`;
            markdown += `The following files were changed in the most recent commit:\n\n`;
            
            for (const change of data.fileChanges) {
                markdown += `### ${change.path} (${change.status})\n`;
                
                if (change.additions !== undefined || change.deletions !== undefined) {
                    markdown += `**Changes:** `;
                    if (change.additions !== undefined) markdown += `+${change.additions} `;
                    if (change.deletions !== undefined) markdown += `-${change.deletions} `;
                    markdown += `\n\n`;
                }
                
                if (change.diff) {
                    markdown += `\`\`\`diff\n${change.diff}\n\`\`\`\n\n`;
                }
            }
        }
        
        // README content
        if (data.readme) {
            markdown += `\n## README\n\n${data.readme}\n\n`;
        }
        
        return markdown;
    }
    
    private generateFileStructureSummary(fileStructure: FileData[]): string {
        let markdown = `\n## Project Structure\n\n`;
        
        // Get top-level directories
        const directories = fileStructure.filter(item => item.type === 'directory');
        const files = fileStructure.filter(item => item.type === 'file');
        
        // Summarize top directories
        if (directories.length > 0) {
            markdown += `### Key Directories\n\n`;
            for (const dir of directories) {
                markdown += `- **${dir.name}/** - ${this.countFiles(dir)} files\n`;
            }
        }
        
        // Summarize key files
        if (files.length > 0) {
            markdown += `\n### Key Files\n\n`;
            const keyFiles = files.filter(file => {
                const name = file.name.toLowerCase();
                return (
                    name === 'package.json' || 
                    name === 'tsconfig.json' || 
                    name === '.env.example' ||
                    name.includes('webpack') ||
                    name.includes('babel') ||
                    name.includes('docker') ||
                    name === 'makefile'
                );
            });
            
            for (const file of keyFiles) {
                markdown += `- **${file.name}**\n`;
            }
        }
        
        return markdown;
    }
    
    private countFiles(directory: FileData): number {
        if (!directory.children) return 0;
        
        let count = 0;
        for (const item of directory.children) {
            if (item.type === 'file') {
                count++;
            } else if (item.children) {
                count += this.countFiles(item);
            }
        }
        
        return count;
    }

    public async cleanup(): Promise<void> {
        if (fs.existsSync(this.repoPath)) {
            fs.rmdirSync(this.repoPath, { recursive: true });
            console.log(`Removed cloned repository at ${this.repoPath}`);
        }
    }
    
    /**
     * Checkout a specific commit hash
     */
    public async checkoutCommit(commitHash: string): Promise<void> {
        await this.git.checkout([commitHash]);
        console.log(`Checked out commit: ${commitHash}`);
    }
}

// Example usage
async function analyzeGitRepository(repoUrl: string): Promise<string> {
    const analyzer = new RepositoryAnalyzer(repoUrl);
    
    try {
        const context = await analyzer.analyzeRepository({
            commitCount: 10,
            includeFileContent: true,
            maxFileSize: 500, // 500KB
            ignorePatterns: ['.git', 'node_modules', 'dist', 'build']
        });
        
        // Return the markdown insights
        return context.insightsMarkdown;
    } finally {
        // Clean up the cloned repository
        await analyzer.cleanup();
    }
}

export async function sendToLLM(repositoryUrl: string, apiEndpoint: string, apiKey: string): Promise<any> {
    // Analyze the repository and get insights markdown
    const insightsMarkdown = await analyzeGitRepository(repositoryUrl);
    
    // Example API call to send to LLM
    const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "your-model-id",
            messages: [
                {
                    role: "system",
                    content: "You are a repository analysis assistant that can provide insights about codebases."
                },
                {
                    role: "user",
                    content: `Please analyze this repository and provide insights about its structure, recent changes, and development patterns:\n\n${insightsMarkdown}`
                }
            ]
        })
    });
    
    return response.json();
} 