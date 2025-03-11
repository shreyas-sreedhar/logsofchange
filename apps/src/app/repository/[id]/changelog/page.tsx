'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ChangelogTimeline from '../../../components/changelog/ChangelogTimeline';
import useRepositoryChangelog from '../../../hooks/useRepositoryChangelog';

export default function RepositoryChangelogPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [repoName, setRepoName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    changelog, 
    loading: changelogLoading, 
    error: changelogError
  } = useRepositoryChangelog(params.id);
  
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
  }, [params.id, sessionStatus]);
  
  // Loading state
  if (sessionStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
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
            <p className="text-gray-700 mb-4">{error}</p>
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
  
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <Link href={`/repository/${params.id}`} className="text-blue-600 flex items-center mb-2">
              <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M7.72 12.53a.75.75 0 010-1.06l7.5-7.5a.75.75 0 111.06 1.06L9.31 12l6.97 6.97a.75.75 0 11-1.06 1.06l-7.5-7.5z" clipRule="evenodd" />
              </svg>
              Back to Repository
            </Link>
            <h1 className="text-2xl font-bold">{repoName} Changelog</h1>
          </div>
        </div>
        
        {changelogLoading ? (
          <div className="text-center py-8 bg-white p-6 shadow rounded-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
            <p className="text-gray-600">Loading changelog...</p>
          </div>
        ) : changelogError ? (
          <div className="text-center py-8 bg-white p-6 shadow rounded-lg">
            <p className="text-red-600 mb-4">{changelogError}</p>
            <button
              onClick={() => router.refresh()}
              className="text-blue-600 hover:text-blue-800"
            >
              Try Again
            </button>
          </div>
        ) : changelog ? (
          <ChangelogTimeline changelog={changelog} />
        ) : (
          <div className="text-center py-8 bg-white p-6 shadow rounded-lg">
            <p className="text-gray-600 mb-4">No changelog has been generated for this repository yet.</p>
            <Link 
              href={`/repository/${params.id}`}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go to Repository Page to Generate
            </Link>
          </div>
        )}
      </div>
    </div>
  );
} 