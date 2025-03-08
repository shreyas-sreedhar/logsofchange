import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

// Create Supabase client only if we have valid credentials
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

// Helper function to extract GitHub ID from avatar URL
function extractGitHubIdFromAvatarUrl(avatarUrl: string): string | null {
  try {
    // GitHub avatar URLs are in the format: https://avatars.githubusercontent.com/u/70530523?v=4
    const match = avatarUrl.match(/\/u\/(\d+)/);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch (error) {
    console.error('Error extracting GitHub ID from avatar URL:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Debug session structure
    console.log('Session structure:', JSON.stringify(session, null, 2));
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Supabase is properly initialized
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Database connection not available. Please check server configuration.' 
      }, { status: 500 });
    }

    // Get the data from the request
    const changelogData = await request.json();
    
    if (!changelogData || !changelogData.repoId || !changelogData.commits) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Extract GitHub ID from avatar URL
    let userId = null;
    
    if (session.user.image) {
      userId = extractGitHubIdFromAvatarUrl(session.user.image);
    }
    
    // Fallback to name if we couldn't extract ID
    if (!userId && session.user.name) {
      // Use name as a fallback (not ideal but better than nothing)
      userId = session.user.name.replace(/\s+/g, '_').toLowerCase();
    }
    
    // Final fallback
    if (!userId) {
      userId = 'unknown_user';
    }

    // Prepare data for Supabase
    const changelogRecord = {
      user_id: userId,
      repo_id: changelogData.repoId,
      repo_name: changelogData.repoName,
      from_date: changelogData.dateRange.from,
      to_date: changelogData.dateRange.to,
      commit_count: changelogData.commits.length,
      raw_data: JSON.stringify(changelogData.commits),
      generated_at: changelogData.generatedAt,
      // The processed changelog will be generated later by LLM
      processed_changelog: null,
      status: 'processing',
    };

    try {
      // Insert the data into Supabase
      const { data, error } = await supabase
        .from('changelogs')
        .insert(changelogRecord)
        .select();

      if (error) {
        console.error('Error saving to Supabase:', error);
        
        // Check if the error is related to the table not existing
        if (error.code === '42P01' || error.code === 'PGRST204') {
          return NextResponse.json({ 
            error: 'Changelogs table not found. Please run the database setup script first.' 
          }, { status: 500 });
        }
        
        return NextResponse.json({ error: 'Failed to save changelog data' }, { status: 500 });
      }

      // Trigger the processing endpoint in the background
      const changelogId = data[0].id;
      fetch(`${request.headers.get('origin')}/api/changelog/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('cookie') || '' // Forward the cookies for authentication
        },
        body: JSON.stringify({ changelogId })
      }).catch(err => {
        console.error('Error triggering changelog processing:', err);
        // We don't await this or handle errors here as it's a background process
      });

      // Return success response with the created record ID
      return NextResponse.json({ 
        success: true, 
        message: 'Changelog data saved and processing started',
        changelogId: changelogId
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ 
        error: 'Database error. Please check your database configuration.' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Error generating changelog:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 