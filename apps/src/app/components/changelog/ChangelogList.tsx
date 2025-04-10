'use client';

import { useEffect, useState } from 'react';
import { useChangelogWorker } from '../../hooks/useChangelogWorker';

export default function ChangelogList() {
  const [changelogs, setChangelogs] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(5);
  const [filters, setFilters] = useState<Record<string, any>>({});
  const [sortConfig, setSortConfig] = useState<{ sortBy: string; sortOrder: 'asc' | 'desc' }>({
    sortBy: 'created_at',
    sortOrder: 'desc'
  });

  const {
    processedChangelogs,
    isProcessing,
    error: workerError,
    processChangelogs,
    filterChangelogs,
    sortChangelogs
  } = useChangelogWorker();

  useEffect(() => {
    fetchChangelogs();
  }, [page, limit]);

  useEffect(() => {
    if (changelogs.length > 0) {
      processChangelogs(changelogs);
    }
  }, [changelogs]);

  useEffect(() => {
    if (processedChangelogs.length > 0) {
      filterChangelogs(processedChangelogs, filters);
    }
  }, [filters]);

  useEffect(() => {
    if (processedChangelogs.length > 0) {
      sortChangelogs(processedChangelogs, sortConfig.sortBy, sortConfig.sortOrder);
    }
  }, [sortConfig]);

  const fetchChangelogs = async () => {
    try {
      const response = await fetch(`/api/changelog/list?page=${page}&limit=${limit}`);
      if (!response.ok) {
        throw new Error('Failed to fetch changelogs');
      }
      const data = await response.json();
      setChangelogs(data);
    } catch (error) {
      console.error('Error fetching changelogs:', error);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleSort = (sortBy: string) => {
    setSortConfig(prev => ({
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  if (workerError) {
    return <div className="text-red-500">Error: {workerError}</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-4">
        <select
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="p-2 border rounded"
        >
          <option value="">All Statuses</option>
          <option value="processing">Processing</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>

        <button
          onClick={() => handleSort('created_at')}
          className="p-2 border rounded"
        >
          Sort by Date {sortConfig.sortBy === 'created_at' && (sortConfig.sortOrder === 'asc' ? '↑' : '↓')}
        </button>
      </div>

      {isProcessing ? (
        <div className="text-gray-500">Processing changelogs...</div>
      ) : (
        <div className="space-y-4">
          {processedChangelogs.map((changelog) => (
            <div key={changelog.id} className="p-4 border rounded">
              <h3 className="font-semibold">{changelog.title}</h3>
              <p className="text-gray-600">{changelog.description}</p>
              <div className="mt-2 text-sm text-gray-500">
                <span>Status: {changelog.status}</span>
                <span className="ml-4">Date: {changelog.formattedDate}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between mt-4">
        <button
          onClick={() => setPage(prev => Math.max(1, prev - 1))}
          disabled={page === 1}
          className="p-2 border rounded disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => setPage(prev => prev + 1)}
          disabled={processedChangelogs.length < limit}
          className="p-2 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
} 