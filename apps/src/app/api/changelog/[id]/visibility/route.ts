import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import { supabase } from '../../../../lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Get the changelog ID and requested visibility state
    const changelogId = params.id;
    const { isPublic } = await request.json();
    
    // Fetch the changelog to verify ownership
    const { data: changelog, error: fetchError } = await supabase
      .from('changelogs')
      .select('user_id')
      .eq('id', changelogId)
      .single();
      
    if (fetchError || !changelog) {
      return NextResponse.json({ error: 'Changelog not found' }, { status: 404 });
    }
    
    // Verify ownership
    if (changelog.user_id !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }
    
    // Update visibility
    const { error: updateError } = await supabase
      .from('changelogs')
      .update({ is_public: isPublic })
      .eq('id', changelogId);
      
    if (updateError) {
      return NextResponse.json({ error: 'Failed to update visibility' }, { status: 500 });
    }
    
    return NextResponse.json({ success: true, isPublic });
  } catch (error) {
    console.error('❌ [CHANGELOG API] Error updating visibility:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 