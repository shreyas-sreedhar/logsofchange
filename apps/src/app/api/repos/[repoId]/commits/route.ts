import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { getRepositoryById, getRepositoryCommits } from "../../../../lib/github";

/**
 * Repository Commits API endpoint
 * GET: Get commits for a specific repository
 */

// GET: Get commits for a specific repository
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
    
    // Get query parameters
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const since = url.searchParams.get("from") || url.searchParams.get("since");
    const until = url.searchParams.get("to") || url.searchParams.get("until");
    const sha = url.searchParams.get("sha") || undefined;
    
    console.log("Repository Commits API Request:", {
      path: request.nextUrl.pathname,
      repoId,
      since,
      until,
      sha,
      page,
      limit,
      sessionUserId: session.user?.id,
      sessionUserLogin: session.user?.login
    });

    // Fetch repository details using Octokit to get owner and repo name
    const repo = await getRepositoryById(session.accessToken, parseInt(repoId));
    const owner = repo.owner.login;
    const repoName = repo.name;
    
    // Fetch commits using Octokit
    const commits = await getRepositoryCommits(session.accessToken, owner, repoName, {
      since: since ? new Date(since).toISOString() : undefined,
      until: until ? new Date(until).toISOString() : undefined,
      page,
      perPage: limit,
      sha
    });
    
    // Transform the response to include only the data we need
    const transformedCommits = commits.map(commit => ({
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        name: commit.commit.author.name,
        email: commit.commit.author.email,
        date: commit.commit.author.date
      },
      url: commit.html_url,
      stats: commit.stats ? {
        additions: commit.stats.additions,
        deletions: commit.stats.deletions,
        total: commit.stats.total
      } : undefined
    }));

    return NextResponse.json(transformedCommits);
  } catch (error) {
    console.error("Error fetching repository commits:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 