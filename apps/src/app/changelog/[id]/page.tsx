'use client';
// this is the main changelog page with id that comes in, so make sure to check if the id is valid and if the user is authenticated
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { Changelog } from '../../hooks/useChangelogs';


export default function ChangelogPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [changelog, setChangelog] = useState<Changelog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/');
    }
  }, [sessionStatus, router]);

  // Fetch changelog data
  useEffect(() => {
    const fetchChangelogData = async () => {
      if (sessionStatus !== 'authenticated' || !params.id) return;
      
      try {
        setLoading(true);
        const response = await fetch(`/api/changelog/${params.id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch changelog: ${response.statusText}`);
        }
        
        const data = await response.json();
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
  }, [params.id, sessionStatus]);

  // Refresh the changelog if it's still processing
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (changelog && changelog.status === 'processing') {
      intervalId = setInterval(async () => {
        try {
          const response = await fetch(`/api/changelog/${params.id}`);
          
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
  }, [changelog, params.id]);

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
            <div className="flex items-center">
              {changelog.status === 'processing' ? (
                <div className="flex items-center">
                  <span className="inline-block w-4 h-4 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mr-2"></span>
                  <span className="text-yellow-500">Processing...</span>
                </div>
              ) : changelog.status === 'completed' ? (
                <div className="text-green-500 flex items-center">
                  <svg className="w-5 h-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                  </svg>
                  Completed
                </div>
              ) : (
                <div className="text-red-500 flex items-center">
                  <svg className="w-5 h-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-1.72 6.97a.75.75 0 10-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 101.06 1.06L12 13.06l1.72 1.72a.75.75 0 101.06-1.06L13.06 12l1.72-1.72a.75.75 0 10-1.06-1.06L12 10.94l-1.72-1.72z" clipRule="evenodd" />
                  </svg>
                  Failed
                </div>
              )}
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
              <div className="bg-gray-50 p-6 rounded border border-gray-200 prose max-w-none">
                <ReactMarkdown>{changelog.processed_changelog || 'No content available'}</ReactMarkdown>
              </div>
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
        </div>
      </div>
    </div>
  );
} 