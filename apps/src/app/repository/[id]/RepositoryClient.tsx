'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { RepositoryShimmer } from '../../components/repository/ShimmerLoading';
import RepositoryAnalysis from '../../components/RepositoryAnalysis';
import { ChangelogContext } from '../../lib/repository-analyzer';
import ChangelogTimeline from '../../components/changelog/ChangelogTimeline';
import useRepositoryChangelog from '../../hooks/useRepositoryChangelog';

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

interface RepositoryClientProps {
  id: string;
}

export function RepositoryClient({ id }: RepositoryClientProps) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [repo, setRepo] = useState<RepositoryData | null>(null);
  const [commits, setCommits] = useState<CommitData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    to: new Date().toISOString().split('T')[0] // Today
  });
  const [repoAnalysis, setRepoAnalysis] = useState<ChangelogContext | null>(null);
  const [showChangelogSection, setShowChangelogSection] = useState(true);
  
  // Fetch repository changelog
  const { 
    selectedChangelog: changelog, 
    loading: changelogLoading, 
    error: changelogError,
    fetchRepoChangelogs: fetchRepoChangelog, 
    fetchFullChangelog 
  } = useRepositoryChangelog(id);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/');
    }
  }, [sessionStatus, router]);

  // Fetch repository details
  useEffect(() => {
    const fetchRepoDetails = async () => {
      if (sessionStatus !== 'authenticated' || !id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/user/repos/${id}`);
        
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
  }, [id, sessionStatus]);

  // Fetch repository commits
  const fetchCommits = async () => {
    if (!repo) return;
    
    try {
      setLoading(true);
      const response = await fetch(
        `/api/user/repos/${id}/commits?from=${dateRange.from}&to=${dateRange.to}`
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
      setLoading(false);
    }
  };

  // Fetch commits when repo data is loaded or date range changes
  useEffect(() => {
    if (repo) {
      fetchCommits();
    }
  }, [repo, dateRange]);

  // Generate changelog
  const generateChangelog = async () => {
    if (!repo || commits.length === 0) return;
    
    try {
      setGenerating(true);
      setError(null);
      
      // First, analyze the repository with OpenAI
      console.log('Analyzing repository with OpenAI...');
      const analyzeResponse = await fetch('/api/changelog/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repoId: repo.id,
          repoName: repo.fullName,
          repoUrl: `https://github.com/${repo.fullName}`,
          dateRange: {
            from: dateRange.from,
            to: dateRange.to
          }
        }),
        credentials: 'include', // Include cookies for authentication
      });
      
      if (!analyzeResponse.ok) {
        let analyzeError;
        try {
          analyzeError = await analyzeResponse.json();
        } catch (jsonError) {
          // If the response is not valid JSON, get the text instead
          const errorText = await analyzeResponse.text();
          analyzeError = { error: errorText || 'Unknown error' };
        }
        
        console.error('Repository analysis failed:', analyzeError);
        // Extract error message if available
        const errorMessage = analyzeError.error || 'Unknown error occurred during repository analysis';
        console.error('Error message:', errorMessage);
        // Continue with regular changelog generation if analysis fails
        console.log('Falling back to standard changelog generation...');
      } else {
        const analyzeData = await analyzeResponse.json();
        console.log('Repository analysis successful:', analyzeData);
        
        // If analysis was successful and returned a changelog ID, fetch the changelog
        if (analyzeData.changelogId) {
          console.log('Changelog generated, fetching data...');
          await fetchFullChangelog(analyzeData.changelogId);
          setGenerationComplete(true);
          return;
        }
      }
      
      // If analysis didn't complete or didn't return a changelog ID, proceed with regular generation
      console.log('Proceeding with standard changelog generation...');
      
      // Data to save to Supabase
      const changelogData = {
        repoId: repo.id,
        repoName: repo.fullName,
        dateRange: dateRange,
        commits: commits,
        generatedAt: new Date().toISOString(),
      };
      
      console.log('Sending changelog data:', JSON.stringify(changelogData, null, 2));
      
      // Save to Supabase via API
      const response = await fetch('/api/changelog/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(changelogData),
        credentials: 'include', // Include cookies for authentication
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('Error response:', data);
        throw new Error(data.error || `Failed to generate changelog: ${response.status} ${response.statusText}`);
      }
      
      console.log('Changelog generation successful:', data);
      if (data.changelogId) {
        await fetchFullChangelog(data.changelogId);
      } else {
        // Refresh the changelog list if we don't get a specific ID
        fetchRepoChangelog();
      }
      setGenerationComplete(true);
    } catch (err) {
      console.error('Error generating changelog:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate changelog');
    } finally {
      setGenerating(false);
    }
  };

  // Handle completed repository analysis
  const handleAnalysisComplete = (analysis: ChangelogContext) => {
    setRepoAnalysis(analysis);
  };

  // Loading state for session
  if (sessionStatus === 'loading') {
    return <RepositoryShimmer />;
  }

  // Loading state for repository data
  if (loading) {
    return <RepositoryShimmer />;
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

        {/* Repository Analysis Component */}
        <RepositoryAnalysis
          repoId={id}
          repoName={repo?.fullName || ''}
          fromDate={dateRange.from}
          toDate={dateRange.to}
          onAnalysisComplete={handleAnalysisComplete}
          hideAnalyzeButton={true}
        />

        {/* Date range selection */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <h2 className="text-lg font-medium mb-4">Select Date Range</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="from-date" className="block text-sm text-gray-600 mb-1">From</label>
              <input
                id="from-date"
                type="date"
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
              />
            </div>
            <div>
              <label htmlFor="to-date" className="block text-sm text-gray-600 mb-1">To</label>
              <input
                id="to-date"
                type="date"
                className="w-full p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
              />
            </div>
          </div>
          <button 
            className="px-4 py-2 bg-black text-white  hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            onClick={fetchCommits}
          >
            Update Date Range
          </button>
        </div>

        {/* Changelog Section */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Repository Changelog</h2>
            <div>
              {changelog && (
                <Link
                  href={`/repository/${id}/changelog`}
                  className="bg-black text-white hover:bg-blue-700 px-4 py-2 rounded-none font-normal mr-3"
                >
                  View Full Changelog
                </Link>
              )}
              {!changelogLoading && !changelog && (
                <button
                  onClick={generateChangelog}
                  disabled={generating || !repo || commits.length === 0}
                  className={`
                    ${generating ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-blue-800'} 
                    text-white px-4 py-2 rounded-none font-normal
                  `}
                >
                  {generating ? 'Generating...' : 'Generate Changelog'}
                </button>
              )}
            </div>
          </div>

          {showChangelogSection && (
            <div>
              {changelogLoading ? (
                <div className="text-center py-8 bg-white p-6 border border-gray-200">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading changelog...</p>
                </div>
              ) : changelogError ? (
                <div className="text-center py-8 bg-white p-6 border border-gray-200">
                  <p className="text-red-600 mb-4">{changelogError}</p>
                  <button
                    onClick={() => fetchRepoChangelog()}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Try Again
                  </button>
                </div>
              ) : changelog ? (
                <div className="bg-white p-6 border border-gray-200">
                  <p className="mb-4">This repository has a changelog with {changelog.commit_count} commits.</p>
                  <Link
                    href={`/repository/${id}/changelog`}
                    className="text-blue-600 hover:text-blue-800 flex items-center"
                  >
                    View full changelog
                    <svg className="w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8 bg-white p-6 border border-gray-200">
                  <p className="text-gray-600 mb-4">No changelog has been generated for this repository yet.</p>
                  <button
                    onClick={generateChangelog}
                    disabled={generating || !repo || commits.length === 0}
                    className={`
                      ${generating ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'} 
                      text-white px-4 py-2 rounded-none font-normal
                    `}
                  >
                    {generating ? 'Generating...' : 'Generate Changelog'}
                  </button>
                  {generationComplete && (
                    <p className="text-green-600 mt-2">Changelog generated successfully!</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Commits section */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Commits ({commits.length})</h2>
          
          {loading ? (
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