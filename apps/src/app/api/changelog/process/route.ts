import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
}

// Create Supabase client only if we have valid credentials
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey) 
  : null;

// Helper function to extract GitHub ID from avatar URL
function extractGitHubIdFromAvatarUrl(avatarUrl: string): string | null {
  try {
    // GitHub avatar URLs are in the format: https://avatars.githubusercontent.com/u/70530523?v=4
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

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if Supabase is properly initialized
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Database connection not available. Please check server configuration.' 
      }, { status: 500 });
    }

    // Get the data from the request
    const { changelogId } = await request.json();
    
    if (!changelogId) {
      return NextResponse.json({ error: 'Missing changelog ID' }, { status: 400 });
    }

    // Extract GitHub ID from avatar URL
    let userId = null;
    
    if (session.user.image) {
      userId = extractGitHubIdFromAvatarUrl(session.user.image);
    }
    
    // Fallback to name if we couldn't extract ID
    if (!userId && session.user.name) {
      // Use name as a fallback (not ideal but better than nothing)
      userId = session.user.name.replace(/\s+/g, '_').toLowerCase();
    }
    
    // Final fallback
    if (!userId) {
      userId = 'unknown_user';
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
    // Format the commit data for the prompt
    const commitSummaries = commits.map(commit => {
      // Get file changes summary
      const fileChanges = commit.changedFiles
        .map((file: any) => `${file.filename} (${file.status}, +${file.additions}, -${file.deletions})`)
        .join('\n  - ');

      return `* ${commit.message} (${commit.author}, ${commit.date})
  - Changed files:
  - ${fileChanges}`;
    }).join('\n\n');

    // Create the prompt for OpenAI
    const prompt = `
Generate a well-formatted changelog for the repository "${repoName}" covering changes from ${fromDate} to ${toDate}.

Here's the raw commit data:

${commitSummaries}

Please organize this into a professional changelog with the following sections:
1. Summary of changes
2. New features
3. Bug fixes
4. Other improvements
5. Breaking changes (if any)

Format the changelog in markdown.
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