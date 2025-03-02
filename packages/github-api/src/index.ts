// packages/github-api/src/index.ts
import { Octokit } from '@octokit/rest';
import { createOAuthAppAuth } from '@octokit/auth-oauth-app';
import NodeCache from 'node-cache';
import { config } from 'dotenv';

config();

// Types
export interface GitHubAuth {
  clientId: string;
  clientSecret: string;
  token?: string;
}

export interface RepoInfo {
  owner: string;
  repo: string;
}


// Cache for API responses
const cache = new NodeCache({ stdTTL: 600, checkperiod: 60 });
// bro this is the github api 

export class GitHubAPI {
  private octokit: Octokit;
  private readonly cacheEnabled: boolean;
  private rateLimitRemaining: number = 5000;
  private rateLimitReset: number = 0;

  constructor(auth: GitHubAuth, cacheEnabled: boolean = true) {
    this.cacheEnabled = cacheEnabled;

    if (auth.token) {
      this.octokit = new Octokit({
        auth: auth.token,
      });
    } else {
      this.octokit = new Octokit({
        authStrategy: createOAuthAppAuth,
        auth: {
          clientId: auth.clientId,
          clientSecret: auth.clientSecret,
        },
      });
    }

    // Set up rate limit handling
    this.octokit.hook.after('request', (response) => {
      this.rateLimitRemaining = parseInt(response.headers['x-ratelimit-remaining'] || '0', 10);
      this.rateLimitReset = parseInt(response.headers['x-ratelimit-reset'] || '0', 10);
    });
  }

  private shouldThrottle(): boolean {
    // If we have less than 100 requests remaining, we should start being careful
    if (this.rateLimitRemaining < 100) {
      const now = Math.floor(Date.now() / 1000);
      const timeToReset = this.rateLimitReset - now;
      
      // If reset is soon (< 10 minutes), wait
      if (timeToReset < 600 && timeToReset > 0) {
        console.warn(`Rate limit critical (${this.rateLimitRemaining} remaining). Throttling for ${timeToReset} seconds.`);
        return true;
      }
    }
    return false;
  }

 /**
   * Get the list of repositories for the authenticated user
   * @returns Array of repositories
   */
 async getUserRepos(): Promise<string[]> {
    try {
      const response = await this.octokit.repos.listForAuthenticatedUser();
      return response.data.map(repo => repo.name);
    } catch (error) {
      console.error("Error fetching repositories:", error);
      throw error;
    }
  }


 

  /**
   * Clear cache for a specific repository
   * @param repoInfo Repository information
   */
  clearRepoCache(repoInfo: RepoInfo): void {
    if (!this.cacheEnabled) return;

    const prefix = `${repoInfo.owner}:${repoInfo.repo}`;
    const keys = cache.keys();
    
    for (const key of keys) {
      if (key.includes(prefix)) {
        cache.del(key);
      }
    }
  }
}

// Export default instance with env vars for easy usage
export default new GitHubAPI({
  clientId: process.env.GITHUB_CLIENT_ID || '',
  clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
  token: process.env.GITHUB_TOKEN,
});