import { NextRequest, NextResponse } from 'next/server';
import { getRepositoryContext } from '../../lib/repository-analyzer';
import { getToken } from 'next-auth/jwt';

/**
 * API route for analyzing GitHub repositories
 * Authentication is handled by middleware
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { repositoryUrl } = body;
    
    if (!repositoryUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required' },
        { status: 400 }
      );
    }
    
    // Get the token (middleware already verified it exists)
    const token = await getToken({ req: request });
    
    // Analyze repository using the user's GitHub token
    const repoContext = await getRepositoryContext(
      repositoryUrl, 
      token?.accessToken as string
    );
    
    // Return the analysis results
    return NextResponse.json(repoContext);
  } catch (error) {
    console.error('Error analyzing repository:', error);
    return NextResponse.json(
      { error: 'Failed to analyze repository' },
      { status: 500 }
    );
  }
} 