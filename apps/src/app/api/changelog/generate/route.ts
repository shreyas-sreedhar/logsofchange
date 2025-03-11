import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { createChangelog } from '../../../lib/db/index';

export async function POST(request: NextRequest) {
  console.log('📝 [CHANGELOG GENERATE] Starting changelog generation process');
  try {
    // Get the authenticated session
    console.log('📝 [CHANGELOG GENERATE] Authenticating user session');
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      console.error('❌ [CHANGELOG GENERATE] Authentication failed: No user ID in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`✅ [CHANGELOG GENERATE] User authenticated: ${session.user.id}`);

    // Get the data from the request
    console.log('📝 [CHANGELOG GENERATE] Parsing request data');
    const changelogData = await request.json();
    
    // Validate required fields
    if (!changelogData || !changelogData.repoId || !changelogData.commits) {
      console.error('❌ [CHANGELOG GENERATE] Invalid request data:', JSON.stringify(changelogData || {}));
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }
    console.log('✅ [CHANGELOG GENERATE] Request data validated');

    // Get user ID from session
    const userId = session.user.id;
    
    console.log(`📝 [CHANGELOG GENERATE] User: ${userId}`);
    console.log(`📝 [CHANGELOG GENERATE] Repository ID: ${changelogData.repoId}`);
    console.log(`📝 [CHANGELOG GENERATE] Repository Name: ${changelogData.repoName}`);
    console.log(`📝 [CHANGELOG GENERATE] Date Range: ${changelogData.dateRange.from} to ${changelogData.dateRange.to}`);
    console.log(`📝 [CHANGELOG GENERATE] Commit count: ${changelogData.commits.length}`);

    // Prepare data for database
    console.log('📝 [CHANGELOG GENERATE] Preparing data for database');
    const changelogInput = {
      user_id: userId,
      repo_id: changelogData.repoId,
      repo_name: changelogData.repoName,
      from_date: changelogData.dateRange.from,
      to_date: changelogData.dateRange.to,
      commit_count: changelogData.commits.length,
      raw_data: JSON.stringify(changelogData.commits), // Convert to string for storage
      status: 'processing' as 'processing' | 'completed' | 'failed',
      generated_at: changelogData.generatedAt || new Date().toISOString(),
    };

    try {
      // Insert the data using the createChangelog function
      console.log('📝 [CHANGELOG GENERATE] Creating changelog record in database');
      const changelog = await createChangelog(changelogInput);
      
      if (!changelog) {
        console.error('❌ [CHANGELOG GENERATE] Failed to create changelog record');
        return NextResponse.json({ error: 'Failed to save changelog data' }, { status: 500 });
      }

      console.log(`✅ [CHANGELOG GENERATE] Changelog created successfully with ID: ${changelog.id}`);

      // Trigger the processing of the changelog
      try {
        console.log(`📝 [CHANGELOG GENERATE] Triggering processing for changelog ID: ${changelog.id}`);
        // Call the process endpoint to generate the formatted changelog
        const processUrl = `${request.nextUrl.origin}/api/changelog/process`;
        console.log(`📝 [CHANGELOG GENERATE] Calling process endpoint: ${processUrl}`);
        
        const processResponse = await fetch(processUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Pass the authorization header to maintain the session
            'Authorization': request.headers.get('Authorization') || '',
            'Cookie': request.headers.get('Cookie') || ''
          },
          body: JSON.stringify({ changelogId: changelog.id })
        });

        if (!processResponse.ok) {
          const errorText = await processResponse.text();
          console.warn(`⚠️ [CHANGELOG GENERATE] Failed to trigger changelog processing: ${processResponse.status} ${processResponse.statusText}`);
          console.warn(`⚠️ [CHANGELOG GENERATE] Error details: ${errorText}`);
          // We still return success since the changelog was created
        } else {
          const processResult = await processResponse.json();
          console.log(`✅ [CHANGELOG GENERATE] Changelog processing triggered successfully: ${JSON.stringify(processResult)}`);
        }
      } catch (processError) {
        console.error(`❌ [CHANGELOG GENERATE] Error triggering changelog processing:`, processError);
        // We still return success since the changelog was created
      }

      // Return success response with the created record ID
      console.log(`✅ [CHANGELOG GENERATE] Returning success response with changelog ID: ${changelog.id}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Changelog data saved and processing started',
        changelogId: changelog.id
      });
    } catch (dbError) {
      console.error('❌ [CHANGELOG GENERATE] Database error:', dbError);
      return NextResponse.json({ 
        error: 'Database error. Please check your database configuration.' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ [CHANGELOG GENERATE] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 