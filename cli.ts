import { RepositoryAnalyzer } from './repository-analyzer';

// Parse command line arguments
const args = process.argv.slice(2);
const helpText = `
Repository Analyzer - Generate context about Git repositories for LLMs

Usage:
  npx ts-node cli.ts <repository-url> [options]

Options:
  --output-file <path>     Save output to a file (default: prints to console)
  --commit <hash>          Analyze a specific commit (default: latest)
  --depth <number>         Number of commits to analyze (default: 10)
  --max-file-size <kb>     Maximum file size in KB to include (default: 500)
  --help                   Show this help message
`;

// Display help
if (args.includes('--help') || args.length === 0) {
  console.log(helpText);
  process.exit(0);
}

// Get repository URL (first non-flag argument)
const repoUrl = args.find(arg => !arg.startsWith('--'));

if (!repoUrl) {
  console.error('Error: Repository URL is required');
  console.log(helpText);
  process.exit(1);
}

// Parse options
const getOptionValue = (flag: string) => {
  const index = args.indexOf(flag);
  return index !== -1 && index < args.length - 1 ? args[index + 1] : undefined;
};

const options = {
  outputFile: getOptionValue('--output-file'),
  commitHash: getOptionValue('--commit'),
  depth: parseInt(getOptionValue('--depth') || '10'),
  maxFileSize: parseInt(getOptionValue('--max-file-size') || '500'),
};

async function main() {
  console.log(`Analyzing repository: ${repoUrl}`);
  
  const analyzer = new RepositoryAnalyzer(repoUrl || '');
  
  try {
    // Analyze the repository
    const context = await analyzer.analyzeRepository({
      commitCount: options.depth,
      maxFileSize: options.maxFileSize,
      ignorePatterns: ['.git', 'node_modules', 'dist', 'build']
    });
    
    // Get the markdown insights
    const markdown = context.insightsMarkdown;
    
    // Output to file or console
    if (options.outputFile) {
      const fs = require('fs');
      fs.writeFileSync(options.outputFile, markdown);
      console.log(`Repository analysis saved to ${options.outputFile}`);
    } else {
      console.log('\n' + markdown);
    }
    
    console.log('\nAnalysis complete!');
  } catch (error) {
    console.error('Error analyzing repository:', error);
  } finally {
    // Clean up
    await analyzer.cleanup();
  }
}

// Run the analysis
main().catch(console.error); 