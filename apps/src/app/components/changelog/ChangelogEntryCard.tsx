import React from 'react';
import Link from 'next/link';

interface ChangelogEntryCardProps {
  date: string;
  tag?: 'NEW' | 'IMPROVED' | 'FIXED' | 'SECURITY';
  title: string;
  description: string;
  issueNumbers?: string[];
  repoName?: string;
  repoId?: string | number;
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
      const month = date.toLocaleDateString('en-US', { month: 'long' }).toUpperCase();
      const day = date.getDate();
      
      return { month, day };
    } catch (e) {
      return { month: 'UNKNOWN', day: '00' };
    }
  };

  const { month, day } = formatDate(date);
  
  // Convert description to bullet points if it contains line breaks
  const bulletPoints = description.split('\n').filter(line => line.trim().length > 0);

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
          {/* Tag */}
          <div className="mb-3">
            {tag && (
              <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-sm border ${getTagColor(tag)}`}>
                {tag}
              </span>
            )}
          </div>

          {/* Title */}
          <div className="relative overflow-hidden mb-3">
            <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">{title}</h3>
          </div>

          {/* Bullet points */}
          <ul className="mb-3 space-y-2">
            {bulletPoints.map((point, pointIndex) => (
              <li key={pointIndex} className="relative overflow-hidden flex">
                <span className="text-gray-900 dark:text-gray-100 mr-2">-</span>
                <span className="text-gray-600 dark:text-gray-400">{point}</span>
              </li>
            ))}
          </ul>

          {/* Issue references */}
          {issueNumbers.length > 0 && (
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {issueNumbers.map((num, idx) => (
                <span key={idx}>
                  #{num}
                  {idx < issueNumbers.length - 1 ? ", " : ""}
                </span>
              ))}
            </div>
          )}
          
          {/* Repository link if available */}
          {repoName && repoId && (
            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800">
              <Link 
                href={`/repository/${repoId}`}
                className="text-blue-600 dark:text-blue-400 text-sm hover:text-blue-800 dark:hover:text-blue-300 flex items-center"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {repoName}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 