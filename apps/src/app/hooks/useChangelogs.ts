import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { ChangelogContext } from '../lib/repository-analyzer';

export interface Changelog {
  id: string;
  repo_id: number;
  repo_name: string;
  from_date: string;
  to_date: string;
  commit_count: number;
  generated_at: string;
  processed_at: string | null;
  status: 'processing' | 'completed' | 'failed';
  processed_changelog: string | null;
  repository_context?: ChangelogContext;
}

export interface ChangelogPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export default function useChangelogs(page = 1, limit = 10) {
  const { data: session, status } = useSession();
  const [changelogs, setChangelogs] = useState<Changelog[]>([]);
  const [pagination, setPagination] = useState<ChangelogPagination>({
    total: 0,
    page,
    limit,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch changelogs from the API
  const fetchChangelogs = useCallback(async () => {
    if (status !== 'authenticated') return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`/api/changelog/list?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch changelogs');
      }
      
      const data = await response.json();
      
      setChangelogs(data.changelogs);
      setPagination(data.pagination);
      setError(null);
    } catch (err) {
      console.error('Error fetching changelogs:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch changelogs');
    } finally {
      setLoading(false);
    }
  }, [session, status, page, limit]);

  // Fetch a specific changelog by ID
  const fetchChangelogById = useCallback(async (id: string) => {
    if (status !== 'authenticated') return null;
    
    try {
      const response = await fetch(`/api/changelog/${id}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch changelog');
      }
      
      return await response.json();
    } catch (err) {
      console.error(`Error fetching changelog ${id}:`, err);
      throw err;
    }
  }, [status]);

  // Fetch data on initial load or when dependencies change
  useEffect(() => {
    if (status === 'authenticated') {
      fetchChangelogs();
    }
  }, [fetchChangelogs, status, page, limit]);

  return {
    changelogs,
    pagination,
    loading,
    error,
    fetchChangelogs,
    fetchChangelogById,
  };
} 