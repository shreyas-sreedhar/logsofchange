import { Octokit } from '@octokit/rest';

/**
 * Creates an Octokit instance with the provided access token
 */
export function createOctokit(accessToken: string) {
  return new Octokit({
    auth: accessToken,
    headers: {
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });
}

/**
 * Get repositories for the authenticated user
 */
export async function getUserRepositories(accessToken: string, options: {
  page?: number;
  perPage?: number;
  sort?: 'created' | 'updated' | 'pushed' | 'full_name';
  direction?: 'asc' | 'desc';
} = {}) {
  const octokit = createOctokit(accessToken);
  const { page = 1, perPage = 100, sort = 'updated', direction = 'desc' } = options;
  
  const response = await octokit.request('GET /user/repos', {
    per_page: perPage,
    page,
    sort,
    direction,
    type: 'all'
  });
  
  return response.data;
}

/**
 * Get repositories for a specific user
 */
export async function getUserRepositoriesByUsername(accessToken: string, username: string, options: {
  page?: number;
  perPage?: number;
  sort?: 'created' | 'updated' | 'pushed' | 'full_name';
  direction?: 'asc' | 'desc';
} = {}) {
  const octokit = createOctokit(accessToken);
  const { page = 1, perPage = 100, sort = 'updated', direction = 'desc' } = options;
  
  const response = await octokit.request('GET /users/{username}/repos', {
    username,
    per_page: perPage,
    page,
    sort,
    direction,
    type: 'all'
  });
  
  return response.data;
}

/**
 * Get a repository by ID
 */
export async function getRepositoryById(accessToken: string, repoId: number) {
  const octokit = createOctokit(accessToken);
  
  const response = await octokit.request('GET /repositories/{repository_id}', {
    repository_id: repoId
  });
  
  return response.data;
}

/**
 * Get a repository by owner and repo name
 */
export async function getRepositoryByName(accessToken: string, owner: string, repo: string) {
  const octokit = createOctokit(accessToken);
  
  const response = await octokit.request('GET /repos/{owner}/{repo}', {
    owner,
    repo
  });
  
  return response.data;
}

/**
 * Get commits for a repository
 */
export async function getRepositoryCommits(accessToken: string, owner: string, repo: string, options: {
  since?: string;
  until?: string;
  page?: number;
  perPage?: number;
  sha?: string;
} = {}) {
  const octokit = createOctokit(accessToken);
  const { since, until, page = 1, perPage = 100, sha } = options;
  
  const response = await octokit.request('GET /repos/{owner}/{repo}/commits', {
    owner,
    repo,
    since,
    until,
    page,
    per_page: perPage,
    sha
  });
  
  return response.data;
}

/**
 * Get contributors for a repository
 */
export async function getRepositoryContributors(accessToken: string, owner: string, repo: string, options: {
  page?: number;
  perPage?: number;
} = {}) {
  const octokit = createOctokit(accessToken);
  const { page = 1, perPage = 100 } = options;
  
  const response = await octokit.request('GET /repos/{owner}/{repo}/contributors', {
    owner,
    repo,
    page,
    per_page: perPage
  });
  
  return response.data;
}

/**
 * Get pull requests for a repository
 * Useful for fetching PR titles and metadata for context
 */
export async function getRepositoryPullRequests(accessToken: string, owner: string, repo: string, options: {
  base?: string;
  state?: 'open' | 'closed' | 'all';
  sort?: 'created' | 'updated' | 'popularity' | 'long-running';
  direction?: 'asc' | 'desc';
  page?: number;
  perPage?: number;
  since?: string;
} = {}) {
  const octokit = createOctokit(accessToken);
  const { 
    base = 'main', 
    state = 'closed', 
    sort = 'updated', 
    direction = 'desc', 
    page = 1, 
    perPage = 30,
    since
  } = options;
  
  const response = await octokit.request('GET /repos/{owner}/{repo}/pulls', {
    owner,
    repo,
    base,
    state,
    sort,
    direction,
    page,
    per_page: perPage,
    ...(since ? { since } : {})
  });
  
  return response.data;
}

/**
 * Calculate commit frequency (commits per day)
 */
export function calculateCommitFrequency(commits: any[]) {
  if (commits.length < 2) return 0;
  const firstCommitDate = new Date(commits[commits.length - 1].commit.author.date);
  const lastCommitDate = new Date(commits[0].commit.author.date);
  const daysDifference = (lastCommitDate.getTime() - firstCommitDate.getTime()) / (1000 * 60 * 60 * 24);
  return daysDifference > 0 ? commits.length / daysDifference : commits.length;
}

/**
 * Get top contributors
 */
export function getTopContributors(contributors: any[], count: number) {
  return contributors
    .sort((a, b) => b.contributions - a.contributions)
    .slice(0, count)
    .map((contributor) => ({
      login: contributor.login,
      contributions: contributor.contributions,
      avatarUrl: contributor.avatar_url,
    }));
} 