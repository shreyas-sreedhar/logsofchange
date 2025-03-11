import { NextRequest, NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { getRepositoryById } from "../../../../lib/github";
import { getChangelogContext } from "../../../../lib/repository-analyzer";

/**
 * Repository Analysis API endpoint
 * GET: Get analysis for a specific repository including main branch commits and PR titles
 */

// GET: Get analysis for a specific repository
export async function GET(
  request: NextRequest,
  { params }: { params: { repoId: string } }
) {
  try {
    // Get the authenticated session
    const session = await auth();
    
    // Check if user is authenticated with an access token
    if (!session?.accessToken) {
      console.error("Repository Analysis API: Unauthorized access attempt - No access token");
      return NextResponse.json({ error: "Unauthorized - No access token" }, { status: 401 });
    }

    const { repoId } = params;
    
    // Get query parameters for date range
    const url = new URL(request.url);
    const fromDate = url.searchParams.get("from");
    const toDate = url.searchParams.get("to");
    
    console.log("Repository Analysis API Request:", {
      path: request.nextUrl.pathname,
      repoId,
      fromDate,
      toDate,
      sessionUserId: session.user?.id,
      sessionUserLogin: session.user?.login
    });

    try {
      // Fetch repository details using Octokit to get owner and repo name
      const repo = await getRepositoryById(session.accessToken, parseInt(repoId));
      const owner = repo.owner.login;
      const repoName = repo.name;
      
      // Get repository analysis context
      const analysisContext = await getChangelogContext(
        session.accessToken,
        owner,
        repoName,
        fromDate || undefined,
        toDate || undefined
      );
      
      // Return the analysis context
      return NextResponse.json({
        repositoryId: repoId,
        repositoryName: `${owner}/${repoName}`,
        analysis: analysisContext
      });
    } catch (error) {
      console.error("Error in repository analysis:", error);
      
      // Check if it's a GitHub API error (e.g., rate limiting or permissions)
      if (error instanceof Error && error.message.includes("GitHub")) {
        return NextResponse.json(
          { error: `GitHub API error: ${error.message}` },
          { status: 403 }
        );
      }
      
      return NextResponse.json(
        { error: `Error analyzing repository: ${error instanceof Error ? error.message : String(error)}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error in repository analysis API:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 