import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

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

    // Fetch repositories from GitHub API
    const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: 'Failed to fetch repositories', details: errorData }, { status: response.status });
    }

    const repos = await response.json();
    
    // Transform the data to match our Repository interface
    const transformedRepos = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      stars: repo.stargazers_count,
      updatedAt: repo.updated_at
    }));

    return NextResponse.json(transformedRepos);
  } catch (error) {
    console.error('Error fetching repositories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 