import { NextRequest } from 'next/server';
import { withAuth } from '../../../lib/middleware';
import { createApiResponse } from '../../../lib/api-utils';
import { getUserChangelogs } from '../../../actions/changelog';

/**
 * API route for listing user changelogs
 * @route GET /api/changelog/list
 */
export async function GET(request: NextRequest) {
  return withAuth(request, async (req, session) => {
    try {
      // Get query parameters
      const { searchParams } = new URL(req.url);
      const repository = searchParams.get('repository');
      
      // Build filters
      const filters: Record<string, any> = {};
      if (repository) {
        filters.repository = repository;
      }
      
      // Use the server action to get changelogs
      const changelogs = await getUserChangelogs(filters);
      
      // Return the results
      return createApiResponse(changelogs);
    } catch (error) {
      console.error('Error fetching changelogs:', error);
      return createApiResponse(undefined, 'Failed to fetch changelogs', 500);
    }
  });
} 