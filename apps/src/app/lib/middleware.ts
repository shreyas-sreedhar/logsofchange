import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';
import { createApiResponse } from './api-utils';

// Define a custom session type that matches our expected structure
export interface CustomSession {
  user?: {
    id?: string;
    name?: string;
    email?: string;
    image?: string;
  };
  accessToken?: string;
  expires?: string;
}

/**
 * Middleware to handle authentication and execute the handler if authenticated
 */
export async function withAuth(
  request: NextRequest, 
  handler: (req: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Get session using Next.js built-in method
  const session = await getServerSession(authOptions as any);
  
  // Check if session exists and has a user
  if (!session || !Object.prototype.hasOwnProperty.call(session, 'user')) {
    return createApiResponse(undefined, 'Unauthorized', 401);
  }
  
  return handler(request);
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