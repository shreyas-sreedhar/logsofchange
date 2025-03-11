'use client';
// this is the main changelog page with id that comes in, so make sure to check if the id is valid and if the user is authenticated
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Changelog } from '../../hooks/useChangelogs';
import { use } from 'react';
import { ChangelogEmbed } from '../../components/changelog/ChangelogEmbed';

// Add this before the main component
interface RepositoryContextProps {
  repoName: string;
  technologies?: string[];
  pullRequests?: Array<{
    number: number;
    title: string;
    mergedAt?: string;
  }>;
}

function RepositoryContext({ repoName, technologies, pullRequests }: RepositoryContextProps) {
  if (!technologies?.length && !pullRequests?.length) {
    return null;
  }
  
  return (
    <div className="mb-6 bg-gray-50 p-6 rounded border border-gray-200">
      <h2 className="text-xl font-semibold mb-3">Repository Context</h2>
      
      {technologies && technologies.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-medium mb-2">Technologies</h3>
          <div className="flex flex-wrap gap-2">
            {technologies.map((tech, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
      
      {pullRequests && pullRequests.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-2">Recent Pull Requests</h3>
          <ul className="list-disc list-inside space-y-1 pl-2">
            {pullRequests.slice(0, 5).map((pr) => (
              <li key={pr.number} className="text-gray-700">
                #{pr.number}: {pr.title}
                {pr.mergedAt && (
                  <span className="text-gray-500 text-xs ml-1">
                    (merged on {new Date(pr.mergedAt).toLocaleDateString()})
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default function ChangelogPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const resolvedParams = React.use(params);
  const [changelog, setChangelog] = useState<Changelog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  // Unwrap the params Promise
  const changelogId = resolvedParams.id;

  // Get the changelog ID from params

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/');
    }
  }, [sessionStatus, router]);

  // Fetch changelog data
  useEffect(() => {
    const fetchChangelogData = async () => {
      if (sessionStatus !== 'authenticated' || !changelogId) return;
      
      try {
        setLoading(true);
        console.log('Fetching changelog with ID:', changelogId);
        
        const response = await fetch(`/api/changelog/${changelogId}`, {
          credentials: 'include', // Include cookies for authentication
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch changelog: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Changelog data received:', data);
        setChangelog(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching changelog details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch changelog');
      } finally {
        setLoading(false);
      }
    };

    fetchChangelogData();
  }, [changelogId, sessionStatus]);

  // Refresh the changelog if it's still processing
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (changelog && changelog.status === 'processing') {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/changelog/${resolvedParams.id}`);
          
          if (!response.ok) return;
          
          const data = await response.json();
          setChangelog(data);
          
          // Clear interval if processing is complete
          if (data.status !== 'processing') {
            if (intervalId) clearInterval(intervalId);
          }
        } catch (error) {
          console.error('Error polling changelog status:', error);
          if (intervalId) clearInterval(intervalId);
        }
      }, 5000); // Poll every 5 seconds
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [changelog, resolvedParams.id]);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this changelog? This action cannot be undone.')) {
      return;
    }

    try {
      setIsDeleting(true);
      const response = await fetch(`/api/changelog/${resolvedParams.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete changelog');
      }

      router.push('/changelogs');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete changelog');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setIsRegenerating(true);
      const response = await fetch(`/api/changelog/${resolvedParams.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'regenerate' }),
      });

      if (!response.ok) {
        throw new Error('Failed to regenerate changelog');
      }

      // Refresh the page to show the regenerating status
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to regenerate changelog');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading changelog...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !changelog) {
    return (
      <div className="min-h-screen p-8 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <Link href="/dashboard" className="text-blue-600 flex items-center mb-6">
            <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </Link>
          
          <div className="bg-white p-8 rounded-lg border border-gray-200">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
            <p className="text-gray-700 mb-4">{error || 'Failed to load changelog'}</p>
            <button
              onClick={() => router.refresh()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const dateRange = `${new Date(changelog.from_date).toLocaleDateString()} - ${new Date(changelog.to_date).toLocaleDateString()}`;

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <Link href="/dashboard" className="text-blue-600 flex items-center mb-6">
          <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
            <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </Link>
        
        <div className="bg-white p-8 rounded-lg border border-gray-200 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold mb-2">{changelog.repo_name}</h1>
              <p className="text-gray-600">{dateRange}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating || changelog?.status === 'processing'}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  isRegenerating || changelog?.status === 'processing'
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isRegenerating ? 'Regenerating...' : 'Regenerate'}
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className={`px-4 py-2 rounded text-sm font-medium ${
                  isDeleting
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-semibold">Changelog</h2>
              <button 
                className="text-blue-600 text-sm font-medium"
                onClick={() => {
                  navigator.clipboard.writeText(changelog.processed_changelog || '');
                }}
              >
                Copy to Clipboard
              </button>
            </div>
            
            {changelog.status === 'processing' ? (
              <div className="bg-gray-50 p-6 rounded border border-gray-200 text-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Your changelog is being generated...</p>
                <p className="text-gray-500 text-sm mt-2">This may take a minute or two.</p>
              </div>
            ) : changelog.status === 'failed' ? (
              <div className="bg-red-50 p-6 rounded border border-red-200">
                <p className="text-red-600 mb-4">Failed to generate the changelog.</p>
                <button
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => {
                    // Add logic to retry generation
                  }}
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                {/* Add Repository Context here if it exists */}
                {changelog.repository_context && (
                  <RepositoryContext 
                    repoName={changelog.repo_name}
                    technologies={changelog.repository_context.technologies}
                    pullRequests={changelog.repository_context.pullRequests}
                  />
                )}
                
                <div className="bg-gray-50 p-6 rounded border border-gray-200 prose max-w-none">
                  <ReactMarkdown>{changelog.processed_changelog || 'No content available'}</ReactMarkdown>
                </div>
              </>
            )}
          </div>
          
          <div>
            <h2 className="text-xl font-semibold mb-2">Details</h2>
            <ul className="text-gray-700 space-y-2">
              <li>
                <span className="font-medium">Generated:</span> {new Date(changelog.generated_at).toLocaleString()}
              </li>
              {changelog.processed_at && (
                <li>
                  <span className="font-medium">Processed:</span> {new Date(changelog.processed_at).toLocaleString()}
                </li>
              )}
              <li>
                <span className="font-medium">Commits:</span> {changelog.commit_count}
              </li>
            </ul>
          </div>
          
          {/* Add the ChangelogEmbed component */}
          <ChangelogEmbed 
            changelogId={changelogId} 
            repoName={changelog.repo_name}
            isPublic={changelog.is_public}
          />
        </div>
      </div>
    </div>
  );
} 