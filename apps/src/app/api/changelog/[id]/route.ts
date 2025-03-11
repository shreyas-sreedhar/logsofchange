import { auth } from '../../../auth';
import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/db';

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
    console.error('❌ [CHANGELOG API] Error extracting GitHub ID from avatar URL:', error);
    return null;
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('📝 [CHANGELOG API] GET request received');
  try {
    console.log('📝 [CHANGELOG API] Authenticating user session');
    const session = await auth();
    
    if (!session?.user?.id) {
      console.error('❌ [CHANGELOG API] Authentication failed: No user ID in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`✅ [CHANGELOG API] User authenticated: ${session.user.id}`);

    // Check if Supabase is properly initialized
    if (!supabase) {
      console.error('❌ [CHANGELOG API] Supabase client not initialized');
      return NextResponse.json({ 
        error: 'Database connection not available. Please check server configuration.' 
      }, { status: 500 });
    }

    // Get the changelog ID from params
    console.log('📝 [CHANGELOG API] Extracting changelog ID from params');
    const { id: changelogId } = await params;
    
    if (!changelogId) {
      console.error('❌ [CHANGELOG API] Changelog ID is missing');
      return NextResponse.json({ error: 'Changelog ID is required' }, { status: 400 });
    }

    console.log(`📝 [CHANGELOG API] Fetching changelog with ID: ${changelogId}`);
    console.log(`📝 [CHANGELOG API] User ID: ${session.user.id}`);

    // Fetch the changelog from Supabase
    console.log(`📝 [CHANGELOG API] Querying database for changelog: ${changelogId}`);
    const { data: changelog, error } = await supabase
      .from('changelogs')
      .select('*')
      .eq('id', changelogId)
      .single();

    if (error) {
      console.error('❌ [CHANGELOG API] Error fetching changelog:', error);
      return NextResponse.json({ error: 'Failed to fetch changelog' }, { status: 500 });
    }

    if (!changelog) {
      console.error(`❌ [CHANGELOG API] Changelog not found: ${changelogId}`);
      return NextResponse.json({ error: 'Changelog not found' }, { status: 404 });
    }
    console.log(`✅ [CHANGELOG API] Changelog fetched successfully`);
    console.log(`📝 [CHANGELOG API] Changelog status: ${changelog.status}`);

    // Check if the user has access to this changelog
    if (changelog.user_id !== session.user.id) {
      console.error(`❌ [CHANGELOG API] Access denied: User ${session.user.id} attempting to access changelog owned by ${changelog.user_id}`);
      return NextResponse.json({ error: 'You do not have access to this changelog' }, { status: 403 });
    }
    console.log(`✅ [CHANGELOG API] Access verified for user: ${session.user.id}`);

    console.log(`✅ [CHANGELOG API] Returning changelog data`);
    return NextResponse.json(changelog);
  } catch (error) {
    console.error('❌ [CHANGELOG API] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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

    // Get the changelog ID from params
    const { id: changelogId } = await params;
    
    if (!changelogId) {
      return NextResponse.json({ error: 'Changelog ID is required' }, { status: 400 });
    }

    // First, check if the changelog exists and belongs to the user
    const { data: changelog, error: fetchError } = await supabase
      .from('changelogs')
      .select('user_id')
      .eq('id', changelogId)
      .single();

    if (fetchError) {
      console.error('Error fetching changelog:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch changelog' }, { status: 500 });
    }

    if (!changelog) {
      return NextResponse.json({ error: 'Changelog not found' }, { status: 404 });
    }

    // Check if the user has access to this changelog
    if (changelog.user_id !== session.user.id) {
      return NextResponse.json({ error: 'You do not have access to this changelog' }, { status: 403 });
    }

    // Delete the changelog
    const { error: deleteError } = await supabase
      .from('changelogs')
      .delete()
      .eq('id', changelogId);

    if (deleteError) {
      console.error('Error deleting changelog:', deleteError);
      return NextResponse.json({ error: 'Failed to delete changelog' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting changelog:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 