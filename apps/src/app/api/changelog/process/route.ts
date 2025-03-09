import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Database configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
const supabase = (() => {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase environment variables');
    return null;
  }
  return createClient(supabaseUrl, supabaseServiceKey);
})();

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Helper function to extract GitHub ID from avatar URL
 */
function extractGitHubIdFromAvatarUrl(avatarUrl: string): string | null {
  try {
    const match = avatarUrl.match(/\/u\/(\d+)/);
    return match && match[1] ? match[1] : null;
  } catch (error) {
    console.error('Error extracting GitHub ID:', error);
    return null;
  }
}

/**
 * API route for processing changelogs
 * Authentication is handled by middleware
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Supabase is properly initialized
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Database connection not available' 
      }, { status: 500 });
    }

    // Get the data from the request
    const { changelogId } = await request.json();
    
    if (!changelogId) {
      return NextResponse.json({ error: 'Missing changelog ID' }, { status: 400 });
    }

    // Get user information from token
    const token = await getToken({ req: request });
    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    // Determine user ID from token
    let userId = token.sub;
    
    // Try to get a more specific ID if available
    if (token.picture) {
      const extractedId = extractGitHubIdFromAvatarUrl(token.picture as string);
      if (extractedId) userId = extractedId;
    }

    // Fetch the changelog data from Supabase
    const { data: changelog, error: fetchError } = await supabase
      .from('changelogs')
      .select('*')
      .eq('id', changelogId)
      .single();

    if (fetchError || !changelog) {
      console.error('Error fetching changelog:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch changelog data' }, { status: 500 });
    }

    // Verify ownership
    if (changelog.user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized access to changelog' }, { status: 403 });
    }

    // Parse the raw commit data
    const commits = JSON.parse(changelog.raw_data);

    // Generate the changelog using OpenAI
    const processedChangelog = await generateChangelog(
      changelog.repo_name,
      commits,
      changelog.from_date,
      changelog.to_date
    );

    // Update the changelog record with the processed content
    const { error: updateError } = await supabase
      .from('changelogs')
      .update({
        processed_changelog: processedChangelog,
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('id', changelogId);

    if (updateError) {
      console.error('Error updating changelog:', updateError);
      return NextResponse.json({ error: 'Failed to update changelog data' }, { status: 500 });
    }

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Changelog processed successfully',
      changelogId: changelogId,
      changelog: processedChangelog
    });
  } catch (error) {
    console.error('Error processing changelog:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Generate a formatted changelog using OpenAI
 */
async function generateChangelog(
  repoName: string,
  commits: any[],
  fromDate: string,
  toDate: string
): Promise<string> {
  try {
    const commitSummaries = commits.map(commit => {
      const fileChanges = commit.changedFiles
        .map((file: any) => `${file.filename} (${file.status}, +${file.additions}, -${file.deletions})`)
        .join('\n  - ');

      return `* ${commit.message} (${commit.author}, ${commit.date})
  - Changed files:
  - ${fileChanges}`;
    }).join('\n\n');

    const prompt = `
Generate a well-formatted changelog in Markdown for the repository "${repoName}" based on commit data from ${fromDate} to ${toDate}.

Below is the raw commit data to process:

${commitSummaries}

Using this data, create a professional changelog with the following sections:
- **Date**: The date of the changelog.

- **Summary of Changes**: A concise overview of the updates in this period, very concise and technical.
- **New Features**: List of added features, with brief descriptions.
- **Bug Fixes**: List of resolved issues, with short explanations.
- **Other Improvements**: Enhancements or optimizations not covered above.
- **Breaking Changes**: Any changes that might affect existing users or integrations (include "None" if there are none).

Guidelines:
- Format the output in clean, readable Markdown with appropriate headings (e.g., ## for sections).
- Use bullet points (- or *) for lists within each section.
- Categorize commits intelligently based on their content (e.g., "feat:" for features, "fix:" for bugs).
- If the commit data lacks context, make reasonable assumptions or note where clarification is needed.
- Ensure the tone is professional and suitable for a public-facing changelog.
`;

    // Call OpenAI API to generate the changelog
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a helpful assistant that generates clean, professional changelogs from Git commit data Your language should be in a tone that talks to users and developers" },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    return completion.choices[0].message.content || 'Failed to generate changelog';
  } catch (error) {
    console.error('Error calling OpenAI:', error);
    throw new Error('Failed to generate changelog with OpenAI');
  }
} 