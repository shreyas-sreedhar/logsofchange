import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../auth";
import { 
  createChangelog, 
  getChangelogsByUserId, 
  ChangelogInput 
} from "../../lib/db";
import { getRepositoryById } from "../../lib/github";

/**
 * Changelogs API endpoint
 * GET: List all changelogs for the authenticated user
 * POST: Generate a new changelog
 */

// GET: List all changelogs for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.accessToken || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - No access token or user ID" }, { status: 401 });
    }

    // Get query parameters for filtering and pagination
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const repoId = url.searchParams.get("repoId");
    const status = url.searchParams.get("status");
    
    console.log("Changelogs API Request:", {
      path: request.nextUrl.pathname,
      sessionUserId: session.user?.id,
      sessionUserLogin: session.user?.login,
      page,
      limit,
      repoId,
      status
    });

    // Fetch changelogs from database
    const { changelogs, count } = await getChangelogsByUserId(session.user.id, page, limit);
    
    // Apply additional filtering if needed
    let filteredChangelogs = changelogs;
    
    if (repoId) {
      filteredChangelogs = filteredChangelogs.filter(cl => cl.repo_id === parseInt(repoId));
    }
    
    if (status) {
      filteredChangelogs = filteredChangelogs.filter(cl => cl.status === status);
    }
    
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
      // Don't include raw_data in the response to keep it lightweight
      hasProcessedChangelog: !!cl.processed_changelog
    }));

    return NextResponse.json({
      changelogs: transformedChangelogs,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching changelogs:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

// POST: Generate a new changelog
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.accessToken || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - No access token or user ID" }, { status: 401 });
    }

    // Parse the request body
    const body = await request.json();
    const { repoId, repoName, fromDate, toDate, options, commits } = body;
    
    if (!repoId) {
      return NextResponse.json({ error: "Repository ID is required" }, { status: 400 });
    }
    
    console.log("Generate Changelog Request:", {
      repoId,
      repoName,
      fromDate,
      toDate,
      options,
      sessionUserId: session.user?.id,
      sessionUserLogin: session.user?.login
    });
    
    // Fetch repository details using Octokit to ensure it exists and get the full name
    const repo = await getRepositoryById(session.accessToken, parseInt(repoId));
    const fullRepoName = repo.full_name;
    
    // Prepare data for database
    const changelogInput: ChangelogInput = {
      user_id: session.user.id,
      repo_id: parseInt(repoId),
      repo_name: fullRepoName,
      from_date: fromDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      to_date: toDate || new Date().toISOString().split('T')[0],
      commit_count: commits?.length || 0,
      raw_data: {
        commits: commits || [],
        options: options || {}
      },
      status: 'processing',
      generated_at: new Date().toISOString()
    };
    
    // Save to database
    const changelog = await createChangelog(changelogInput);
    
    if (!changelog) {
      return NextResponse.json({ error: "Failed to create changelog in database" }, { status: 500 });
    }
    
    // Transform to camelCase for API response
    return NextResponse.json({
      id: changelog.id,
      repoId: changelog.repo_id,
      repoName: changelog.repo_name,
      fromDate: changelog.from_date,
      toDate: changelog.to_date,
      commitCount: changelog.commit_count,
      generatedAt: changelog.generated_at,
      processedAt: changelog.processed_at,
      status: changelog.status,
      createdAt: changelog.created_at
    });
  } catch (error) {
    console.error("Error generating changelog:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 