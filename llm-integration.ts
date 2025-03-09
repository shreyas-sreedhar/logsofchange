import { RepositoryAnalyzer } from './repository-analyzer';
import fetch from 'node-fetch';
import * as fs from 'fs';

export interface LLMProvider {
  name: string;
  analyze(markdown: string, options?: any): Promise<string>;
}

// OpenAI (GPT) implementation
export class OpenAIProvider implements LLMProvider {
  name = 'OpenAI';
  private apiKey: string;
  private model: string;
  
  constructor(apiKey: string, model: string = 'gpt-4-turbo') {
    this.apiKey = apiKey;
    this.model = model;
  }
  
  async analyze(markdown: string, options: { temperature?: number } = {}): Promise<string> {
    const { temperature = 0.7 } = options;
    
    const systemPrompt = `You are a repository analysis assistant that understands code, commit patterns, 
    and can provide insights about repositories. Analyze the following repository details and provide 
    a comprehensive analysis that includes:
    
    1. The main purpose and functionality of the repository
    2. Key architectural patterns and design choices
    3. Notable recent changes and their impact
    4. Potential areas for improvement or technical debt
    5. Any security concerns or best practices that should be addressed
    
    Be specific, technical, and substantive in your analysis.`;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: markdown }
        ],
        temperature
      })
    });
    
    const result = await response.json() as any;
    
    if (!result.choices || !result.choices[0]) {
      throw new Error(`OpenAI API error: ${JSON.stringify(result)}`);
    }
    
    return result.choices[0].message.content;
  }
}

// Anthropic (Claude) implementation
export class AnthropicProvider implements LLMProvider {
  name = 'Anthropic';
  private apiKey: string;
  private model: string;
  
  constructor(apiKey: string, model: string = 'claude-3-haiku-20240307') {
    this.apiKey = apiKey;
    this.model = model;
  }
  
  async analyze(markdown: string, options: { temperature?: number } = {}): Promise<string> {
    const { temperature = 0.7 } = options;
    
    const systemPrompt = `You are a repository analysis assistant that understands code, commit patterns, 
    and can provide insights about repositories. Analyze the following repository details and provide 
    a comprehensive analysis that includes:
    
    1. The main purpose and functionality of the repository
    2. Key architectural patterns and design choices
    3. Notable recent changes and their impact
    4. Potential areas for improvement or technical debt
    5. Any security concerns or best practices that should be addressed
    
    Be specific, technical, and substantive in your analysis.`;
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        system: systemPrompt,
        messages: [
          { role: 'user', content: markdown }
        ],
        temperature
      })
    });
    
    const result = await response.json() as any;
    
    if (!result.content || !result.content[0]) {
      throw new Error(`Anthropic API error: ${JSON.stringify(result)}`);
    }
    
    return result.content[0].text;
  }
}

// Example usage function
export async function analyzeRepositoryWithLLM(
  repoUrl: string, 
  provider: LLMProvider,
  options: {
    outputFile?: string;
    maxFileSize?: number;
    commitCount?: number;
  } = {}
): Promise<string> {
  const { 
    outputFile,
    maxFileSize = 500,
    commitCount = 10
  } = options;
  
  console.log(`Analyzing repository: ${repoUrl} with ${provider.name}`);
  
  // Create repository analyzer
  const analyzer = new RepositoryAnalyzer(repoUrl);
  
  try {
    // Get repository context
    const context = await analyzer.analyzeRepository({
      commitCount,
      maxFileSize,
      ignorePatterns: ['.git', 'node_modules', 'dist', 'build']
    });
    
    // Get the markdown insights
    const markdown = context.insightsMarkdown;
    
    // Save markdown to file if requested
    if (outputFile) {
      fs.writeFileSync(`${outputFile}.md`, markdown);
      console.log(`Repository analysis saved to ${outputFile}.md`);
    }
    
    // Send to LLM for analysis
    console.log(`Sending to ${provider.name} for analysis...`);
    const analysis = await provider.analyze(markdown);
    
    // Save analysis to file if requested
    if (outputFile) {
      fs.writeFileSync(`${outputFile}-analysis.md`, analysis);
      console.log(`LLM analysis saved to ${outputFile}-analysis.md`);
    }
    
    return analysis;
  } finally {
    // Clean up
    await analyzer.cleanup();
  }
}

// Example CLI usage
if (require.main === module) {
  // Parse command line args
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log(`
Usage: npx ts-node llm-integration.ts <repository-url> <provider> [options]

Providers:
  openai    - Use OpenAI's GPT models
  anthropic - Use Anthropic's Claude models

Options:
  --output-file <path>  Save output to a file (no extension needed)
  --model <model-id>    Specify the model to use
  --api-key <key>       API key (alternatively, use environment variables)
  
Environment variables:
  OPENAI_API_KEY        API key for OpenAI
  ANTHROPIC_API_KEY     API key for Anthropic
    `);
    process.exit(1);
  }
  
  const [repoUrl, providerName] = args;
  
  // Parse options
  const getArgValue = (flag: string) => {
    const index = args.indexOf(flag);
    return index !== -1 && index < args.length - 1 ? args[index + 1] : undefined;
  };
  
  const options = {
    outputFile: getArgValue('--output-file'),
    model: getArgValue('--model'),
    apiKey: getArgValue('--api-key')
  };
  
  // Create provider
  let provider: LLMProvider;
  
  if (providerName.toLowerCase() === 'openai') {
    const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('Error: OpenAI API key required. Use --api-key or set OPENAI_API_KEY environment variable.');
      process.exit(1);
    }
    provider = new OpenAIProvider(apiKey, options.model);
  } else if (providerName.toLowerCase() === 'anthropic') {
    const apiKey = options.apiKey || process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      console.error('Error: Anthropic API key required. Use --api-key or set ANTHROPIC_API_KEY environment variable.');
      process.exit(1);
    }
    provider = new AnthropicProvider(apiKey, options.model);
  } else {
    console.error(`Unsupported provider: ${providerName}. Use 'openai' or 'anthropic'.`);
    process.exit(1);
  }
  
  // Run analysis
  analyzeRepositoryWithLLM(repoUrl, provider, { outputFile: options.outputFile })
    .then(analysis => {
      if (!options.outputFile) {
        console.log('\nLLM Analysis:');
        console.log(analysis);
      }
      console.log('\nAnalysis complete!');
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
} 