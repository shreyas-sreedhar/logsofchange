# ChangeOfLogs

A sophisticated tool for generating rich, contextual information about Git repositories for LLMs.

## Features

- **Repository Structure Analysis**: Generates a comprehensive view of repository structure and organization
- **Commit History and Insights**: Analyzes recent commits and their impact
- **Change Detection**: Details what files have been changed, added, or deleted
- **Rich Markdown Context**: Generates well-formatted markdown for LLM consumption
- **LLM Integration**: Seamlessly sends repository context to LLMs for analysis

## Installation

```bash
# Clone the repository
git clone https://github.com/shreyas-sreedhar/logsofchange.git
cd logsofchange

# Install dependencies
npm install
```

## Usage

### CLI Tool

```bash
# Basic usage - analyze a repository and print results
npm run analyze -- https://github.com/username/repository

# Save analysis to a file
npm run analyze -- https://github.com/username/repository --output-file analysis.md

# Analyze a specific commit
npm run analyze -- https://github.com/username/repository --commit abc1234

# Set analysis depth (number of commits to analyze)
npm run analyze -- https://github.com/username/repository --depth 20

# Set maximum file size to include (in KB)
npm run analyze -- https://github.com/username/repository --max-file-size 1000
```

### LLM Integration CLI

The tool includes direct integration with LLM providers to analyze repositories:

```bash
# Analyze with OpenAI's GPT models
npm run analyze:llm -- https://github.com/username/repository openai --api-key your-api-key

# Analyze with Anthropic's Claude models
npm run analyze:llm -- https://github.com/username/repository anthropic --api-key your-api-key

# Specify model and save output
npm run analyze:llm -- https://github.com/username/repository openai --model gpt-4-turbo --output-file repo-analysis
```

You can also set API keys as environment variables:
```bash
export OPENAI_API_KEY="your-key-here"
export ANTHROPIC_API_KEY="your-key-here"
npm run analyze:llm -- https://github.com/username/repository openai
```

### Programmatic Usage

```typescript
import { RepositoryAnalyzer, sendToLLM } from './repository-analyzer';

// Option 1: Using the analyzer directly
async function analyzeRepo() {
  const analyzer = new RepositoryAnalyzer('https://github.com/username/repository');
  
  try {
    const repoContext = await analyzer.analyzeRepository({
      commitCount: 10,
      includeFileContent: true,
      maxFileSize: 500
    });
    
    console.log(repoContext.insightsMarkdown);
  } finally {
    await analyzer.cleanup();
  }
}

// Option 2: Using the LLM integration
async function analyzeWithLLM() {
  const response = await sendToLLM(
    'https://github.com/username/repository',
    'https://api.openai.com/v1/chat/completions',
    'your-api-key'
  );
  
  console.log(response);
}
```

## How It Works

1. **Repository Cloning**: The tool clones the target repository locally
2. **Structure Analysis**: It analyzes the repository's file structure and organization
3. **Commit Analysis**: It examines recent commits to understand changes
4. **Diff Generation**: It generates detailed diffs of file changes
5. **Markdown Formatting**: All information is formatted into clean, structured markdown
6. **LLM Integration**: The markdown context is sent to an LLM for deeper insights

## License

ISC
