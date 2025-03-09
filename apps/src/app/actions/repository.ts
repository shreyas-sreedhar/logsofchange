'use server';

import { getRepositoryContext } from '../lib/repository-analyzer';
import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';

/**
 * Analyzes a GitHub repository
 */
export async function analyzeRepository(repositoryUrl: string) {
  // Validate input
  if (!repositoryUrl) {
    throw new Error('Repository URL is required');
  }
  
  try {
    // Check authentication
    const session = await getServerSession(authOptions as any);
    if (!session) {
      throw new Error('Authentication required');
    }
    
    // Access token might be in different places depending on your NextAuth config
    // Here we safely try to access it or fall back to an environment variable
    const accessToken = 
      // Try to access token from session using bracket notation for type safety
      (session as any)?.accessToken || 
      process.env.GITHUB_TEST_TOKEN;
    
    if (!accessToken) {
      throw new Error('GitHub access token not found');
    }
    
    // Analyze repository
    return await getRepositoryContext(repositoryUrl, accessToken as string);
  } catch (error) {
    console.error('Error analyzing repository:', error);
    throw error;
  }
}

/**
 * Form action wrapper for analyzeRepository
 */
export async function analyzeRepositoryForm(formData: FormData) {
  const repositoryUrl = formData.get('repositoryUrl')?.toString();
  
  if (!repositoryUrl) {
    throw new Error('Repository URL is required');
  }
  
  return analyzeRepository(repositoryUrl);
} 