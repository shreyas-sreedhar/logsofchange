import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { 
  getChangelogById, 
  updateChangelog, 
  deleteChangelog 
} from "../../../lib/db";

/**
 * Specific Changelog API endpoint
 * GET: Get details for a specific changelog
 * PUT: Update changelog (e.g., regenerate or process)
 * DELETE: Delete a changelog
 */

// GET: Get details for a specific changelog
export async function GET(
  request: NextRequest,
  { params }: { params: { changelogId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.accessToken || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - No access token or user ID" }, { status: 401 });
    }

    const { changelogId } = params;
    
    console.log("Specific Changelog API Request:", {
      path: request.nextUrl.pathname,
      changelogId,
      sessionUserId: session.user?.id,
      sessionUserLogin: session.user?.login
    });

    // Fetch the changelog from database
    const changelog = await getChangelogById(changelogId);
    
    if (!changelog) {
      return NextResponse.json({ error: "Changelog not found" }, { status: 404 });
    }
    
    // Check if the changelog belongs to the authenticated user
    if (changelog.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized - You don't have access to this changelog" }, { status: 403 });
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
      processedChangelog: changelog.processed_changelog,
      createdAt: changelog.created_at,
      // Include options from raw_data if available
      options: changelog.raw_data?.options || {}
    });
  } catch (error) {
    console.error("Error fetching changelog:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

// PUT: Update changelog (e.g., regenerate or process)
export async function PUT(
  request: NextRequest,
  { params }: { params: { changelogId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.accessToken || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - No access token or user ID" }, { status: 401 });
    }

    const { changelogId } = params;
    const body = await request.json();
    const { action, options, processedChangelog } = body;
    
    console.log("Update Changelog Request:", {
      changelogId,
      action,
      options,
      sessionUserId: session.user?.id,
      sessionUserLogin: session.user?.login
    });
    
    // Fetch the changelog to check ownership
    const existingChangelog = await getChangelogById(changelogId);
    
    if (!existingChangelog) {
      return NextResponse.json({ error: "Changelog not found" }, { status: 404 });
    }
    
    // Check if the changelog belongs to the authenticated user
    if (existingChangelog.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized - You don't have access to this changelog" }, { status: 403 });
    }
    
    // Handle different actions
    switch (action) {
      case "regenerate": {
        // Update the changelog status to processing
        const updatedChangelog = await updateChangelog(changelogId, {
          status: 'processing',
          generated_at: new Date().toISOString(),
          processed_at: null,
          processed_changelog: null
        });
        
        if (!updatedChangelog) {
          return NextResponse.json({ error: "Failed to update changelog" }, { status: 500 });
        }
        
        // Transform to camelCase for API response
        return NextResponse.json({
          id: updatedChangelog.id,
          repoId: updatedChangelog.repo_id,
          repoName: updatedChangelog.repo_name,
          status: updatedChangelog.status,
          generatedAt: updatedChangelog.generated_at,
          processedAt: updatedChangelog.processed_at,
          message: "Changelog regeneration started"
        });
      }
        
      case "process": {
        // Update the changelog with processed content
        if (!processedChangelog) {
          return NextResponse.json({ error: "Processed changelog content is required" }, { status: 400 });
        }
        
        const updatedChangelog = await updateChangelog(changelogId, {
          status: 'completed',
          processed_at: new Date().toISOString(),
          processed_changelog: processedChangelog
        });
        
        if (!updatedChangelog) {
          return NextResponse.json({ error: "Failed to update changelog" }, { status: 500 });
        }
        
        // Transform to camelCase for API response
        return NextResponse.json({
          id: updatedChangelog.id,
          repoId: updatedChangelog.repo_id,
          repoName: updatedChangelog.repo_name,
          status: updatedChangelog.status,
          processedAt: updatedChangelog.processed_at,
          message: "Changelog processing completed",
          processedChangelog: updatedChangelog.processed_changelog
        });
      }
        
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error updating changelog:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

// DELETE: Delete a changelog
export async function DELETE(
  request: NextRequest,
  { params }: { params: { changelogId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.accessToken || !session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - No access token or user ID" }, { status: 401 });
    }

    const { changelogId } = params;
    
    console.log("Delete Changelog Request:", {
      changelogId,
      sessionUserId: session.user?.id,
      sessionUserLogin: session.user?.login
    });
    
    // Fetch the changelog to check ownership
    const existingChangelog = await getChangelogById(changelogId);
    
    if (!existingChangelog) {
      return NextResponse.json({ error: "Changelog not found" }, { status: 404 });
    }
    
    // Check if the changelog belongs to the authenticated user
    if (existingChangelog.user_id !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized - You don't have access to this changelog" }, { status: 403 });
    }
    
    // Delete the changelog
    const success = await deleteChangelog(changelogId);
    
    if (!success) {
      return NextResponse.json({ error: "Failed to delete changelog" }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      id: changelogId,
      deletedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error deleting changelog:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 