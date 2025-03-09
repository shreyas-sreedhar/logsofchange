import { NextRequest } from 'next/server';
import { withAuth } from '../../../lib/middleware';
import { createApiResponse } from '../../../lib/api-utils';
import { analyzeRepository } from '../../../actions/repository';

/**
 * API route for analyzing GitHub repositories
 * @route POST /api/repository/analyze
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      // Parse request body
      const body = await req.json();
      const { repositoryUrl } = body;
      
      if (!repositoryUrl) {
        return createApiResponse(undefined, 'Repository URL is required', 400);
      }
      
      // Use the server action to analyze the repository
      const repoContext = await analyzeRepository(repositoryUrl);
      
      // Return the analysis results
      return createApiResponse(repoContext);
    } catch (error) {
      console.error('Error analyzing repository:', error);
      return createApiResponse(
        undefined, 
        error instanceof Error ? error.message : 'Failed to analyze repository', 
        500
      );
    }
  });
} 