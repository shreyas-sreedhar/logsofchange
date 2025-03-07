import { createClient } from '@supabase/supabase-js';

// This is for client-side usage (browser)
export const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase URL or Anon Key is missing');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

// This is for server-side usage (API routes)
export const createSupabaseAdmin = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Supabase URL or Service Role Key is missing');
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey);
};

// Default client for browser usage
export const supabase = typeof window !== 'undefined' ? createSupabaseClient() : null; 