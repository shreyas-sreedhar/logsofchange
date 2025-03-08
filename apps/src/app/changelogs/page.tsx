'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import ChangelogCard from '../components/dashboard/ChangelogCard';
import useChangelogs from '../hooks/useChangelogs';

export default function ChangelogsPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [currentPage, setCurrentPage] = useState(1);
  const { changelogs, pagination, loading, error, fetchChangelogs } = useChangelogs(currentPage, 10);

  // Redirect to login if not authenticated
  if (sessionStatus === 'unauthenticated') {
    router.push('/');
    return null;
  }

  // Loading state
  if (sessionStatus === 'loading') {
    return (
      <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Generate pagination buttons
  const renderPagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const pages = [];
    const maxVisiblePages = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Previous button
    pages.push(
      <button
        key="prev"
        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
      >
        &laquo;
      </button>
    );
    
    // First page
    if (startPage > 1) {
      pages.push(
        <button
          key="1"
          onClick={() => setCurrentPage(1)}
          className="px-3 py-1 rounded border border-gray-300"
        >
          1
        </button>
      );
      
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className="px-2">...</span>);
      }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3 py-1 rounded border ${
            i === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : 'border-gray-300'
          }`}
        >
          {i}
        </button>
      );
    }
    
    // Last page
    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) {
        pages.push(<span key="ellipsis2" className="px-2">...</span>);
      }
      
      pages.push(
        <button
          key={pagination.totalPages}
          onClick={() => setCurrentPage(pagination.totalPages)}
          className="px-3 py-1 rounded border border-gray-300"
        >
          {pagination.totalPages}
        </button>
      );
    }
    
    // Next button
    pages.push(
      <button
        key="next"
        onClick={() => setCurrentPage(prev => Math.min(pagination.totalPages, prev + 1))}
        disabled={currentPage === pagination.totalPages}
        className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
      >
        &raquo;
      </button>
    );
    
    return (
      <div className="flex justify-center items-center space-x-2 mt-8">
        {pages}
      </div>
    );
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Changelogs</h1>
            <p className="text-gray-600">View and manage all your generated changelogs.</p>
          </div>
          <Link 
            href="/dashboard" 
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Changelogs List */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
          {loading ? (
            <div className="py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading your changelogs...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <div className="text-red-500 mb-2">Error: {error}</div>
              <button 
                onClick={() => fetchChangelogs()}
                className="text-blue-600 text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          ) : changelogs.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-gray-500 mb-4">You haven't generated any changelogs yet.</p>
              <Link 
                href="/dashboard" 
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Go to Dashboard
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {changelogs.map(changelog => (
                <ChangelogCard key={changelog.id} changelog={changelog} />
              ))}
              
              {renderPagination()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 