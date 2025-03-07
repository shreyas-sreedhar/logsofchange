import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createSupabaseAdmin } from '../../../../utils/supabase/client';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize Supabase client
    const supabase = createSupabaseAdmin();
    
    // Check if Supabase is properly configured
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Supabase configuration is missing. Please check your environment variables.',
        debug: { 
          url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      }, { status: 500 });
    }

    // Get the data from the request
    const changelogData = await request.json();
    
    if (!changelogData || !changelogData.repoId || !changelogData.commits) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 });
    }

    // Prepare data for Supabase
    const changelogRecord = {
      user_id: session.user.email,
      repo_id: changelogData.repoId,
      repo_name: changelogData.repoName,
      from_date: changelogData.dateRange.from,
      to_date: changelogData.dateRange.to,
      commit_count: changelogData.commits.length,
      raw_data: JSON.stringify(changelogData.commits),
      generated_at: changelogData.generatedAt,
      // The processed changelog will be generated later by LLM
      processed_changelog: null,
      status: 'pending',
    };

    // Insert the data into Supabase
    const { data, error } = await supabase
      .from('changelogs')
      .insert(changelogRecord)
      .select();

    if (error) {
      console.error('Error saving to Supabase:', error);
      return NextResponse.json({ 
        error: 'Failed to save changelog data',
        details: error 
      }, { status: 500 });
    }

    // Return success response with the created record ID
    return NextResponse.json({ 
      success: true, 
      message: 'Changelog data saved successfully',
      changelogId: data?.[0]?.id
    });
  } catch (error) {
    console.error('Error generating changelog:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 