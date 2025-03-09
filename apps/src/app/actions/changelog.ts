'use server'

import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { getSupabaseClient, withDatabase, CustomSession } from '../lib/middleware';
import { revalidatePath } from 'next/cache';

/**
 * Extract GitHub ID from avatar URL
 */
function extractGitHubIdFromAvatarUrl(avatarUrl: string): string | null {
  try {
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

/**
 * Server action to get user changelogs
 */
export async function getUserChangelogs(filters: Record<string, any> = {}) {
  // Get session with custom type
  const session = await getServerSession(authOptions as any) as CustomSession;
  
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  
  try {
    return await withDatabase(async (supabase) => {
      const { user } = session;
      
      // Get GitHub ID from avatar URL or session
      const githubId = user.id || 
        (user.image ? extractGitHubIdFromAvatarUrl(user.image) : null);
      
      if (!githubId) {
        throw new Error('Unable to determine GitHub ID');
      }
      
      // Build query based on filters
      let query = supabase
        .from('changelogs')
        .select('*')
        .eq('user_id', githubId);
        
      // Apply filters if present
      if (filters.repository) {
        query = query.eq('repository_name', filters.repository);
      }
      
      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      return data;
    });
  } catch (error) {
    console.error('Error fetching changelogs:', error);
    throw new Error('Failed to fetch changelogs');
  }
}

/**
 * Server action to generate a changelog
 */
export async function generateChangelog(formData: FormData) {
  // Get session with custom type
  const session = await getServerSession(authOptions as any) as CustomSession;
  
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  
  const repositoryUrl = formData.get('repositoryUrl')?.toString();
  const fromCommit = formData.get('fromCommit')?.toString();
  const toCommit = formData.get('toCommit')?.toString();
  
  if (!repositoryUrl) {
    throw new Error('Repository URL is required');
  }
  
  try {
    return await withDatabase(async (supabase) => {
      // Extract repo details from URL
      const repoUrlParts = repositoryUrl.split('/');
      const repositoryName = `${repoUrlParts[repoUrlParts.length - 2]}/${repoUrlParts[repoUrlParts.length - 1]}`;
      
      // Get GitHub ID
      const { user } = session;
      const githubId = user.id || 
        (user.image ? extractGitHubIdFromAvatarUrl(user.image) : null);
      
      if (!githubId) {
        throw new Error('Unable to determine GitHub ID');
      }
      
      // Insert changelog record
      const { data, error } = await supabase
        .from('changelogs')
        .insert({
          repository_url: repositoryUrl,
          repository_name: repositoryName,
          from_commit: fromCommit,
          to_commit: toCommit,
          user_id: githubId,
          status: 'pending',
        })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      // Trigger background processing (this would likely be a separate process)
      
      revalidatePath('/changelogs');
      return data;
    });
  } catch (error) {
    console.error('Error generating changelog:', error);
    throw new Error('Failed to generate changelog');
  }
} 