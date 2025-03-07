import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../auth/[...nextauth]/route';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const repoId = params.id;
    
    // Fetch repositories to find the one with matching ID
    const response = await fetch('https://api.github.com/user/repos?per_page=100', {
      headers: {
        'Authorization': `token ${session.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: 'Failed to fetch repositories', details: errorData }, { status: response.status });
    }

    const repos = await response.json();
    
    // Find the repository by ID
    const repo = repos.find((r: any) => r.id.toString() === repoId);
    
    if (!repo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }
    
    // Return the simplified repository data
    return NextResponse.json({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      defaultBranch: repo.default_branch,
      url: repo.html_url,
      owner: {
        login: repo.owner.login,
        avatar: repo.owner.avatar_url
      }
    });
  } catch (error) {
    console.error('Error fetching repository details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 