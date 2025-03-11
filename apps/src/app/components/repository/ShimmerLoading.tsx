'use client';

import React from 'react';
import Shimmer, { ShimmerText } from '../ui/Shimmer';

export function RepositoryShimmer() {
  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center mb-4">
            <Shimmer width={24} height={24} className="mr-1" />
            <Shimmer width={120} height={20} />
          </div>
          
          <Shimmer width={300} height={32} className="mb-4" />
        </div>

        {/* Date range selection */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <h2 className="text-lg font-medium mb-4">Select Date Range</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Shimmer width="100%" height={40} className="mb-2" />
              <ShimmerText lines={1} width="60%" />
            </div>
            <div>
              <Shimmer width="100%" height={40} className="mb-2" />
              <ShimmerText lines={1} width="60%" />
            </div>
          </div>
          <Shimmer width={120} height={40} borderRadius="0.375rem" />
        </div>

        {/* Commits section */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Commits</h2>
            <Shimmer width={100} height={20} />
          </div>
          
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <Shimmer width="80%" height={20} className="mb-2" />
                    <ShimmerText lines={1} width="40%" />
                  </div>
                  <Shimmer width={80} height={16} />
                </div>
                <div className="flex items-center mt-2">
                  <Shimmer width={24} height={24} borderRadius="50%" className="mr-2" />
                  <Shimmer width={120} height={16} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generate changelog button */}
        <div className="flex justify-center">
          <Shimmer width={200} height={48} borderRadius="0.375rem" />
        </div>
      </div>
    </div>
  );
} 