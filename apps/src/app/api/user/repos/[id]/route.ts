import { NextResponse } from 'next/server';
import { auth } from '../../../../auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the access token from the session
    const accessToken = session.accessToken;
    
    if (!accessToken) {
      return NextResponse.json({ error: 'GitHub token not found' }, { status: 401 });
    }

    const { id: repoId } = await params;
    
    if (!repoId) {
      return NextResponse.json({ error: 'Repository ID is required' }, { status: 400 });
    }

    // Fetch repository details from GitHub API
    const response = await fetch(`https://api.github.com/repositories/${repoId}`, {
      headers: {
        'Authorization': `token ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: 'Failed to fetch repository', details: errorData }, { status: response.status });
    }

    const repo = await response.json();
    
    // Transform the data to match our Repository interface
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
      private: repo.private,
      description: repo.description,
      language: repo.language,
      defaultBranch: repo.default_branch,
    };

    return NextResponse.json(transformedRepo);
  } catch (error) {
    console.error('Error fetching repository:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 