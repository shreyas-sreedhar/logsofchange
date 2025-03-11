import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../lib/db';
import { markdownToHtml } from '../../../../lib/markdown';

/**
 * API route to fetch a published changelog
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const format = request.nextUrl.searchParams.get('format') || 'json';
    
    // Check if Supabase is properly initialized
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Database connection not available' 
      }, { status: 500 });
    }

    // Fetch the changelog data from Supabase
    const { data: changelog, error } = await supabase
      .from('changelogs')
      .select('processed_changelog, repo_name, from_date, to_date, is_public')
      .eq('id', id)
      .single();

    if (error || !changelog) {
      return NextResponse.json({ error: 'Changelog not found' }, { status: 404 });
    }

    // Check if the changelog is public
    if (!changelog.is_public) {
      return NextResponse.json({ error: 'This changelog is not public' }, { status: 403 });
    }

    // Return the changelog in the requested format
    switch (format) {
      case 'markdown':
        return new NextResponse(changelog.processed_changelog, {
          headers: {
            'Content-Type': 'text/markdown',
            'Access-Control-Allow-Origin': '*',
          },
        });
      case 'html':
        // Convert markdown to HTML
        const html = `<!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Changelog for ${changelog.repo_name}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1, h2, h3 { margin-top: 20px; }
            ul { padding-left: 20px; }
          </style>
        </head>
        <body>
          <div id="changelog-content">${markdownToHtml(changelog.processed_changelog)}</div>
        </body>
        </html>`;
        return new NextResponse(html, {
          headers: {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*',
          },
        });
      default:
        return NextResponse.json({
          success: true,
          data: {
            content: changelog.processed_changelog,
            repo_name: changelog.repo_name,
            from_date: changelog.from_date,
            to_date: changelog.to_date
          }
        }, {
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        });
    }
  } catch (error) {
    console.error('❌ [CHANGELOG API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 