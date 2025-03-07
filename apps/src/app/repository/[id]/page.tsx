'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

interface CommitData {
  sha: string;
  message: string;
  author: string;
  date: string;
  changedFiles: {
    filename: string;
    status: string;
    additions: number;
    deletions: number;
  }[];
}

interface RepositoryData {
  id: number;
  name: string;
  fullName: string;
  description: string;
  defaultBranch: string;
}

export default function RepositoryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [repo, setRepo] = useState<RepositoryData | null>(null);
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingCommits, setFetchingCommits] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days ago
    to: new Date().toISOString().split('T')[0], // today
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/');
    }
  }, [sessionStatus, router]);

  // Fetch repository details
  useEffect(() => {
    const fetchRepoDetails = async () => {
      if (sessionStatus !== 'authenticated' || !params.id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/user/repos/${params.id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch repository details: ${response.statusText}`);
        }
        
        const data = await response.json();
        setRepo(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching repository details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch repository');
      } finally {
        setLoading(false);
      }
    };

    fetchRepoDetails();
  }, [params.id, sessionStatus]);

  // Fetch repository commits - using useCallback to memoize the function
  const fetchCommits = useCallback(async () => {
    if (!repo || !params.id) return;
    
    try {
      setFetchingCommits(true);
      const response = await fetch(
        `/api/user/repos/${params.id}/commits?from=${dateRange.from}&to=${dateRange.to}`
      );
      
      if (!response.ok) {
        throw new Error(`Failed to fetch commits: ${response.statusText}`);
      }
      
      const data = await response.json();
      setCommits(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching commits:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch commits');
    } finally {
      setFetchingCommits(false);
    }
  }, [repo, params.id, dateRange.from, dateRange.to]);

  // Fetch commits when repo data is loaded or date range changes
  useEffect(() => {
    if (repo && params.id) {
      fetchCommits();
    }
  }, [fetchCommits, repo, params.id]);

  // Generate changelog
  const generateChangelog = async () => {
    if (!repo || commits.length === 0) return;
    
    try {
      setGenerating(true);
      
      // Data to save to Supabase
      const changelogData = {
        repoId: repo.id,
        repoName: repo.name,
        dateRange: dateRange,
        commits: commits,
        generatedAt: new Date().toISOString(),
      };
      
      // Save to Supabase
      const response = await fetch('/api/changelog/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changelogData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to generate changelog: ${response.statusText}`);
      }
      
      setGenerationComplete(true);
      setTimeout(() => router.push('/dashboard'), 2000); // Redirect after 2 seconds
    } catch (err) {
      console.error('Error generating changelog:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate changelog');
    } finally {
      setGenerating(false);
    }
  };

  // Loading state for session
  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/dashboard" className="text-blue-600 flex items-center mb-4">
            <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </Link>
          
          {repo ? (
            <h1 className="text-2xl font-bold">{repo.name}</h1>
          ) : loading ? (
            <div className="h-8 w-64 bg-gray-200 rounded animate-pulse"></div>
          ) : (
            <h1 className="text-2xl font-bold text-red-600">Repository Not Found</h1>
          )}
        </div>

        {error && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200 mb-6">
            <p className="text-red-600">{error}</p>
            <button 
              onClick={() => router.refresh()}
              className="text-blue-600 text-sm font-medium mt-2"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Date range selection */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <h2 className="text-xl font-semibold mb-4">Generate Changelog</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange({ ...dateRange, from: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                disabled={loading || fetchingCommits || generating}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange({ ...dateRange, to: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded"
                disabled={loading || fetchingCommits || generating}
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={fetchCommits}
              disabled={loading || fetchingCommits || generating || !repo}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded mr-3 hover:bg-gray-300 disabled:opacity-50"
            >
              {fetchingCommits ? 'Refreshing...' : 'Refresh Commits'}
            </button>
            <button
              onClick={generateChangelog}
              disabled={loading || fetchingCommits || generating || commits.length === 0}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {generating ? (
                <>
                  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  Generating...
                </>
              ) : generationComplete ? (
                <>
                  <svg className="w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                  Generated!
                </>
              ) : (
                'Generate Changelog'
              )}
            </button>
          </div>
        </div>

        {/* Commits preview */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Commits ({commits.length})</h2>
          
          {loading || fetchingCommits ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4">
                  <div className="h-6 w-3/4 bg-gray-200 rounded animate-pulse mb-2"></div>
                  <div className="h-4 w-1/4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : commits.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              No commits found in the selected date range.
            </div>
          ) : (
            <div className="space-y-4">
              {commits.map((commit, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="font-medium truncate" title={commit.message}>
                      {commit.message}
                    </div>
                    <div className="text-xs text-gray-500 ml-4">
                      {new Date(commit.date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    By {commit.author} • {commit.changedFiles.length} files changed
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 