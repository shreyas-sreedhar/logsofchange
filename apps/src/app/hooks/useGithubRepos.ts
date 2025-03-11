import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

export interface Repository {
  id: number;
  name: string;
  fullName: string;
  url: string;
  stars: number;
  updatedAt: string;
}

interface CachedData {
  repos: Repository[];
  timestamp: number;
}

// Cache expiration time in milliseconds (5 minutes)
const CACHE_EXPIRATION = 5 * 60 * 1000;

export default function useGithubRepos() {
  const { data: session, status } = useSession();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch repositories from the API
  const fetchRepositories = useCallback(async (forceRefresh = false) => {
    if (status !== 'authenticated' || !session) return;
    
    setLoading(true);
    
    try {
      // Check for cached data if not forcing a refresh
      if (!forceRefresh) {
        const cachedDataString = localStorage.getItem('github_repos');
        
        if (cachedDataString) {
          try {
            const cachedData: CachedData = JSON.parse(cachedDataString);
            const now = Date.now();
            
            // If cache is still valid (not expired)
            if (now - cachedData.timestamp < CACHE_EXPIRATION) {
              setRepos(cachedData.repos);
              setLoading(false);
              setError(null);
              return;
            }
          } catch (e) {
            // Invalid JSON in localStorage, ignore and fetch fresh data
            console.warn('Invalid cached repository data, fetching fresh data');
          }
        }
      }
      
      // Fetch fresh data from API
      const response = await fetch('/api/user/repos');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch repositories');
      }
      
      const data = await response.json();
      
      // Cache the fresh data with current timestamp
      const cacheData: CachedData = {
        repos: data,
        timestamp: Date.now()
      };
      
      localStorage.setItem('github_repos', JSON.stringify(cacheData));
      
      setRepos(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching repositories:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch repositories');
      
      // Try to load from cache even if expired as fallback when API fails
      const cachedDataString = localStorage.getItem('github_repos');
      if (cachedDataString) {
        try {
          const cachedData: CachedData = JSON.parse(cachedDataString);
          setRepos(cachedData.repos);
          // Keep the error message to allow for refresh
        } catch (e) {
          // Invalid JSON, nothing to recover
        }
      }
    } finally {
      setLoading(false);
    }
  }, [session, status]);

  // Refresh data on initial load or when session changes
  useEffect(() => {
    fetchRepositories();
  }, [fetchRepositories]);

  // Filter repositories updated in the past week
  const recentRepos = repos.filter(repo => {
    const lastUpdated = new Date(repo.updatedAt);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    return lastUpdated >= oneWeekAgo;
  });

  return {
    repos,
    recentRepos,
    loading,
    error,
    refreshRepos: () => fetchRepositories(true) // Force refresh function
  };
} 