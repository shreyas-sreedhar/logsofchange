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

### Inline Functions for Applications

For applications that need to analyze repositories programmatically without CLI tools, use the inline functions:

```typescript
import { analyzeRepository, analyzeRepositoryWithLLM } from './inline-analyzer';
import { OpenAIProvider } from './llm-integration';

// Basic repository analysis
async function analyzeRepo() {
  const result = await analyzeRepository({
    repositoryUrl: 'https://github.com/username/repository',
    commitCount: 5,
    maxFileSize: 300
  });
  
  console.log(result.markdown); // Formatted markdown with repository insights
}

// Repository analysis with LLM insights
async function getAIInsights() {
  const llmProvider = new OpenAIProvider('your-api-key');
  
  const result = await analyzeRepositoryWithLLM({
    repositoryUrl: 'https://github.com/username/repository',
    llmProvider,
    llmOptions: { temperature: 0.5 }
  });
  
  console.log(result.llmAnalysis); // AI-generated insights
}
```

### API Server

The project includes a ready-to-use Express API server for hosted environments:

```bash
# First, create your .env file from the example
cp .env.example .env
# Edit .env to add your API keys

# Start the API server
npm run start:api
```

#### API Endpoints

The server provides the following endpoints:

- `GET /health` - Health check endpoint
- `POST /api/analyze` - Basic repository analysis
- `POST /api/analyze/llm` - LLM-enhanced repository analysis

Example API requests:

```bash
# Basic repository analysis
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"repositoryUrl": "https://github.com/username/repository"}'

# LLM-enhanced analysis with OpenAI
curl -X POST http://localhost:3000/api/analyze/llm \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/username/repository", 
    "provider": "openai", 
    "apiKey": "your-api-key"
  }'
```

### Database Storage and JSON Export

The tool now supports storing analyses in a PostgreSQL database and exporting them as JSON files:

```typescript
import { analyzeRepository } from './inline-analyzer';

// Store in database and export as JSON
const result = await analyzeRepository({
  repositoryUrl: 'https://github.com/username/repository',
  storeInDatabase: true,
  exportJson: true,
  metadata: {
    projectId: '12345',
    category: 'frontend'
  }
});

console.log(`Analysis ID: ${result.analysisId}`);
console.log(`JSON file: ${result.jsonPath}`);

// Retrieve previously stored analysis
import { getStoredAnalysis, listRepositoryAnalyses } from './inline-analyzer';

// Get a specific analysis
const analysis = await getStoredAnalysis(123);

// List all analyses for a repository
const analyses = await listRepositoryAnalyses('https://github.com/username/repository');
```

### Enhanced API Endpoints

The API server now includes endpoints for database and JSON operations:

```bash
# Store analysis in database and export as JSON
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "repositoryUrl": "https://github.com/username/repository",
    "storeInDatabase": true,
    "exportJson": true
  }'

# Get a specific analysis by ID
curl -X GET http://localhost:3000/api/analyses/123

# List all analyses for a repository
curl -X GET http://localhost:3000/api/repositories/https%3A%2F%2Fgithub.com%2Fusername%2Frepository/analyses

# Get a specific JSON file
curl -X GET http://localhost:3000/api/json/repository-name-2023-04-01T12-34-56Z.json
```

### Database Setup

The tool uses PostgreSQL for storing repository analyses:

```bash
# Create a .env file with database configuration
cp .env.example .env
# Edit .env to add your database URL

# Initialize the database schema
npm run db:init
```

The database schema includes two tables:
- `repositories` - stores information about analyzed repositories
- `analyses` - stores the analysis results linked to repositories

## How It Works

1. **Repository Cloning**: The tool clones the target repository locally
2. **Structure Analysis**: It analyzes the repository's file structure and organization
3. **Commit Analysis**: It examines recent commits to understand changes
4. **Diff Generation**: It generates detailed diffs of file changes
5. **Markdown Formatting**: All information is formatted into clean, structured markdown
6. **LLM Integration**: The markdown context is sent to an LLM for deeper insights

## License

ISC
