import React, { useState } from 'react';
import { ChangelogContext } from '../lib/repository-analyzer';
import { useSession } from 'next-auth/react';

interface RepositoryAnalysisProps {
  repoId: string;
  repoName: string;
  fromDate?: string;
  toDate?: string;
  onAnalysisComplete?: (analysis: ChangelogContext) => void;
  hideAnalyzeButton?: boolean;
}

export default function RepositoryAnalysis({
  repoId,
  repoName,
  fromDate,
  toDate,
  onAnalysisComplete,
  hideAnalyzeButton = true
}: RepositoryAnalysisProps) {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ChangelogContext | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fetchAnalysis = async () => {
    // Don't proceed if not authenticated
    if (status !== 'authenticated' || !session) {
      setError('You must be logged in to analyze repositories');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (fromDate) params.append('from', fromDate);
      if (toDate) params.append('to', toDate);
      
      // Make API request
      const response = await fetch(`/api/repos/${repoId}/analysis?${params.toString()}`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.status === 401) {
        setError('Authentication error. Please log in again.');
        return;
      }
      
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage;
        
        try {
          // Try to parse as JSON
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || `Failed to analyze repository: ${response.statusText}`;
        } catch (e) {
          // If not JSON, use the text directly
          errorMessage = errorText || `Failed to analyze repository: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      setAnalysis(data.analysis);
      
      // Call callback if provided
      if (onAnalysisComplete) {
        onAnalysisComplete(data.analysis);
      }
    } catch (err) {
      console.error('Error analyzing repository:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze repository');
    } finally {
      setLoading(false);
    }
  };
  
  if (!analysis && hideAnalyzeButton) {
    return null;
  }
  
  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Repository Analysis</h3>
        {!loading && !analysis && !hideAnalyzeButton && (
          <button
            onClick={fetchAnalysis}
            disabled={status !== 'authenticated'}
            className={`px-3 py-1 text-white text-sm rounded ${
              status === 'authenticated' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-gray-400 cursor-not-allowed'
            }`}
          >
            {status === 'authenticated' ? 'Analyze Repository' : 'Login Required'}
          </button>
        )}
      </div>
      
      {status === 'loading' && (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading session...</span>
        </div>
      )}
      
      {loading && (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Analyzing repository...</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-3 text-red-600 mb-4">
          {error}
        </div>
      )}
      
      {analysis && (
        <div className="text-sm">
          <div className="mb-4">
            <h4 className="font-medium mb-2">Repository Info</h4>
            <p className="text-gray-700">
              <span className="font-medium">Name:</span> {analysis.repositoryName}
            </p>
            {analysis.repositoryDescription && (
              <p className="text-gray-700">
                <span className="font-medium">Description:</span> {analysis.repositoryDescription}
              </p>
            )}
            <p className="text-gray-700">
              <span className="font-medium">Default Branch:</span> {analysis.defaultBranch}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Technologies:</span> {analysis.technologies.join(', ')}
            </p>
          </div>
          
          <div className="mb-4">
            <h4 className="font-medium mb-2">Recent Pull Requests</h4>
            {analysis.pullRequests.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {analysis.pullRequests.slice(0, 5).map((pr) => (
                  <li key={pr.number}>
                    #{pr.number}: {pr.title} 
                    <span className="text-gray-500 text-xs ml-1">
                      ({pr.mergedAt ? new Date(pr.mergedAt).toLocaleDateString() : 'not merged'})
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No pull requests found in this period</p>
            )}
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Recent {analysis.defaultBranch} Branch Commits</h4>
            {analysis.mainBranchCommits.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                {analysis.mainBranchCommits.slice(0, 5).map((commit) => (
                  <li key={commit.sha}>
                    {commit.message.split('\n')[0].substring(0, 80)}
                    {commit.message.split('\n')[0].length > 80 ? '...' : ''}
                    <span className="text-gray-500 text-xs ml-1">
                      ({new Date(commit.date).toLocaleDateString()})
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">No commits found in this period</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
} 