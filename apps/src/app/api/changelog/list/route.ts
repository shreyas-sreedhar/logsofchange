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

export async function GET(request: Request) {
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

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const offset = (page - 1) * limit;
    
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

    try {
      // Fetch changelogs from Supabase
      const { data: changelogs, error, count } = await supabase
        .from('changelogs')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('generated_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        // Check if the error is related to the table not existing or column not found
        if (error.code === '42P01' || error.code === '42703') {
          // Table doesn't exist or column not found - return empty results instead of error
          console.warn('Changelogs table or column not found:', error.message);
          return NextResponse.json({
            changelogs: [],
            pagination: {
              total: 0,
              page,
              limit,
              totalPages: 0
            }
          });
        }
        
        // For other errors, log and return error response
        console.error('Error fetching changelogs:', error);
        return NextResponse.json({ error: 'Failed to fetch changelogs' }, { status: 500 });
      }

      // Return response with changelogs and pagination info
      return NextResponse.json({
        changelogs: changelogs || [],
        pagination: {
          total: count || 0,
          page,
          limit,
          totalPages: Math.ceil((count || 0) / limit)
        }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      // Return empty results for any database-related errors
      return NextResponse.json({
        changelogs: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0
        }
      });
    }
  } catch (error) {
    console.error('Error listing changelogs:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 