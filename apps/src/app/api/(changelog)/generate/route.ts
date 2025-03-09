import { NextRequest } from 'next/server';
import { withAuth } from '../../../lib/middleware';
import { createApiResponse } from '../../../lib/api-utils';
import { generateChangelog } from '../../../actions/changelog';

/**
 * API route for generating changelogs
 * @route POST /api/changelog/generate
 */
export async function POST(request: NextRequest) {
  return withAuth(request, async (req) => {
    try {
      // Parse the form data
      const formData = await req.formData();
      
      // Use the server action to generate the changelog
      const changelog = await generateChangelog(formData);
      
      // Return the generated changelog
      return createApiResponse(changelog);
    } catch (error) {
      console.error('Error generating changelog:', error);
      return createApiResponse(undefined, 'Failed to generate changelog', 500);
    }
  });
} 