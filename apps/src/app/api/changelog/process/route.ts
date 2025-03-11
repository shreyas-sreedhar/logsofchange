import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../auth';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { getChangelogContext } from '../../../lib/repository-analyzer';

// Database configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
const supabase = (() => {
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ [CHANGELOG PROCESS] Missing Supabase environment variables');
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
    console.error('❌ [CHANGELOG PROCESS] Error extracting GitHub ID:', error);
    return null;
  }
}

/**
 * API route for processing changelogs
 * Authentication is handled by middleware
 */
export async function POST(request: NextRequest) {
  console.log('📝 [CHANGELOG PROCESS] Starting changelog processing');
  try {
    // Check if Supabase is properly initialized
    if (!supabase) {
      console.error('❌ [CHANGELOG PROCESS] Database connection not available');
      return NextResponse.json({ 
        error: 'Database connection not available' 
      }, { status: 500 });
    }

    // Get the data from the request
    console.log('📝 [CHANGELOG PROCESS] Parsing request data');
    const { changelogId } = await request.json();
    
    if (!changelogId) {
      console.error('❌ [CHANGELOG PROCESS] Missing changelog ID');
      return NextResponse.json({ error: 'Missing changelog ID' }, { status: 400 });
    }
    console.log(`📝 [CHANGELOG PROCESS] Processing changelog ID: ${changelogId}`);

    // Get user information from session
    console.log('📝 [CHANGELOG PROCESS] Authenticating user session');
    const session = await auth();
    if (!session?.user?.id) {
      console.error('❌ [CHANGELOG PROCESS] Authentication required');
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    console.log(`✅ [CHANGELOG PROCESS] User authenticated: ${session.user.id}`);
    
    // Get user ID from session
    const userId = session.user.id;

    // Fetch the changelog data from Supabase
    console.log(`📝 [CHANGELOG PROCESS] Fetching changelog data from database: ${changelogId}`);
    const { data: changelog, error: fetchError } = await supabase
      .from('changelogs')
      .select('*')
      .eq('id', changelogId)
      .single();

    if (fetchError || !changelog) {
      console.error('❌ [CHANGELOG PROCESS] Error fetching changelog:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch changelog data' }, { status: 500 });
    }
    console.log(`✅ [CHANGELOG PROCESS] Changelog data fetched successfully`);

    // Verify ownership
    if (changelog.user_id !== userId) {
      console.error(`❌ [CHANGELOG PROCESS] Unauthorized access: User ${userId} attempting to access changelog owned by ${changelog.user_id}`);
      return NextResponse.json({ error: 'Unauthorized access to changelog' }, { status: 403 });
    }
    console.log(`✅ [CHANGELOG PROCESS] Ownership verified`);

    // Parse the raw commit data
    console.log(`📝 [CHANGELOG PROCESS] Parsing raw commit data`);
    const commits = JSON.parse(changelog.raw_data);
    console.log(`📝 [CHANGELOG PROCESS] Parsed ${commits.length} commits`);

    // Generate the changelog using OpenAI
    console.log(`📝 [CHANGELOG PROCESS] Generating changelog with OpenAI for repo: ${changelog.repo_name}`);
    console.log(`📝 [CHANGELOG PROCESS] Date range: ${changelog.from_date} to ${changelog.to_date}`);
    const { processedChangelog, repositoryContext } = await generateChangelog(
      changelog.repo_name,
      commits,
      changelog.from_date,
      changelog.to_date
    );
    console.log(`✅ [CHANGELOG PROCESS] OpenAI generation completed successfully`);
    console.log(`📝 [CHANGELOG PROCESS] Generated changelog length: ${processedChangelog.length} characters`);

    // Update the changelog record with the processed content
    console.log(`📝 [CHANGELOG PROCESS] Updating changelog record in database`);
    const { error: updateError } = await supabase
      .from('changelogs')
      .update({
        processed_changelog: processedChangelog,
        status: 'completed',
        processed_at: new Date().toISOString(),
        ...(repositoryContext ? { repository_context: repositoryContext } : {})
      })
      .eq('id', changelogId);

    if (updateError) {
      console.error('❌ [CHANGELOG PROCESS] Error updating changelog:', updateError);
      return NextResponse.json({ error: 'Failed to update changelog data' }, { status: 500 });
    }
    console.log(`✅ [CHANGELOG PROCESS] Changelog record updated successfully`);

    // Return success response
    console.log(`✅ [CHANGELOG PROCESS] Processing completed successfully for changelog ID: ${changelogId}`);
    return NextResponse.json({
      success: true,
      message: 'Changelog processed successfully',
      changelogId: changelogId,
      changelog: processedChangelog
    });
  } catch (error) {
    console.error('❌ [CHANGELOG PROCESS] Unhandled error:', error);
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
): Promise<{ processedChangelog: string, repositoryContext: any | null }> {
  console.log(`📝 [OPENAI] Starting changelog generation for ${repoName}`);
  try {
    console.log(`📝 [OPENAI] Preparing commit summaries for ${commits.length} commits`);
    const commitSummaries = commits.map(commit => {
      const fileChanges = commit.changedFiles
        .map((file: any) => `${file.filename} (${file.status}, +${file.additions}, -${file.deletions})`)
        .join('\n  - ');

      return `* ${commit.message} (${commit.author}, ${commit.date})
  - Changed files:
  - ${fileChanges}`;
    }).join('\n\n');

    console.log(`📝 [OPENAI] Commit summaries prepared, length: ${commitSummaries.length} characters`);
    
    // Get additional repository context if possible
    let repoContext = null;
    try {
      const session = await auth();
      if (session?.accessToken) {
        console.log(`📝 [OPENAI] Fetching repository context for ${repoName}`);
        // Parse owner and repo from repoName (format: "owner/repo")
        const [owner, repo] = repoName.split('/');
        
        if (owner && repo) {
          repoContext = await getChangelogContext(
            session.accessToken,
            owner,
            repo,
            fromDate,
            toDate
          );
          console.log(`✅ [OPENAI] Repository context fetched successfully for ${repoName}`);
        }
      }
    } catch (error) {
      console.error(`❌ [OPENAI] Error fetching repository context:`, error);
      // Non-blocking error, continue without context
    }
    
    console.log(`📝 [OPENAI] Building prompt for OpenAI`);

    let contextPrompt = '';
    if (repoContext) {
      contextPrompt = `
Repository Context:
- Repository Name: ${repoContext.repositoryName}
${repoContext.repositoryDescription ? `- Description: ${repoContext.repositoryDescription}` : ''}
- Default Branch: ${repoContext.defaultBranch}
- Technologies: ${repoContext.technologies.join(', ')}

Key Pull Requests:
${repoContext.pullRequests.slice(0, 10).map(pr => 
  `- #${pr.number}: ${pr.title} (${pr.state}, merged at: ${pr.mergedAt || 'not merged'})`
).join('\n')}

Recent Main Branch Commits:
${repoContext.mainBranchCommits.slice(0, 10).map(commit => 
  `- ${commit.sha.substring(0, 7)}: ${commit.message.split('\n')[0]} (${commit.author}, ${commit.date})`
).join('\n')}
`;
    }

    const prompt = `
Generate a well-formatted changelog in Markdown for the repository "${repoName}" based on commit data from ${fromDate} to ${toDate}.

${contextPrompt}

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

    console.log(`📝 [OPENAI] Prompt prepared, length: ${prompt.length} characters`);
    console.log(`📝 [OPENAI] Calling OpenAI API with model: gpt-4`);
    
    const startTime = Date.now();
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
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log(`✅ [OPENAI] OpenAI API call completed in ${duration.toFixed(2)} seconds`);
    console.log(`📝 [OPENAI] Response tokens: ${completion.usage?.total_tokens || 'unknown'}`);
    
    const result = completion.choices[0].message.content || 'Failed to generate changelog';
    console.log(`✅ [OPENAI] Changelog generated successfully, length: ${result.length} characters`);
    
    return { 
      processedChangelog: result,
      repositoryContext: repoContext
    };
  } catch (error) {
    console.error('❌ [OPENAI] Error calling OpenAI:', error);
    throw new Error('Failed to generate changelog with OpenAI');
  }
} 