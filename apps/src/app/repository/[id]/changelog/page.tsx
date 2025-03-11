'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ChangelogTimeline from '../../../components/changelog/ChangelogTimeline';
import useRepositoryChangelog from '../../../hooks/useRepositoryChangelog';
import Modal from '../../../components/Modal';

// Add new component for API access
const ChangelogApiAccess = ({ changelogId }: { changelogId: string }) => {
  const [showApiInfo, setShowApiInfo] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const apiEndpoint = `/api/changelog/${changelogId}`;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(`${window.location.origin}${apiEndpoint}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="mb-6 bg-white dark:bg-gray-950 p-5 border border-gray-200 dark:border-gray-800 shadow-md rounded-lg">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">API Access</h3>
        <button
          onClick={() => setShowApiInfo(!showApiInfo)}
          className="text-blue-600 dark:text-blue-400 flex items-center text-sm font-medium"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-4 w-4 mr-1" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d={showApiInfo ? "M19 9l-7 7-7-7" : "M9 5l7 7-7 7"} 
            />
          </svg>
          {showApiInfo ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      
      {!showApiInfo && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Access this changelog programmatically via our API. Click "Show Details" for more information.
        </p>
      )}
      
      {showApiInfo && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">API Endpoint</h4>
          <div className="flex items-center">
            <code className="text-xs bg-gray-100 dark:bg-gray-900 p-2 rounded flex-1 overflow-x-auto">
              {window.location.origin}{apiEndpoint}
            </code>
            <button
              onClick={handleCopy}
              className="ml-2 p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
              title="Copy to clipboard"
            >
              {copied ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                  <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                </svg>
              )}
            </button>
          </div>
          <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
            <div className="mb-3">
              <h5 className="font-medium mb-1">Authentication</h5>
              <p>This API requires authentication. You can use your session cookie or an API token.</p>
            </div>
            
            <div className="mb-3">
              <h5 className="font-medium mb-1">Example with Session (Browser)</h5>
              <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-x-auto">
{`fetch("${window.location.origin}${apiEndpoint}", {
  method: "GET",
  credentials: "include"
})
.then(response => response.json())
.then(data => console.log(data));`}
              </pre>
            </div>
            
            <div className="mb-3">
              <h5 className="font-medium mb-1">Example with API Token (Server)</h5>
              <pre className="mt-1 p-2 bg-gray-100 dark:bg-gray-900 rounded overflow-x-auto">
{`curl -H "Authorization: Bearer YOUR_API_TOKEN" ${window.location.origin}${apiEndpoint}`}
              </pre>
            </div>
            
            <div>
              <h5 className="font-medium mb-1">Response Format</h5>
              <p>JSON containing the full changelog data including:</p>
              <ul className="list-disc list-inside mt-1 ml-2">
                <li>id: Unique identifier</li>
                <li>repo_name: Repository name</li>
                <li>processed_changelog: Formatted changelog content</li>
                <li>raw_data: Raw commit data</li>
                <li>generated_at: Timestamp</li>
                <li>status: Processing status</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function RepositoryChangelogPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise
  const resolvedParams = React.use(params);
  
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [repoName, setRepoName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  const { 
    changelogs,
    selectedChangelog,
    loading: changelogLoading, 
    error: changelogError,
    fetchRepoChangelogs,
    selectChangelog
  } = useRepositoryChangelog(resolvedParams.id);
  
  // Redirect to login if not authenticated
  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/');
    }
  }, [sessionStatus, router]);
  
  // Fetch repository details
  useEffect(() => {
    const fetchRepoDetails = async () => {
      if (sessionStatus !== 'authenticated' || !resolvedParams.id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/user/repos/${resolvedParams.id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch repository details: ${response.statusText}`);
        }
        
        const data = await response.json();
        setRepoName(data.name);
        setError(null);
      } catch (err) {
        console.error('Error fetching repository details:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch repository');
      } finally {
        setLoading(false);
      }
    };
    
    fetchRepoDetails();
  }, [resolvedParams.id, sessionStatus]);
  
  const handleDelete = async () => {
    if (!selectedChangelog) return;
    
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/changelog/${selectedChangelog.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete changelog');
      }

      // Refresh the changelogs list
      fetchRepoChangelogs();
      setShowDeleteModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete changelog');
    } finally {
      setIsDeleting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Loading state
  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <Link href="/dashboard" className="text-blue-600 dark:text-blue-400 flex items-center mb-6">
            <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
            </svg>
            Back to Dashboard
          </Link>
          
          <div className="bg-white dark:bg-gray-950 p-8 rounded-lg border border-gray-200 dark:border-gray-800 shadow-md">
            <h1 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">Error</h1>
            <p className="text-gray-700 dark:text-gray-300 mb-4">{error}</p>
            <button
              onClick={() => router.refresh()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 dark:hover:bg-blue-500"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-900">
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        title="Delete Changelog"
        message="Are you sure you want to delete this changelog? This action cannot be undone."
        confirmText={isDeleting ? "Deleting..." : "Delete"}
        isDestructive={true}
      />
      
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href={`/repository/${resolvedParams.id}`} className="text-blue-600 dark:text-blue-400 flex items-center mb-2">
            <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
            </svg>
            Back to Repository
          </Link>
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{repoName} Changelogs</h1>
          </div>
        </div>
        
        {changelogLoading ? (
          <div className="text-center py-8 bg-white dark:bg-gray-950 p-6 shadow rounded-lg border border-gray-200 dark:border-gray-800">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black dark:border-white mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading changelogs...</p>
          </div>
        ) : changelogError ? (
          <div className="text-center py-8 bg-white dark:bg-gray-950 p-6 shadow rounded-lg border border-gray-200 dark:border-gray-800">
            <p className="text-red-600 dark:text-red-400 mb-4">{changelogError}</p>
            <button
              onClick={() => router.refresh()}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
            >
              Try Again
            </button>
          </div>
        ) : changelogs.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {/* Changelog List */}
            <div className="bg-white dark:bg-gray-950 p-5 border border-gray-200 dark:border-gray-800 shadow-md rounded-lg">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Available Changelogs</h2>
              <div className="overflow-hidden border border-gray-200 dark:border-gray-800 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date Range
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Generated
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Commits
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-800">
                    {changelogs.map((changelog) => (
                      <tr 
                        key={changelog.id} 
                        className={`hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer ${
                          selectedChangelog?.id === changelog.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                        }`}
                        onClick={() => selectChangelog(changelog.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {new Date(changelog.from_date).toLocaleDateString()} - {new Date(changelog.to_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(changelog.generated_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {changelog.commit_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              selectChangelog(changelog.id);
                              setShowDeleteModal(true);
                            }}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Selected Changelog */}
            {selectedChangelog && (
              <div>
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Changelog Details</h2>
                    <div className="text-gray-600 dark:text-gray-400 text-sm">
                      <span>Generated on {new Date(selectedChangelog.generated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <ChangelogApiAccess changelogId={selectedChangelog.id} />
                </div>
                <ChangelogTimeline changelog={selectedChangelog} />
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 bg-white dark:bg-gray-950 p-6 shadow rounded-lg border border-gray-200 dark:border-gray-800">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No changelogs have been generated for this repository yet.</p>
            <Link 
              href={`/repository/${resolvedParams.id}`}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 dark:hover:bg-blue-500"
            >
              Go to Repository Page to Generate
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 