import { createClient } from '@supabase/supabase-js';

// Get Supabase URL and key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
}

if (!supabaseServiceKey && !supabaseAnonKey) {
  throw new Error('Either SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY must be defined');
}

// Use service role key for server components and anon key for client components
const supabaseKey = supabaseServiceKey || supabaseAnonKey || '';

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Don't persist session in localStorage
    autoRefreshToken: false, // Don't auto refresh token
  },
});

// Changelog types
export interface Changelog {
  id: string;
  user_id: string;
  repo_id: number;
  repo_name: string;
  from_date: string;
  to_date: string;
  commit_count: number;
  raw_data: any;
  processed_changelog: string | null;
  status: 'processing' | 'completed' | 'failed';
  generated_at: string;
  processed_at: string | null;
  created_at: string;
}

export interface ChangelogInput {
  user_id: string;
  repo_id: number;
  repo_name: string;
  from_date: string;
  to_date: string;
  commit_count: number;
  raw_data: any;
  status: 'processing' | 'completed' | 'failed';
  generated_at: string;
}

// Changelog database operations
export async function createChangelog(data: ChangelogInput): Promise<Changelog | null> {
  const { data: changelog, error } = await supabase
    .from('changelogs')
    .insert(data)
    .select()
    .single();

  if (error) {
    console.error('Error creating changelog:', error);
    return null;
  }

  return changelog;
}

export async function getChangelogById(id: string): Promise<Changelog | null> {
  const { data: changelog, error } = await supabase
    .from('changelogs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching changelog ${id}:`, error);
    return null;
  }

  return changelog;
}

export async function getChangelogsByUserId(
  userId: string,
  page: number = 1,
  limit: number = 10
): Promise<{ changelogs: Changelog[], count: number }> {
  // Calculate offset based on page and limit
  const offset = (page - 1) * limit;

  // Get total count
  const { count, error: countError } = await supabase
    .from('changelogs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    console.error('Error counting changelogs:', countError);
    return { changelogs: [], count: 0 };
  }

  // Get paginated results
  const { data: changelogs, error } = await supabase
    .from('changelogs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching changelogs:', error);
    return { changelogs: [], count: 0 };
  }

  return { changelogs: changelogs || [], count: count || 0 };
}

export async function getChangelogsByRepoId(
  repoId: number,
  page: number = 1,
  limit: number = 10
): Promise<{ changelogs: Changelog[], count: number }> {
  // Calculate offset based on page and limit
  const offset = (page - 1) * limit;

  // Get total count
  const { count, error: countError } = await supabase
    .from('changelogs')
    .select('*', { count: 'exact', head: true })
    .eq('repo_id', repoId);

  if (countError) {
    console.error('Error counting changelogs:', countError);
    return { changelogs: [], count: 0 };
  }

  // Get paginated results
  const { data: changelogs, error } = await supabase
    .from('changelogs')
    .select('*')
    .eq('repo_id', repoId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching changelogs:', error);
    return { changelogs: [], count: 0 };
  }

  return { changelogs: changelogs || [], count: count || 0 };
}

export async function updateChangelog(
  id: string,
  data: Partial<Changelog>
): Promise<Changelog | null> {
  const { data: changelog, error } = await supabase
    .from('changelogs')
    .update(data)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error(`Error updating changelog ${id}:`, error);
    return null;
  }

  return changelog;
}

export async function deleteChangelog(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('changelogs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting changelog ${id}:`, error);
    return false;
  }

  return true;
} 