import React from 'react';
import { StarIcon } from '../Icons';

interface RepoCardProps {
  name: string;
  stars: number;
  updatedAt: string;
  onGenerateClick: () => void;
}

export default function RepoCard({ name, stars, updatedAt, onGenerateClick }: RepoCardProps) {
  // Format the time difference
  const getTimeAgo = (dateString: string) => {
    const updated = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Updated today';
    if (diffDays === 1) return 'Updated yesterday';
    if (diffDays < 7) return `Updated ${diffDays} days ago`;
    return `Updated ${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
      <div>
        <h3 className="text-base font-medium mb-1">{name}</h3>
        <div className="flex items-center text-sm text-gray-500">
          <span className="flex items-center">
            <StarIcon className="w-4 h-4 mr-1 text-yellow-400" /> {stars}
          </span>
          <span className="mx-2">•</span>
          <span>{getTimeAgo(updatedAt)}</span>
        </div>
      </div>
      <button 
        onClick={onGenerateClick}
        className="text-blue-500 font-medium flex items-center"
      >
        Generate <span className="ml-1">→</span>
      </button>
    </div>
  );
} 