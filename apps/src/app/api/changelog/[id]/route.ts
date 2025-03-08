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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Supabase is properly initialized
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Database connection not available. Please check server configuration.' 
      }, { status: 500 });
    }

    const changelogId = params.id;
    
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
    
    // Fetch the changelog from Supabase
    const { data: changelog, error } = await supabase
      .from('changelogs')
      .select('*')
      .eq('id', changelogId)
      .single();

    if (error) {
      console.error('Error fetching changelog:', error);
      return NextResponse.json({ error: 'Failed to fetch changelog' }, { status: 500 });
    }

    if (!changelog) {
      return NextResponse.json({ error: 'Changelog not found' }, { status: 404 });
    }

    // Verify that the user has access to this changelog
    if (changelog.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized access to changelog' }, { status: 403 });
    }

    // Return the changelog
    return NextResponse.json(changelog);
  } catch (error) {
    console.error('Error fetching changelog:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 