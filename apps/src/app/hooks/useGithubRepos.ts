import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

export interface Repository {
  id: number;
  name: string;
  stars: number;
  updatedAt: string;
}

interface CachedData {
  repos: Repository[];
  timestamp: number;
}

// Cache expiration time in milliseconds (10 minutes)
const CACHE_EXPIRATION = 10 * 60 * 1000;
// API timeout in milliseconds (10 seconds)
const API_TIMEOUT = 10000;

export default function useGithubRepos() {
  const { data: session, status } = useSession();
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMounted = useRef(true);
  const initialFetchDone = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Function to fetch repositories from the API
  const fetchRepositories = useCallback(async (forceRefresh = false) => {
    if (status !== 'authenticated' || !session) return;
    
    // Cancel any in-progress requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create a new AbortController for this request
    abortControllerRef.current = new AbortController();
    
    // Set up a timeout
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }, API_TIMEOUT);
    
    setLoading(true);
    
    try {
      // Always try to use cache first, unless forcing refresh
      if (!forceRefresh && typeof window !== 'undefined') {
        const cachedDataString = localStorage.getItem('github_repos');
        
        if (cachedDataString) {
          try {
            const cachedData: CachedData = JSON.parse(cachedDataString);
            const now = Date.now();
            
            // If cache is still valid (not expired)
            if (now - cachedData.timestamp < CACHE_EXPIRATION) {
              if (isMounted.current) {
                setRepos(cachedData.repos);
                setLoading(false);
                setError(null);
              }
              clearTimeout(timeoutId);
              return;
            }
            
            // If cache exists but is expired, show it immediately while fetching fresh data
            if (cachedData.repos.length > 0) {
              if (isMounted.current) {
                setRepos(cachedData.repos);
                // Keep loading true to indicate we're still fetching fresh data
              }
            }
          } catch (e) {
            // Invalid JSON in localStorage, ignore and fetch fresh data
            console.warn('Invalid cached repository data, fetching fresh data');
          }
        }
      }
      
      // Fetch fresh data from API
      const response = await fetch('/api/user/repos', {
        signal: abortControllerRef.current.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch repositories');
      }
      
      const data = await response.json();
      
      // Cache the fresh data with current timestamp
      if (typeof window !== 'undefined') {
        const cacheData: CachedData = {
          repos: data,
          timestamp: Date.now()
        };
        
        localStorage.setItem('github_repos', JSON.stringify(cacheData));
      }
      
      if (isMounted.current) {
        setRepos(data);
        setError(null);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      
      // Don't show error if it was just an abort
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.log('Request was aborted');
        
        // Try to load from cache as fallback
        if (typeof window !== 'undefined') {
          const cachedDataString = localStorage.getItem('github_repos');
          if (cachedDataString) {
            try {
              const cachedData: CachedData = JSON.parse(cachedDataString);
              if (isMounted.current && cachedData.repos.length > 0) {
                setRepos(cachedData.repos);
                setError('GitHub API request timed out. Showing cached data.');
              }
            } catch (e) {
              // Invalid JSON, nothing to recover
            }
          }
        }
      } else {
        console.error('Error fetching repositories:', err);
        
        if (isMounted.current) {
          setError(err instanceof Error ? err.message : 'Failed to fetch repositories');
        }
        
        // Try to load from cache even if expired as fallback when API fails
        if (typeof window !== 'undefined') {
          const cachedDataString = localStorage.getItem('github_repos');
          if (cachedDataString) {
            try {
              const cachedData: CachedData = JSON.parse(cachedDataString);
              if (isMounted.current && cachedData.repos.length > 0) {
                setRepos(cachedData.repos);
                // Keep the error message to allow for refresh
              }
            } catch (e) {
              // Invalid JSON, nothing to recover
            }
          }
        }
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [session, status]);

  // Refresh data on initial load or when session changes
  useEffect(() => {
    // Only fetch if we haven't already done the initial fetch
    if (status === 'authenticated' && !initialFetchDone.current) {
      initialFetchDone.current = true;
      
      // Try to show cached data immediately before fetching
      if (typeof window !== 'undefined') {
        const cachedDataString = localStorage.getItem('github_repos');
        if (cachedDataString) {
          try {
            const cachedData: CachedData = JSON.parse(cachedDataString);
            if (cachedData.repos.length > 0) {
              setRepos(cachedData.repos);
            }
          } catch (e) {
            // Invalid JSON, ignore
          }
        }
      }
      
      // Then fetch fresh data
      fetchRepositories();
    }
    
    return () => {
      isMounted.current = false;
      // Cancel any in-progress requests on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchRepositories, status]);

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