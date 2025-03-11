import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import ChangelogDateBlock from './ChangelogDateBlock';

interface ChangelogTimelineProps {
  changelog: {
    id: string;
    repo_id: number;
    repo_name: string;
    processed_changelog: string | null;
    repository_context?: {
      technologies?: string[];
      pullRequests?: Array<{
        number: number;
        title: string;
        mergedAt?: string;
      }>;
    };
    generated_at: string;
    processed_at: string | null;
    commit_count: number;
  };
  showRepoInfo?: boolean;
}

// Parse the processed changelog to get the structured data
const parseChangelogContent = (content: string) => {
  if (!content) return [];

  // Split the content by markdown headings
  const sections = content.split(/^##\s+/gm).filter(Boolean);
  
  // Process each section into entries
  const entries = sections.map(section => {
    const lines = section.trim().split('\n');
    const title = lines[0].trim();
    const content = lines.slice(1).join('\n').trim();
    
    // Try to extract date from title (if it exists)
    let date = new Date().toISOString();
    const dateMatch = title.match(/\b\d{4}-\d{2}-\d{2}\b/);
    if (dateMatch) {
      date = dateMatch[0];
    }
    
    // Try to detect entry type (NEW, IMPROVED, FIXED, SECURITY)
    let tag: 'NEW' | 'IMPROVED' | 'FIXED' | 'SECURITY' | undefined;
    if (/new|add|added|feature|implement/i.test(title)) {
      tag = 'NEW';
    } else if (/improve|enhancement|better|update|updated/i.test(title)) {
      tag = 'IMPROVED';
    } else if (/fix|fixed|bug|issue|resolve|resolved/i.test(title)) {
      tag = 'FIXED';
    } else if (/security|vulnerability|secure|protect/i.test(title)) {
      tag = 'SECURITY';
    }
    
    // Look for issue numbers
    const issueRegex = /#(\d+)/g;
    const issueNumbers: string[] = [];
    let match;
    while ((match = issueRegex.exec(content)) !== null) {
      issueNumbers.push(match[1]);
    }
    
    return { 
      title, 
      description: content,
      date,
      tag,
      issueNumbers
    };
  });

  return entries;
};

// Group entries by date
const groupEntriesByDate = (entries: ReturnType<typeof parseChangelogContent>) => {
  const groups: Record<string, ReturnType<typeof parseChangelogContent>> = {};
  
  entries.forEach(entry => {
    const date = new Date(entry.date);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    
    groups[dateKey].push(entry);
  });
  
  // Sort dates in descending order
  return Object.entries(groups)
    .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
    .map(([date, entries]) => ({ date, entries }));
};

export default function ChangelogTimeline({ changelog, showRepoInfo = false }: ChangelogTimelineProps) {
  // Get formatted time
  const generatedTime = formatDistanceToNow(new Date(changelog.generated_at), { addSuffix: true });
  
  // Parse changelog entries if available
  const entries = changelog.processed_changelog 
    ? parseChangelogContent(changelog.processed_changelog)
    : [];
    
  // Group entries by date
  const groupedEntries = groupEntriesByDate(entries);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Changelog</h2>
        <div className="text-gray-600 dark:text-gray-400 text-sm">
          <span>{changelog.commit_count} commit{changelog.commit_count !== 1 ? 's' : ''}</span>
          <span className="mx-2">•</span>
          <span>Generated {generatedTime}</span>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg shadow-sm">
          {changelog.processed_changelog === null ? 'Changelog is still processing...' : 'No entries found in the changelog.'}
        </div>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-24 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800"></div>

          {/* Timeline entries */}
          <div className="space-y-12">
            {groupedEntries.map((group) => (
              <ChangelogDateBlock 
                key={group.date}
                date={group.date}
                entries={group.entries.map(entry => ({
                  title: entry.title,
                  description: entry.description,
                  tag: entry.tag,
                  issueNumbers: entry.issueNumbers,
                  repoId: showRepoInfo ? changelog.repo_id : undefined,
                  repoName: showRepoInfo ? changelog.repo_name : undefined
                }))}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 