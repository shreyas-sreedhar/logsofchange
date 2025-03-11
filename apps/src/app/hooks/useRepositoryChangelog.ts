import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Changelog } from './useChangelogs';

export default function useRepositoryChangelog(repoId: number | string) {
  const { data: session, status } = useSession();
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [selectedChangelog, setSelectedChangelog] = useState<Changelog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert repoId to string if it's a number
  const formattedRepoId = typeof repoId === 'number' ? repoId.toString() : repoId;
  
  // Function to fetch changelogs for this specific repository
  const fetchRepoChangelogs = useCallback(async () => {
    if (status !== 'authenticated' || !formattedRepoId) return;
    
    setLoading(true);
    
    try {
      // Fetch changelogs from the API
      const response = await fetch(`/api/changelog/list?repoId=${formattedRepoId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch changelogs');
      }
      
      const data = await response.json();
      
      // Store all changelogs for this repository
      if (data.changelogs && data.changelogs.length > 0) {
        setChangelogs(data.changelogs);
        // Set the most recent changelog as the selected one by default
        setSelectedChangelog(data.changelogs[0]);
      } else {
        setChangelogs([]);
        setSelectedChangelog(null);
      }
      
      setError(null);
    } catch (err) {
      console.error('Error fetching repository changelogs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch changelogs');
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
      setSelectedChangelog(fullChangelog);
      return fullChangelog;
    } catch (err) {
      console.error(`Error fetching full changelog:`, err);
      setError(err instanceof Error ? err.message : 'Failed to fetch full changelog');
      return null;
    }
  }, [status]);

  // Function to select a specific changelog from the list
  const selectChangelog = useCallback((changelogId: string) => {
    const changelog = changelogs.find(cl => cl.id === changelogId);
    if (changelog) {
      setSelectedChangelog(changelog);
    } else {
      // If not found in the current list, fetch it
      fetchFullChangelog(changelogId);
    }
  }, [changelogs, fetchFullChangelog]);

  // Fetch data on initial load or when dependencies change
  useEffect(() => {
    if (status === 'authenticated') {
      fetchRepoChangelogs();
    }
  }, [fetchRepoChangelogs, status]);

  return {
    changelogs,
    selectedChangelog,
    loading,
    error,
    fetchRepoChangelogs,
    fetchFullChangelog,
    selectChangelog
  };
} 