'use client';
//this page is the changelogs page that displays all the changelogs for the user and with all the repos together, 

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Changelog } from '../hooks/useChangelogs';
import ChangelogDateBlock from '../components/changelog/ChangelogDateBlock';

// Helper function to parse changelog content
const parseChangelogContent = (content: string) => {
  if (!content) return [];

  // Split the content by markdown headings
  const sections = content.split(/^##\s+/gm).filter(Boolean);
  
  // Process each section into entries
  return sections.map(section => {
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
};

export default function ChangelogsPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupedEntries, setGroupedEntries] = useState<Record<string, any[]>>({});

  // Redirect to login if not authenticated
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/');
    }
  }, [sessionStatus, router]);

  // Fetch all changelogs
  useEffect(() => {
    const fetchChangelogs = async () => {
      if (sessionStatus !== 'authenticated') return;
      
      try {
        setLoading(true);
        
        // Fetch with a large limit to get all changelogs
        const response = await fetch('/api/changelog/list?limit=100');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch changelogs: ${response.statusText}`);
        }
        
        const data = await response.json();
        setChangelogs(data.changelogs || []);
        
        // Process and group all changelog entries
        const allEntries: any[] = [];
        
        // Loop through all changelogs and parse their content
        data.changelogs.forEach((changelog: Changelog) => {
          if (changelog.processed_changelog) {
            const entries = parseChangelogContent(changelog.processed_changelog);
            
            // Add repo info to each entry
            entries.forEach(entry => {
              allEntries.push({
                ...entry,
                repoId: changelog.repo_id,
                repoName: changelog.repo_name
              });
            });
          }
        });
        
        // Group entries by date
        const entriesByDate: Record<string, any[]> = {};
        
        allEntries.forEach(entry => {
          const date = new Date(entry.date);
          // Format date as YYYY-MM-DD
          const dateKey = date.toISOString().split('T')[0];
          
          if (!entriesByDate[dateKey]) {
            entriesByDate[dateKey] = [];
          }
          
          entriesByDate[dateKey].push(entry);
        });
        
        // Sort dates in descending order
        const sortedDates = Object.keys(entriesByDate).sort((a, b) => 
          new Date(b).getTime() - new Date(a).getTime()
        );
        
        // Create a new object with sorted dates
        const sortedEntries: Record<string, any[]> = {};
        sortedDates.forEach(date => {
          sortedEntries[date] = entriesByDate[date];
        });
        
        setGroupedEntries(sortedEntries);
        setError(null);
      } catch (err) {
        console.error('Error fetching changelogs:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch changelogs');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChangelogs();
  }, [sessionStatus]);

  // Loading state
  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading changelogs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/dashboard" className="text-blue-600 dark:text-blue-400 flex items-center mb-2">
            <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">All Changelogs</h1>
        </div>
        
        {error ? (
          <div className="text-center py-8 bg-white dark:bg-gray-950 p-6 shadow rounded-lg border border-gray-200 dark:border-gray-800">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => router.refresh()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-500"
            >
              Try Again
            </button>
          </div>
        ) : changelogs.length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-gray-950 p-6 shadow rounded-lg border border-gray-200 dark:border-gray-800">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No changelogs have been generated yet.</p>
            <Link 
              href="/dashboard"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-500"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : Object.keys(groupedEntries).length === 0 ? (
          <div className="text-center py-8 bg-white dark:bg-gray-950 p-6 shadow rounded-lg border border-gray-200 dark:border-gray-800">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No processed changelog entries found.</p>
            <Link 
              href="/dashboard"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-500"
            >
              Back to Dashboard
            </Link>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-24 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-800"></div>
            
            {/* Timeline entries */}
            <div className="space-y-12">
              {Object.keys(groupedEntries).map(date => (
                <ChangelogDateBlock
                  key={date}
                  date={date}
                  entries={groupedEntries[date]}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 