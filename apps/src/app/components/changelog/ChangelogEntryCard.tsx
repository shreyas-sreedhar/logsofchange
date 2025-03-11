import React from 'react';
import Link from 'next/link';

interface ChangelogEntryCardProps {
  date: string;
  tag?: 'NEW' | 'IMPROVED' | 'FIXED';
  title: string;
  description: string;
  issueNumbers?: string[];
  repoName?: string;
  repoId?: string | number;
}

// Map tag to appropriate color
const getTagColor = (tag?: 'NEW' | 'IMPROVED' | 'FIXED') => {
  switch (tag) {
    case 'NEW': return 'bg-green-100 text-green-800';
    case 'IMPROVED': return 'bg-blue-100 text-blue-800';
    case 'FIXED': return 'bg-amber-100 text-amber-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function ChangelogEntryCard({
  date,
  tag,
  title,
  description,
  issueNumbers = [],
  repoName,
  repoId
}: ChangelogEntryCardProps) {
  // Format date string
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'long',
        day: '2-digit',
        year: 'numeric'
      }).toUpperCase();
    } catch (e) {
      return dateString;
    }
  };

  const formattedDate = formatDate(date);
  const tagColorClass = getTagColor(tag);

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-center mb-4">
        <span className="text-gray-500 text-sm font-medium">{formattedDate}</span>
        {tag && (
          <span className={`inline-block px-2 py-1 text-xs font-medium rounded ${tagColorClass}`}>
            {tag}
          </span>
        )}
      </div>
      
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4">{description}</p>
      
      {/* Issue references */}
      {issueNumbers.length > 0 && (
        <div className="flex items-center space-x-2 mb-2">
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M10 1a9 9 0 100 18 9 9 0 000-18zM5.5 10a.5.5 0 011 0 3.5 3.5 0 107 0 .5.5 0 011 0 4.5 4.5 0 11-9 0z" clipRule="evenodd" />
          </svg>
          <div className="text-gray-500 text-sm">
            {issueNumbers.map((num, idx) => (
              <span key={idx} className="mr-2">#{num}</span>
            ))}
          </div>
        </div>
      )}
      
      {/* Repository link if available */}
      {repoName && repoId && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <Link 
            href={`/repository/${repoId}`}
            className="text-blue-600 text-sm hover:text-blue-800 flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {repoName}
          </Link>
        </div>
      )}
    </div>
  );
} 