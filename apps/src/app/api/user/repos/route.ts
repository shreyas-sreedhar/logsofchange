import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

// Add cache headers to improve performance
export const revalidate = 300; // Revalidate every 5 minutes

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the access token from the session
    const accessToken = session.accessToken;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'GitHub token not found' }, { status: 401 });
    }

    // Fetch repositories from GitHub API with a smaller limit for faster loading
    // Only fetch essential fields to reduce payload size
    const response = await fetch(
      'https://api.github.com/user/repos?sort=updated&per_page=30&type=owner', 
      {
        headers: {
          'Authorization': `token ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json'
        },
        // Add AbortController to timeout long requests
        signal: AbortSignal.timeout(8000) // 8 second timeout
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: 'Failed to fetch repositories', details: errorData }, { status: response.status });
    }

    const repos = await response.json();
    
    // Transform the data to match our Repository interface
    // Only include essential fields to reduce payload size
    const transformedRepos = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      stars: repo.stargazers_count,
      updatedAt: repo.updated_at
    }));

    // Add cache headers to the response
    return NextResponse.json(transformedRepos, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    console.error('Error fetching repositories:', error);
    
    // Check if it's a timeout error
    if (error instanceof DOMException && error.name === 'AbortError') {
      return NextResponse.json({ 
        error: 'Request timed out. GitHub API might be slow or unavailable.',
        isTimeout: true
      }, { status: 408 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 