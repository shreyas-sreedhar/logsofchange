import React from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

interface ChangelogEntry {
  title: string;
  description: string;
  tag?: 'NEW' | 'IMPROVED' | 'FIXED' | 'SECURITY';
  issueNumbers?: string[];
  repoName?: string;
  repoId?: string | number;
}

interface ChangelogDateBlockProps {
  date: string;
  entries: ChangelogEntry[];
}

// Helper function to get tag color
const getTagColor = (tag?: string) => {
  switch (tag) {
    case "NEW":
      return "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
    case "IMPROVED":
      return "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800";
    case "FIXED":
      return "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800";
    case "SECURITY":
      return "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
    default:
      return "bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-800";
  }
};

export default function ChangelogDateBlock({ date, entries }: ChangelogDateBlockProps) {
  // Format date string
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const month = date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
      const day = date.getDate();
      
      return { month, day };
    } catch (e) {
      return { month: 'UNKNOWN', day: '00' };
    }
  };

  const { month, day } = formatDate(date);
  
  // Group entries by tag
  const groupedByTag: Record<string, ChangelogEntry[]> = {};
  entries.forEach(entry => {
    const tag = entry.tag || 'OTHER';
    if (!groupedByTag[tag]) {
      groupedByTag[tag] = [];
    }
    groupedByTag[tag].push(entry);
  });
  
  // Order of tags
  const tagOrder = ['NEW', 'IMPROVED', 'FIXED', 'SECURITY', 'OTHER'];
  
  // Sort tags
  const sortedTags = Object.keys(groupedByTag).sort(
    (a, b) => tagOrder.indexOf(a) - tagOrder.indexOf(b)
  );

  return (
    <div className="relative flex">
      {/* Date on the left */}
      <div className="w-24 pt-2 text-right pr-8 text-sm font-medium text-gray-500 dark:text-gray-400">
        {month}
        <div className="text-xs">{day}</div>
      </div>

      {/* Timeline dot */}
      <div className="absolute left-24 top-3 w-3 h-3 rounded-full bg-purple-500 dark:bg-purple-400 transform -translate-x-1.5 z-10"></div>

      {/* Card on the right */}
      <div className="flex-1 ml-10">
        <div className="bg-white dark:bg-gray-950 p-5 border border-gray-200 dark:border-gray-800 shadow-md rounded-lg">
          {sortedTags.map(tag => (
            <div key={tag} className="mb-6 last:mb-0">
              {/* Tag header */}
              <div className="mb-3">
                <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-sm border ${getTagColor(tag)}`}>
                  {tag}
                </span>
              </div>
              
              {/* Entries for this tag */}
              <div className="space-y-4">
                {groupedByTag[tag].map((entry, index) => (
                  <div key={index} className="border-b border-gray-100 dark:border-gray-800 last:border-0 pb-4 last:pb-0">
                    {/* Title */}
                    <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">{entry.title}</h3>
                    
                    {/* Description with markdown support */}
                    <div className="mb-3 prose dark:prose-invert prose-sm max-w-none">
                      <ReactMarkdown>
                        {entry.description}
                      </ReactMarkdown>
                    </div>
                    
                    {/* Issue references */}
                    {entry.issueNumbers && entry.issueNumbers.length > 0 && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {entry.issueNumbers.map((num, idx) => (
                          <span key={idx}>
                            #{num}
                            {idx < entry.issueNumbers.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    {/* Repository link if available */}
                    {entry.repoName && entry.repoId && (
                      <div className="mt-2 text-right">
                        <Link 
                          href={`/repository/${entry.repoId}`}
                          className="text-blue-600 dark:text-blue-400 text-xs hover:text-blue-800 dark:hover:text-blue-300 flex items-center justify-end"
                        >
                          {entry.repoName}
                          <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </Link>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 