import { GitHubAPI } from './index.js';
import dotenv from 'dotenv';


dotenv.config();

async function main() {
  // Ensure GITHUB_TOKEN is set
  if (!process.env.GITHUB_TOKEN) {
    console.error('Error: GITHUB_TOKEN environment variable is required');
    process.exit(1);
  }

  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error('Usage: node cli.js <owner>');
    process.exit(1);
  }

  const owner = args[0];

  const api = new GitHubAPI({
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    token: process.env.GITHUB_TOKEN,
  });

  try {
    console.log(`Fetching repositories for GitHub user: ${owner}...`);
    const repos = await api.getUserRepos();

    console.log(`\nRepositories owned by ${owner}:`);
    repos.forEach(repoName => {
      console.log(`- ${repoName}`);
    });

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
