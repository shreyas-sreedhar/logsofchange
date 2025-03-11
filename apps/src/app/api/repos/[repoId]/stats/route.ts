import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { 
  getRepositoryById, 
  getRepositoryCommits, 
  getRepositoryContributors,
  calculateCommitFrequency,
  getTopContributors
} from "../../../../lib/github";

/**
 * Repository Statistics API endpoint
 * GET: Get statistics for a specific repository
 */

// GET: Get statistics for a specific repository
export async function GET(
  request: NextRequest,
  { params }: { params: { repoId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized - No access token" }, { status: 401 });
    }

    const { repoId } = params;
    
    console.log("Repository Statistics API Request:", {
      path: request.nextUrl.pathname,
      repoId,
      sessionUserId: session.user?.id,
      sessionUserLogin: session.user?.login
    });

    // Fetch repository details using Octokit
    const repo = await getRepositoryById(session.accessToken, parseInt(repoId));
    const owner = repo.owner.login;
    const repoName = repo.name;
    
    // Fetch recent commits (last 100)
    const commits = await getRepositoryCommits(session.accessToken, owner, repoName, {
      perPage: 100
    });
    
    // Fetch contributors
    const contributors = await getRepositoryContributors(session.accessToken, owner, repoName, {
      perPage: 100
    });
    
    // Calculate statistics
    const commitFrequency = calculateCommitFrequency(commits);
    const topContributorsList = getTopContributors(contributors, 5);
    
    // Get the most recent commit
    const latestCommit = commits.length > 0 ? {
      sha: commits[0].sha,
      message: commits[0].commit.message,
      author: {
        name: commits[0].commit.author.name,
        date: commits[0].commit.author.date
      },
      url: commits[0].html_url
    } : null;
    
    // Calculate language percentages (if available)
    const languages = repo.language ? { [repo.language]: 100 } : {};
    
    // Prepare statistics response
    const statistics = {
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      stars: repo.stargazers_count,
      forks: repo.forks_count,
      watchers: repo.watchers_count,
      openIssues: repo.open_issues_count,
      defaultBranch: repo.default_branch,
      createdAt: repo.created_at,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      language: repo.language,
      languages: languages,
      isPrivate: repo.private,
      hasIssues: repo.has_issues,
      hasProjects: repo.has_projects,
      hasWiki: repo.has_wiki,
      commitFrequency: commitFrequency,
      totalCommits: commits.length,
      totalContributors: contributors.length,
      topContributors: topContributorsList,
      latestCommit: latestCommit,
      owner: {
        id: repo.owner.id,
        login: repo.owner.login,
        avatarUrl: repo.owner.avatar_url,
        url: repo.owner.html_url
      }
    };

    return NextResponse.json(statistics);
  } catch (error) {
    console.error("Error fetching repository statistics:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 