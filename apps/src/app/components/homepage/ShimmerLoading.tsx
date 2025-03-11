'use client';

import React from 'react';
import Shimmer, { ShimmerText, ShimmerButton } from '../ui/Shimmer';
import GridBackground from './GridBackground';

export function HomePageShimmer() {
  return (
    <div className="min-h-screen bg-white dark:bg-black relative overflow-hidden">
      {/* Grid background with mask */}
      <GridBackground columns={8} rows={8} maskDirection="left" />

      {/* Main content */}
      <div className="relative z-20 container mx-auto px-4 py-20 md:py-32 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-12 md:mb-0 pr-0 md:pr-12">
          <div className="w-[80%] max-w-[600px] mb-8">
            <Shimmer width="80%" height="60px" className="mb-4" />
            <Shimmer width="60%" height="60px" className="mb-4" />
            <Shimmer width="70%" height="60px" />
          </div>
          <ShimmerText lines={2} width={['80%', '60%']} className="mb-8" />
          <div className="flex flex-col sm:flex-row gap-4">
            <ShimmerButton width={150} height={48} />
            <ShimmerButton width={150} height={48} />
          </div>
        </div>
        
        <div className="md:w-1/2">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800">
            <Shimmer width="60%" height="28px" className="mb-6" />
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="border-b border-gray-100 dark:border-gray-800 pb-4 last:border-0 last:pb-0">
                  <Shimmer width="80%" height="20px" className="mb-2" />
                  <ShimmerText lines={2} width={['95%', '85%']} />
                  <div className="flex justify-between items-center mt-3">
                    <Shimmer width={80} height={16} />
                    <Shimmer width={60} height={16} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 