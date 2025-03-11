import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { getRepositoryById } from "../../../lib/github";

/**
 * Specific Repository API endpoint
 * GET: Get details for a specific repository
 * PUT: Update repository settings (placeholder)
 * DELETE: Remove repository from tracking (placeholder)
 */

// GET: Get details for a specific repository
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
    
    console.log("Specific Repo API Request:", {
      path: request.nextUrl.pathname,
      repoId,
      sessionUserId: session.user?.id,
      sessionUserLogin: session.user?.login
    });

    // Fetch repository details using Octokit
    const repo = await getRepositoryById(session.accessToken, parseInt(repoId));
    
    // Transform the response to include only the data we need
    const transformedRepo = {
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
      createdAt: repo.created_at,
      private: repo.private,
      description: repo.description,
      language: repo.language,
      defaultBranch: repo.default_branch,
      url: repo.html_url,
      apiUrl: repo.url,
      topics: repo.topics || [],
      hasIssues: repo.has_issues,
      hasProjects: repo.has_projects,
      hasWiki: repo.has_wiki,
      forksCount: repo.forks_count,
      openIssuesCount: repo.open_issues_count,
      watchersCount: repo.watchers_count,
      license: repo.license ? {
        key: repo.license.key,
        name: repo.license.name,
        url: repo.license.url
      } : null
    };

    return NextResponse.json(transformedRepo);
  } catch (error) {
    console.error("Error fetching repository:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

// PUT: Update repository settings (placeholder)
export async function PUT(
  request: NextRequest,
  { params }: { params: { repoId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { repoId } = params;
    const body = await request.json();
    
    console.log("Update Repository Request:", {
      repoId,
      body,
      sessionUserId: session.user?.id,
      sessionUserLogin: session.user?.login
    });
    
    // Here you would add logic to update repository settings in your database
    
    return NextResponse.json({ 
      success: true,
      repo: {
        id: repoId,
        updatedAt: new Date().toISOString(),
        ...body
      }
    });
  } catch (error) {
    console.error("Error updating repository:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

// DELETE: Remove repository from tracking (placeholder)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { repoId: string } }
) {
  try {
    const session = await auth();
    
    if (!session?.accessToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { repoId } = params;
    
    console.log("Delete Repository Request:", {
      repoId,
      sessionUserId: session.user?.id,
      sessionUserLogin: session.user?.login
    });
    
    // Here you would add logic to remove repository from tracking in your database
    
    return NextResponse.json({ 
      success: true,
      id: repoId,
      deletedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error deleting repository:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 