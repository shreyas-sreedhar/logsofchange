import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../auth";
import { getUserRepositories } from "../../lib/github";

/**
 * Repositories API endpoint
 * GET: List all repositories for the authenticated user
 * POST: Add a repository to the user's tracked repositories (placeholder)
 */

// GET: List all repositories for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.accessToken || !session?.user?.login) {
      return NextResponse.json({ error: "Unauthorized - No access token or user login" }, { status: 401 });
    }

    // Get query parameters for pagination
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const sort = url.searchParams.get("sort") as 'created' | 'updated' | 'pushed' | 'full_name' || "updated";
    const direction = url.searchParams.get("direction") as 'asc' | 'desc' || "desc";
    
    console.log("Repos API Request:", {
      path: request.nextUrl.pathname,
      sessionUserId: session.user?.id,
      sessionUserLogin: session.user?.login,
      page,
      limit,
      sort,
      direction
    });

    // Fetch repositories using Octokit
    const repos = await getUserRepositories(session.accessToken, {
      page,
      perPage: limit,
      sort,
      direction
    });

    // Transform the response to include only the data we need
    const transformedRepos = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      owner: {
        id: repo.owner.id,
        login: repo.owner.login,
        avatarUrl: repo.owner.avatar_url
      },
      stars: repo.stargazers_count,
      updatedAt: repo.updated_at,
      private: repo.private,
      description: repo.description,
      language: repo.language,
      defaultBranch: repo.default_branch,
    }));

    return NextResponse.json({
      repos: transformedRepos,
      pagination: {
        total: transformedRepos.length,
        page,
        limit,
      }
    });
  } catch (error) {
    console.error("Error fetching repositories:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

// POST: Add a repository to the user's tracked repositories (placeholder)
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { repoId, repoName } = body;

    if (!repoId || !repoName) {
      return NextResponse.json({ error: "Repository ID and name are required" }, { status: 400 });
    }

    console.log("Add Repository Request:", {
      repoId,
      repoName,
      sessionUserId: session.user?.id,
      sessionUserLogin: session.user?.login
    });
    
    // Here you would add logic to track this repository in your database
    
    return NextResponse.json({ 
      success: true,
      repo: {
        id: repoId,
        name: repoName,
        addedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error("Error adding repository:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 