import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '../auth';

// Define a custom session type that matches our expected structure
export interface CustomSession {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
    login?: string;
  };
  accessToken?: string;
  expires?: string;
}

/**
 * Middleware to check if the user is authenticated
 */
export async function withAuth(handler: Function) {
  return async (req: Request, context: any) => {
    try {
      const session = await auth();
      
      if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      
      return handler(req, context, session);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return NextResponse.json({ error: 'Authentication error' }, { status: 500 });
    }
  };
}

/**
 * Middleware to check if the user has a valid GitHub token
 */
export async function withGitHubToken(handler: Function) {
  return withAuth(async (req: Request, context: any, session: any) => {
    if (!session.accessToken) {
      return NextResponse.json({ error: 'GitHub token not found' }, { status: 401 });
    }
    
    return handler(req, context, session);
  });
}

/**
 * Get initialized Supabase client
 */
export function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Middleware to handle database operations with error handling
 * @param handler The function to execute database operations
 * @returns Response from the handler or a database error
 */
export async function withDatabase<T>(
  handler: (supabase: ReturnType<typeof getSupabaseClient>) => Promise<T>
): Promise<T> {
  try {
    const supabase = getSupabaseClient();
    return await handler(supabase);
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Database operation failed');
  }
} 