import { useEffect, useRef, useState } from 'react';

type WorkerMessage = {
  type: string;
  data?: any;
  error?: string;
};

export function useChangelogWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [processedChangelogs, setProcessedChangelogs] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize the worker
    workerRef.current = new Worker('/js/changelogWorker.js');

    // Set up message handler
    workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
      const { type, data, error } = event.data;

      if (error) {
        setError(error);
        setIsProcessing(false);
        return;
      }

      switch (type) {
        case 'PROCESSED_CHANGELOGS':
          setProcessedChangelogs(data);
          setIsProcessing(false);
          break;
        case 'FILTERED_CHANGELOGS':
          setProcessedChangelogs(data);
          setIsProcessing(false);
          break;
        case 'SORTED_CHANGELOGS':
          setProcessedChangelogs(data);
          setIsProcessing(false);
          break;
        case 'ERROR':
          setError(data);
          setIsProcessing(false);
          break;
      }
    };

    // Set up error handler
    workerRef.current.onerror = (event) => {
      setError(event.message);
      setIsProcessing(false);
    };

    // Cleanup
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const processChangelogs = (changelogs: any[]) => {
    if (!workerRef.current) return;
    setIsProcessing(true);
    setError(null);
    workerRef.current.postMessage({
      type: 'PROCESS_CHANGELOGS',
      data: changelogs
    });
  };

  const filterChangelogs = (changelogs: any[], filters: Record<string, any>) => {
    if (!workerRef.current) return;
    setIsProcessing(true);
    setError(null);
    workerRef.current.postMessage({
      type: 'FILTER_CHANGELOGS',
      data: { changelogs, filters }
    });
  };

  const sortChangelogs = (changelogs: any[], sortBy: string, sortOrder: 'asc' | 'desc') => {
    if (!workerRef.current) return;
    setIsProcessing(true);
    setError(null);
    workerRef.current.postMessage({
      type: 'SORT_CHANGELOGS',
      data: { changelogs, sortBy, sortOrder }
    });
  };

  return {
    processedChangelogs,
    isProcessing,
    error,
    processChangelogs,
    filterChangelogs,
    sortChangelogs
  };
} 