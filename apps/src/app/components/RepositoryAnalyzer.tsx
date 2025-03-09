'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { RepoContext } from '../lib/repository-analyzer';
import { useRouter } from 'next/navigation';

export default function RepositoryAnalyzer() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<RepoContext | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeRepository = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!repositoryUrl) {
      setError('Please enter a GitHub repository URL');
      return;
    }
    
    setIsAnalyzing(true);
    setError(null);
    
    try {
      // Use URL parameters to pass data instead of request body
      // This is more secure for Next.js 15
      const searchParams = new URLSearchParams();
      searchParams.set('url', encodeURIComponent(repositoryUrl));
      
      // Navigate to a server component that handles the analysis
      router.push(`/analyze?${searchParams.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      setIsAnalyzing(false);
    }
  };

  if (status === 'loading') {
    return <div className="p-4">Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div className="p-4">
        <p>Please sign in with GitHub to analyze repositories.</p>
      </div>
    );
  }

  // Only show the form if we're not redirecting
  if (!isAnalyzing) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Repository Analyzer</h2>
        
        <form onSubmit={analyzeRepository} className="mb-6">
          <div className="flex flex-col md:flex-row gap-2">
            <input
              type="text"
              value={repositoryUrl}
              onChange={(e) => setRepositoryUrl(e.target.value)}
              placeholder="Enter GitHub repository URL (e.g., https://github.com/username/repo)"
              className="flex-grow p-2 border rounded"
            />
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
            >
              Analyze
            </button>
          </div>
        </form>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
      </div>
    );
  }
  
  return <div className="p-4">Redirecting to analysis page...</div>;
} 