import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { createClient } from '@supabase/supabase-js';
import { getRepositoryCommits } from '../../../lib/github';

// Database configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
const supabase = (() => {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ [FETCH COMMITS] Missing Supabase environment variables');
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
})();

/**
 * API route for fetching commits for a changelog
 * Authentication is handled by middleware
 */
export async function POST(request: NextRequest) {
  console.log('📝 [FETCH COMMITS] Starting commit fetching process');
  try {
    // Check if Supabase is properly initialized
    if (!supabase) {
      console.error('❌ [FETCH COMMITS] Database connection not available');
      return NextResponse.json({ 
        error: 'Database connection not available' 
      }, { status: 500 });
    }

    // Get the authenticated session
    console.log('📝 [FETCH COMMITS] Authenticating user session');
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      console.error('❌ [FETCH COMMITS] Authentication failed: No user ID in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`✅ [FETCH COMMITS] User authenticated: ${session.user.id}`);

    // Get the data from the request
    console.log('📝 [FETCH COMMITS] Parsing request data');
    const { changelogId, repoName, fromDate, toDate } = await request.json();
    
    // Validate required fields
    if (!changelogId || !repoName) {
      console.error('❌ [FETCH COMMITS] Invalid request data: Missing required fields');
      return NextResponse.json({ error: 'Invalid request data. Required: changelogId, repoName' }, { status: 400 });
    }
    console.log('✅ [FETCH COMMITS] Request data validated');

    // Get user ID from session
    const userId = session.user.id;
    
    // Verify changelog ownership
    console.log(`📝 [FETCH COMMITS] Verifying changelog ownership: ${changelogId}`);
    const { data: changelog, error: fetchError } = await supabase
      .from('changelogs')
      .select('*')
      .eq('id', changelogId)
      .single();

    if (fetchError || !changelog) {
      console.error('❌ [FETCH COMMITS] Error fetching changelog:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch changelog data' }, { status: 500 });
    }

    // Verify ownership
    if (changelog.user_id !== userId) {
      console.error(`❌ [FETCH COMMITS] Unauthorized access: User ${userId} attempting to access changelog owned by ${changelog.user_id}`);
      return NextResponse.json({ error: 'Unauthorized access to changelog' }, { status: 403 });
    }
    console.log(`✅ [FETCH COMMITS] Ownership verified`);

    // Parse the repository name to get owner and repo
    const [owner, repo] = repoName.split('/');
    if (!owner || !repo) {
      console.error(`❌ [FETCH COMMITS] Invalid repository name format: ${repoName}`);
      return NextResponse.json({ error: 'Invalid repository name format. Expected: owner/repo' }, { status: 400 });
    }

    // Fetch commits from GitHub
    console.log(`📝 [FETCH COMMITS] Fetching commits from GitHub: ${repoName}`);
    console.log(`📝 [FETCH COMMITS] Date range: ${fromDate} to ${toDate}`);
    
    try {
      const commits = await getRepositoryCommits(
        session.accessToken || '',
        owner,
        repo,
        {
          since: fromDate,
          until: toDate,
          perPage: 100
        }
      );
      console.log(`✅ [FETCH COMMITS] Fetched ${commits.length} commits from GitHub`);

      // Process commits to include file changes
      console.log(`📝 [FETCH COMMITS] Processing commits with file changes`);
      const processedCommits = commits.map(commit => {
        // Extract file changes if available
        const changedFiles = commit.files?.map(file => ({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes
        })) || [];

        return {
          sha: commit.sha,
          message: commit.commit.message,
          date: commit.commit.author.date,
          author: commit.commit.author.name,
          changedFiles
        };
      });

      // Update the changelog record with the commits
      console.log(`📝 [FETCH COMMITS] Updating changelog record with commits`);
      const { error: updateError } = await supabase
        .from('changelogs')
        .update({
          raw_data: JSON.stringify(processedCommits),
          commit_count: processedCommits.length,
          status: 'processing'
        })
        .eq('id', changelogId);

      if (updateError) {
        console.error('❌ [FETCH COMMITS] Error updating changelog:', updateError);
        return NextResponse.json({ error: 'Failed to update changelog with commits' }, { status: 500 });
      }
      console.log(`✅ [FETCH COMMITS] Changelog updated with commits successfully`);

      // Trigger the processing of the changelog
      try {
        console.log(`📝 [FETCH COMMITS] Triggering processing for changelog ID: ${changelogId}`);
        // Call the process endpoint to generate the formatted changelog
        const processUrl = `${request.nextUrl.origin}/api/changelog/process`;
        console.log(`📝 [FETCH COMMITS] Calling process endpoint: ${processUrl}`);
        
        const processResponse = await fetch(processUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Pass the authorization header to maintain the session
            'Authorization': request.headers.get('Authorization') || '',
            'Cookie': request.headers.get('Cookie') || ''
          },
          body: JSON.stringify({ changelogId })
        });

        if (!processResponse.ok) {
          const errorText = await processResponse.text();
          console.warn(`⚠️ [FETCH COMMITS] Failed to trigger changelog processing: ${processResponse.status} ${processResponse.statusText}`);
          console.warn(`⚠️ [FETCH COMMITS] Error details: ${errorText}`);
          // We still return success since the commits were fetched
        } else {
          const processResult = await processResponse.json();
          console.log(`✅ [FETCH COMMITS] Changelog processing triggered successfully: ${JSON.stringify(processResult)}`);
        }
      } catch (processError) {
        console.error(`❌ [FETCH COMMITS] Error triggering changelog processing:`, processError);
        // We still return success since the commits were fetched
      }

      // Return success response
      console.log(`✅ [FETCH COMMITS] Commit fetching completed successfully for changelog ID: ${changelogId}`);
      return NextResponse.json({
        success: true,
        message: 'Commits fetched and changelog processing started',
        changelogId,
        commitCount: processedCommits.length
      });
    } catch (githubError) {
      console.error('❌ [FETCH COMMITS] Error fetching commits from GitHub:', githubError);
      return NextResponse.json({ 
        error: 'Failed to fetch commits from GitHub' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ [FETCH COMMITS] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 