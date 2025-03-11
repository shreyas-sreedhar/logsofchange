import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../auth';
import OpenAI from 'openai';
import { getRepositoryContext, RepoContext } from '../../../lib/repository-analyzer';
import { createChangelog } from '../../../lib/db/index';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * API route for analyzing a repository with OpenAI and generating a changelog
 * Authentication is handled by middleware
 */
export async function POST(request: NextRequest) {
  console.log('📝 [REPO ANALYZE] Starting repository analysis process');
  try {
    // Get the authenticated session
    console.log('📝 [REPO ANALYZE] Authenticating user session');
    const session = await auth();
    
    // Check if user is authenticated
    if (!session?.user?.id) {
      console.error('❌ [REPO ANALYZE] Authentication failed: No user ID in session');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`✅ [REPO ANALYZE] User authenticated: ${session.user.id}`);

    // Get the data from the request
    console.log('📝 [REPO ANALYZE] Parsing request data');
    const repoData = await request.json();
    
    // Validate required fields
    if (!repoData || !repoData.repoId || !repoData.repoUrl || !repoData.repoName) {
      console.error('❌ [REPO ANALYZE] Invalid request data:', JSON.stringify(repoData || {}));
      return NextResponse.json({ error: 'Invalid request data. Required: repoId, repoUrl, repoName' }, { status: 400 });
    }
    console.log('✅ [REPO ANALYZE] Request data validated');

    // Get user ID from session
    const userId = session.user.id;
    
    console.log(`📝 [REPO ANALYZE] User: ${userId}`);
    console.log(`📝 [REPO ANALYZE] Repository ID: ${repoData.repoId}`);
    console.log(`📝 [REPO ANALYZE] Repository Name: ${repoData.repoName}`);
    console.log(`📝 [REPO ANALYZE] Repository URL: ${repoData.repoUrl}`);

    // Get repository context
    console.log(`📝 [REPO ANALYZE] Fetching repository context from GitHub`);
    let repoContext: RepoContext;
    try {
      repoContext = await getRepositoryContext(repoData.repoUrl, session.accessToken);
      console.log(`✅ [REPO ANALYZE] Repository context fetched successfully`);
    } catch (error) {
      console.error('❌ [REPO ANALYZE] Error fetching repository context:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch repository context from GitHub' 
      }, { status: 500 });
    }

    // Analyze repository with OpenAI
    console.log(`📝 [REPO ANALYZE] Analyzing repository with OpenAI`);
    let aiAnalysis;
    try {
      aiAnalysis = await analyzeRepositoryWithAI(repoContext);
      console.log(`✅ [REPO ANALYZE] Repository analyzed successfully with OpenAI`);
    } catch (error) {
      console.error('❌ [REPO ANALYZE] Error analyzing repository with OpenAI:', error);
      
      // Return a more detailed error response
      const errorMessage = error instanceof Error ? error.message : 'Failed to analyze repository with OpenAI';
      return NextResponse.json({ 
        error: errorMessage,
        details: error instanceof Error ? error.stack : undefined
      }, { status: 500 });
    }

    // Prepare data for database
    console.log('📝 [REPO ANALYZE] Preparing data for database');
    const dateRange = {
      from: repoData.dateRange?.from || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      to: repoData.dateRange?.to || new Date().toISOString()
    };

    const changelogInput = {
      user_id: userId,
      repo_id: repoData.repoId,
      repo_name: repoData.repoName,
      from_date: dateRange.from,
      to_date: dateRange.to,
      commit_count: 0, // Will be updated when commits are fetched
      raw_data: JSON.stringify([]), // Will be updated when commits are fetched
      status: 'processing' as 'processing' | 'completed' | 'failed',
      generated_at: new Date().toISOString(),
      repository_context: JSON.stringify(aiAnalysis)
    };

    try {
      // Insert the data using the createChangelog function
      console.log('📝 [REPO ANALYZE] Creating changelog record in database');
      const changelog = await createChangelog(changelogInput);
      
      if (!changelog) {
        console.error('❌ [REPO ANALYZE] Failed to create changelog record');
        return NextResponse.json({ error: 'Failed to save changelog data' }, { status: 500 });
      }

      console.log(`✅ [REPO ANALYZE] Changelog created successfully with ID: ${changelog.id}`);

      // Trigger the processing of the changelog
      try {
        console.log(`📝 [REPO ANALYZE] Triggering commit fetching for changelog ID: ${changelog.id}`);
        // Call the fetch-commits endpoint to get commit data
        const fetchCommitsUrl = `${request.nextUrl.origin}/api/changelog/fetch-commits`;
        console.log(`📝 [REPO ANALYZE] Calling fetch-commits endpoint: ${fetchCommitsUrl}`);
        
        const fetchResponse = await fetch(fetchCommitsUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            // Pass the authorization header to maintain the session
            'Authorization': request.headers.get('Authorization') || '',
            'Cookie': request.headers.get('Cookie') || ''
          },
          body: JSON.stringify({ 
            changelogId: changelog.id,
            repoName: repoData.repoName,
            fromDate: dateRange.from,
            toDate: dateRange.to
          })
        });

        if (!fetchResponse.ok) {
          const errorText = await fetchResponse.text();
          console.warn(`⚠️ [REPO ANALYZE] Failed to trigger commit fetching: ${fetchResponse.status} ${fetchResponse.statusText}`);
          console.warn(`⚠️ [REPO ANALYZE] Error details: ${errorText}`);
          // We still return success since the changelog was created
        } else {
          const fetchResult = await fetchResponse.json();
          console.log(`✅ [REPO ANALYZE] Commit fetching triggered successfully: ${JSON.stringify(fetchResult)}`);
        }
      } catch (processError) {
        console.error(`❌ [REPO ANALYZE] Error triggering commit fetching:`, processError);
        // We still return success since the changelog was created
      }

      // Return success response with the created record ID
      console.log(`✅ [REPO ANALYZE] Returning success response with changelog ID: ${changelog.id}`);
      return NextResponse.json({ 
        success: true, 
        message: 'Repository analyzed and changelog creation started',
        changelogId: changelog.id,
        analysis: aiAnalysis
      });
    } catch (dbError) {
      console.error('❌ [REPO ANALYZE] Database error:', dbError);
      return NextResponse.json({ 
        error: 'Database error. Please check your database configuration.' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ [REPO ANALYZE] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Analyze a repository with OpenAI
 */
async function analyzeRepositoryWithAI(repoContext: RepoContext): Promise<any> {
  console.log(`📝 [OPENAI] Starting repository analysis for ${repoContext.repositoryName}`);
  try {
    const prompt = `
Analyze this GitHub repository and provide a comprehensive summary:

Repository Name: ${repoContext.repositoryName}
${repoContext.description ? `Description: ${repoContext.description}` : ''}
Main Purpose: ${repoContext.mainPurpose}
Technologies: ${repoContext.technologies.join(', ')}

Key Files:
${repoContext.keyFiles.map(file => `- ${file}`).join('\n')}

File Structure:
${repoContext.fileStructure}

${repoContext.readme ? `README Content:\n${repoContext.readme.substring(0, 2000)}${repoContext.readme.length > 2000 ? '...(truncated)' : ''}` : ''}

Based on this information, please provide:
1. A concise summary of what this repository does (2-3 sentences)
2. The main technologies and frameworks used
3. The architecture of the application (if discernible)
4. Key components and their relationships
5. Potential areas where changes might be most frequent
6. Any notable patterns or conventions used in the codebase

IMPORTANT: Format your response as a valid JSON object with the following structure:
{
  "summary": "Brief description of the repository",
  "technologies": ["tech1", "tech2", ...],
  "architecture": "Description of the architecture",
  "keyComponents": [
    {"name": "Component1", "purpose": "What this component does", "relationships": ["Related components"]}
  ],
  "changeHotspots": ["Areas likely to change frequently"],
  "patterns": ["Notable patterns or conventions"]
}

Your entire response must be a valid JSON object that can be parsed with JSON.parse().
`;

    console.log(`📝 [OPENAI] Prompt prepared, length: ${prompt.length} characters`);
    console.log(`📝 [OPENAI] Calling OpenAI API with model: gpt-4`);
    
    const startTime = Date.now();
    // Call OpenAI API to analyze the repository
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are an expert software engineer specializing in code analysis and architecture. Your task is to analyze GitHub repositories and provide insightful summaries. IMPORTANT: You must respond with a valid JSON object that can be parsed with JSON.parse(). Do not include any text outside of the JSON object." 
        },
        { role: "user", content: prompt }
      ]
    });

    const responseTime = Date.now() - startTime;
    console.log(`✅ [OPENAI] Response received in ${responseTime}ms`);
    
    const analysisText = completion.choices[0].message.content;
    if (!analysisText) {
      throw new Error('Empty response from OpenAI');
    }
    
    // Parse the JSON response
    try {
      // Since we're not using response_format: json_object, we need to extract the JSON from the text
      // First, try to parse the entire response as JSON
      let analysis;
      try {
        analysis = JSON.parse(analysisText);
      } catch (parseError) {
        // If that fails, try to extract JSON from the text
        console.log(`📝 [OPENAI] Response is not valid JSON, attempting to extract JSON from text`);
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          // If we can't extract JSON, create a simple object with the text as summary
          analysis = {
            summary: analysisText.substring(0, 500),
            technologies: [],
            architecture: "Could not determine architecture",
            keyComponents: [],
            changeHotspots: [],
            patterns: []
          };
        }
      }
      
      console.log(`✅ [OPENAI] Analysis parsed successfully`);
      return analysis;
    } catch (error) {
      console.error(`❌ [OPENAI] Error parsing analysis:`, error);
      throw new Error(`Failed to parse OpenAI response: ${error instanceof Error ? error.message : String(error)}`);
    }
  } catch (error) {
    console.error(`❌ [OPENAI] Error analyzing repository:`, error);
    throw error;
  }
}