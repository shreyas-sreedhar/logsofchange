import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../../auth";
import { getChangelogsByRepoId } from "../../../../lib/db";
import { getRepositoryById } from "../../../../lib/github";

/**
 * Repository Changelogs API endpoint
 * GET: Get all changelogs for a specific repository
 */

// GET: Get all changelogs for a specific repository
export async function GET(
  request: NextRequest,
  { params }: { params: { repoId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.accessToken || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - No access token or user ID" }, { status: 401 });
    }

    const { repoId } = params;
    
    // Get query parameters for pagination
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const status = url.searchParams.get("status");
    
    console.log("Repository Changelogs API Request:", {
      path: request.nextUrl.pathname,
      repoId,
      status,
      page,
      limit,
      sessionUserId: session.user?.id,
      sessionUserLogin: session.user?.login
    });

    // Fetch repository details using Octokit to ensure it exists and get the full name
    const repo = await getRepositoryById(session.accessToken, parseInt(repoId));
    
    // Fetch changelogs for this repository from database
    const { changelogs, count } = await getChangelogsByRepoId(parseInt(repoId), page, limit);
    
    // Filter by status if provided
    let filteredChangelogs = changelogs;
    if (status) {
      filteredChangelogs = filteredChangelogs.filter(cl => cl.status === status);
    }
    
    // Filter by user ID to ensure users only see their own changelogs
    filteredChangelogs = filteredChangelogs.filter(cl => cl.user_id === session.user.id);
    
    // Transform to camelCase for API response
    const transformedChangelogs = filteredChangelogs.map(cl => ({
      id: cl.id,
      repoId: cl.repo_id,
      repoName: cl.repo_name,
      fromDate: cl.from_date,
      toDate: cl.to_date,
      commitCount: cl.commit_count,
      generatedAt: cl.generated_at,
      processedAt: cl.processed_at,
      status: cl.status,
      createdAt: cl.created_at,
      hasProcessedChangelog: !!cl.processed_changelog
    }));

    return NextResponse.json({
      repoId: repoId,
      repoName: repo.full_name,
      changelogs: transformedChangelogs,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching repository changelogs:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 