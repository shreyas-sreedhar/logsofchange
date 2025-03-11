'use client';

import React from 'react';
import Shimmer, { ShimmerCard, ShimmerText } from '../ui/Shimmer';

export function ShimmerRepoCard() {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <Shimmer width="70%" height="24px" className="mb-2" />
          <ShimmerText lines={1} width="40%" />
        </div>
        <Shimmer width={100} height={36} borderRadius="0.375rem" />
      </div>
      <div className="flex items-center text-sm text-gray-500 mt-4">
        <Shimmer width={16} height={16} borderRadius="50%" className="mr-2" />
        <Shimmer width={60} height={16} />
      </div>
    </div>
  );
}

export function ShimmerChangelogCard() {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <Shimmer width="80%" height="24px" className="mb-2" />
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Shimmer width={100} height={16} className="mr-4" />
            <Shimmer width={80} height={16} />
          </div>
        </div>
        <Shimmer width={24} height={24} borderRadius="50%" />
      </div>
      <ShimmerText lines={2} width={['95%', '85%']} className="mt-3" />
      <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
        <Shimmer width={80} height={16} />
        <Shimmer width={100} height={16} />
      </div>
    </div>
  );
}

export function ShimmerStatsCard() {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center mb-2">
        <Shimmer width={40} height={40} borderRadius="50%" className="mr-3" />
        <Shimmer width="60%" height={20} />
      </div>
      <Shimmer width="40%" height={36} className="mt-3" />
      <ShimmerText lines={1} width="70%" className="mt-2" />
    </div>
  );
}

export function DashboardShimmer() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-medium text-black">Dashboard</h1>
          <div className="flex items-center gap-4">
            <Shimmer width={120} height={20} />
            <Shimmer width={60} height={20} />
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {Array.from({ length: 3 }).map((_, i) => (
            <ShimmerStatsCard key={i} />
          ))}
        </div>
        
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Recent Repositories</h2>
            <Shimmer width={100} height={36} borderRadius="0.375rem" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ShimmerRepoCard key={i} />
            ))}
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium">Recent Changelogs</h2>
            <Shimmer width={100} height={36} borderRadius="0.375rem" />
          </div>
          <div className="grid grid-cols-1 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <ShimmerChangelogCard key={i} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
} 