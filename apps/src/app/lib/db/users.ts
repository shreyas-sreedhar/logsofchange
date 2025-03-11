import { supabase } from './index';

// User types
export interface User {
  id: string;
  github_id: string;
  login: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserInput {
  github_id: string;
  login: string;
  email?: string;
  name?: string;
  avatar_url?: string;
}

/**
 * Create a new user or update an existing one
 */
export async function upsertUser(data: UserInput): Promise<User | null> {
  const { data: user, error } = await supabase
    .from('users')
    .upsert({
      github_id: data.github_id,
      login: data.login,
      email: data.email,
      name: data.name,
      avatar_url: data.avatar_url,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'github_id',
      ignoreDuplicates: false
    })
    .select()
    .single();

  if (error) {
    console.error('Error upserting user:', error);
    return null;
  }

  return user;
}

/**
 * Get a user by their GitHub ID
 */
export async function getUserByGithubId(githubId: string): Promise<User | null> {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('github_id', githubId)
    .single();

  if (error) {
    console.error('Error fetching user by GitHub ID:', error);
    return null;
  }

  return user;
} 