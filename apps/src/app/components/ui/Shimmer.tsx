'use client';

import React from 'react';

interface ShimmerProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
}

export default function Shimmer({ 
  className = '', 
  width = '100%', 
  height = '20px', 
  borderRadius = '0.25rem' 
}: ShimmerProps) {
  return (
    <div 
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 ${className}`}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        borderRadius 
      }}
    />
  );
}

export function ShimmerText({ lines = 1, width = '100%', className = '' }: { lines?: number; width?: string | number | string[]; className?: string }) {
  const widths = Array.isArray(width) ? width : Array(lines).fill(width);
  
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Shimmer 
          key={i} 
          width={widths[i] || '100%'} 
          height="16px" 
        />
      ))}
    </div>
  );
}

export function ShimmerCard({ className = '' }: { className?: string }) {
  return (
    <div className={`border border-gray-200 rounded-lg p-4 ${className}`}>
      <Shimmer height="24px" width="60%" className="mb-4" />
      <ShimmerText lines={3} width={['100%', '90%', '80%']} />
    </div>
  );
}

export function ShimmerAvatar({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <Shimmer 
      width={size} 
      height={size} 
      borderRadius="50%" 
      className={className} 
    />
  );
}

export function ShimmerButton({ width = 100, height = 40, className = '' }: { width?: number; height?: number; className?: string }) {
  return (
    <Shimmer 
      width={width} 
      height={height} 
      borderRadius="0.375rem" 
      className={className} 
    />
  );
} 