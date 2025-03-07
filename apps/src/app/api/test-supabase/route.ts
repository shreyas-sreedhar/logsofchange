import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '../../../utils/supabase/client';

export async function GET() {
  try {
    // Initialize Supabase client
    const supabase = createSupabaseAdmin();
    
    if (!supabase) {
      return NextResponse.json({
        status: 'error',
        message: 'Supabase configuration is missing',
        config: {
          url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          key: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        }
      }, { status: 500 });
    }
    
    // Check if we can connect to Supabase by making a simple query
    const { data, error } = await supabase.from('changelogs').select('count').limit(1);
    
    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Failed to connect to Supabase',
        error: error.message,
        code: error.code,
        details: {
          url: process.env.NEXT_PUBLIC_SUPABASE_URL,
          keyType: 'service_role'
        }
      }, { status: 500 });
    }
    
    // If we get here, the connection was successful
    return NextResponse.json({
      status: 'success',
      message: 'Successfully connected to Supabase',
      data: data
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Exception occurred while testing Supabase connection',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 