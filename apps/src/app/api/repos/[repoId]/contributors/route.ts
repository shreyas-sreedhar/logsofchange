import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { getRepositoryById, getRepositoryContributors, getTopContributors } from "../../../../lib/github";

/**
 * Repository Contributors API endpoint
 * GET: Get contributors for a specific repository
 */

// GET: Get contributors for a specific repository
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
    const topCount = parseInt(url.searchParams.get("top") || "0");
    
    console.log("Repository Contributors API Request:", {
      path: request.nextUrl.pathname,
      repoId,
      page,
      limit,
      topCount,
      sessionUserId: session.user?.id,
      sessionUserLogin: session.user?.login
    });

    // Fetch repository details using Octokit to get owner and repo name
    const repo = await getRepositoryById(session.accessToken, parseInt(repoId));
    const owner = repo.owner.login;
    const repoName = repo.name;
    
    // Fetch contributors using Octokit
    const contributors = await getRepositoryContributors(session.accessToken, owner, repoName, {
      page,
      perPage: limit
    });
    
    // Get top contributors if requested
    if (topCount > 0) {
      const topContributors = getTopContributors(contributors, topCount);
      return NextResponse.json(topContributors);
    }
    
    // Transform the response to include only the data we need
    const transformedContributors = contributors.map(contributor => ({
      id: contributor.id,
      login: contributor.login,
      avatarUrl: contributor.avatar_url,
      contributions: contributor.contributions,
      url: contributor.html_url,
      type: contributor.type
    }));

    return NextResponse.json(transformedContributors);
  } catch (error) {
    console.error("Error fetching repository contributors:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 