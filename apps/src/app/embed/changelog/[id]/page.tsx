import { supabase } from '../../../lib/db';
import { markdownToHtml } from '../../../lib/markdown';

export const dynamic = 'force-dynamic';

export default async function ChangelogEmbedPage({ params }: { params: { id: string } }) {
  // Fetch the changelog data
  const { data: changelog, error } = await supabase
    .from('changelogs')
    .select('processed_changelog, repo_name, is_public')
    .eq('id', params.id)
    .single();
  
  if (error || !changelog || !changelog.is_public) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">Changelog not available or private</p>
      </div>
    );
  }
  
  // Convert markdown to HTML
  const htmlContent = markdownToHtml(changelog.processed_changelog);
  
  return (
    <div className="p-4 max-w-3xl mx-auto changelog-embed">
      <div 
        className="prose prose-slate max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
      />
      <div className="mt-4 text-right text-xs text-gray-400">
        Changelog for {changelog.repo_name}
      </div>
    </div>
  );
} 