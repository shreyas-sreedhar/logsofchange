import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Changelog } from './useChangelogs';

export default function useRepositoryChangelog(repoId: number | string) {
  const { data: session, status } = useSession();
  const [changelog, setChangelog] = useState<Changelog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert repoId to string if it's a number
  const formattedRepoId = typeof repoId === 'number' ? repoId.toString() : repoId;
  
  // Function to fetch changelog for this specific repository
  const fetchRepoChangelog = useCallback(async () => {
    if (status !== 'authenticated' || !formattedRepoId) return;
    
    setLoading(true);
    
    try {
      // Fetch changelogs from the API
      const response = await fetch(`/api/changelog/list?repoId=${formattedRepoId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch changelog');
      }
      
      const data = await response.json();
      
      // Get the most recent changelog for this repository
      if (data.changelogs && data.changelogs.length > 0) {
        setChangelog(data.changelogs[0]);
      } else {
        setChangelog(null);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching repository changelog:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch changelog');
    } finally {
      setLoading(false);
    }
  }, [session, status, formattedRepoId]);

  // Function to get the full changelog data by ID
  const fetchFullChangelog = useCallback(async (changelogId: string) => {
    if (status !== 'authenticated') return null;
    
    try {
      const response = await fetch(`/api/changelog/${changelogId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch full changelog');
      }
      
      const fullChangelog = await response.json();
      setChangelog(fullChangelog);
      return fullChangelog;
    } catch (err) {
      console.error(`Error fetching full changelog:`, err);
      setError(err instanceof Error ? err.message : 'Failed to fetch full changelog');
      return null;
    }
  }, [status]);

  // Fetch data on initial load or when dependencies change
  useEffect(() => {
    if (status === 'authenticated') {
      fetchRepoChangelog();
    }
  }, [fetchRepoChangelog, status]);

  return {
    changelog,
    loading,
    error,
    fetchRepoChangelog,
    fetchFullChangelog,
  };
} 