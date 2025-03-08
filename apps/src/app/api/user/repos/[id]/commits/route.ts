import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../../../auth/[...nextauth]/route';

export async function GET(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const { params } = context; // Ensure params is properly extracted
    if (!params?.id) {
      return NextResponse.json({ error: 'Repository ID is missing' }, { status: 400 });
    }
  
    const session = await getServerSession(authOptions);
    
    if (!session || !session.accessToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    
    // First, we need to find the repository details to get the full name
    const repoResponse = await fetch('https://api.github.com/user/repos?per_page=100', {
      headers: {
        'Authorization': `token ${session.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!repoResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch repository info' }, { status: repoResponse.status });
    }

    const repos = await repoResponse.json();
    const repo = repos.find((r: any) => r.id.toString() === id);
    
    if (!repo) {
      return NextResponse.json({ error: 'Repository not found' }, { status: 404 });
    }

    // Build the date filter for commits
    let dateFilter = '';
    if (fromDate) {
      dateFilter += `&since=${fromDate}T00:00:00Z`;
    }
    if (toDate) {
      dateFilter += `&until=${toDate}T23:59:59Z`;
    }
    
    // Fetch commits for the repository
    const commitsUrl = `https://api.github.com/repos/${repo.full_name}/commits?${dateFilter}`;
    const commitsResponse = await fetch(commitsUrl, {
      headers: {
        'Authorization': `token ${session.accessToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!commitsResponse.ok) {
      return NextResponse.json({ error: 'Failed to fetch commits' }, { status: commitsResponse.status });
    }

    const commits = await commitsResponse.json();
    
    // Process each commit to get detailed information
    const detailedCommits = await Promise.all(
      commits.slice(0, 20).map(async (commit: any) => {
        try {
          // Fetch detailed commit data including files
          const commitDetailsUrl = `https://api.github.com/repos/${repo.full_name}/commits/${commit.sha}`;
          const detailsResponse = await fetch(commitDetailsUrl, {
            headers: {
              'Authorization': `token ${session.accessToken}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          });
          
          if (!detailsResponse.ok) {
            console.error(`Failed to fetch details for commit ${commit.sha}`);
            return null;
          }
          
          const details = await detailsResponse.json();
          
          // Extract the changed files
          const changedFiles = details.files.map((file: any) => ({
            filename: file.filename,
            status: file.status,
            additions: file.additions,
            deletions: file.deletions
          }));
          
          return {
            sha: commit.sha,
            message: commit.commit.message,
            author: commit.commit.author.name,
            date: commit.commit.author.date,
            changedFiles: changedFiles
          };
        } catch (error) {
          console.error(`Error processing commit ${commit.sha}:`, error);
          return null;
        }
      })
    );
    
    // Filter out any null values from errors
    const validCommits = detailedCommits.filter(commit => commit !== null);
    
    return NextResponse.json(validCommits);
  } catch (error) {
    console.error('Error fetching commits:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 