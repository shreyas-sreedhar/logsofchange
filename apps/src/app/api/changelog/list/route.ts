import { NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = (() => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ [CHANGELOG LIST] Missing Supabase environment variables');
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
})();

export async function GET(request: Request) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
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
    const repoId = searchParams.get('repoId');
    
    // Get user ID directly from the session
    const userId = session.user.id;
    
    console.log('Fetching changelogs for user:', userId);
    if (repoId) {
      console.log('Filtering by repository ID:', repoId);
    }
    console.log('Request path:', request.url);
    console.log('Page:', page, 'Limit:', limit);

    try {
      // Start building the query
      let query = supabase
        .from('changelogs')
        .select('*', { count: 'exact' })
        .eq('user_id', userId);
      
      // Add repository filter if repoId is provided
      if (repoId) {
        query = query.eq('repo_id', repoId);
      }
      
      // Complete the query with ordering and pagination
      const { data: changelogs, error, count } = await query
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

      // Calculate total pages
      const totalPages = count ? Math.ceil(count / limit) : 0;
      
      console.log('Found', changelogs?.length || 0, 'changelogs out of', count, 'total');

      // Return changelogs with pagination info
      return NextResponse.json({
        changelogs: changelogs || [],
        pagination: {
          total: count || 0,
          page,
          limit,
          totalPages
        }
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in changelog list API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 