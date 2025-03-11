import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Changelog } from '../../hooks/useChangelogs';

interface ChangelogCardProps {
  changelog: Changelog;
}

export default function ChangelogCard({ changelog }: ChangelogCardProps) {
  // Format the date range
  const dateRange = `${new Date(changelog.from_date).toLocaleDateString()} - ${new Date(changelog.to_date).toLocaleDateString()}`;
  
  // Get relative time since generation
  const timeAgo = formatDistanceToNow(new Date(changelog.generated_at), { addSuffix: true });
  
  // Determine status indicator color
  const statusColor = {
    processing: 'bg-yellow-500',
    completed: 'bg-green-500',
    failed: 'bg-red-500'
  }[changelog.status];

  const statusText = {
    processing: 'Processing',
    completed: 'Completed',
    failed: 'Failed'
  }[changelog.status];

  return (
    <div className="border border-gray-200 p-5 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-medium text-lg text-black">{changelog.repo_name}</h3>
          <p className="text-gray-600 text-sm">{dateRange}</p>
        </div>
        <div className="flex items-center">
          <span className={`${statusColor} h-2.5 w-2.5 rounded-full mr-2`}></span>
          <span className="text-gray-600 text-sm">{statusText}</span>
        </div>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <div className="text-gray-600 text-sm">
          <span>{changelog.commit_count} commit{changelog.commit_count !== 1 ? 's' : ''}</span>
          <span className="mx-2">•</span>
          <span>Generated {timeAgo}</span>
        </div>
        
        <Link 
          href={`/changelog/${changelog.id}`}
          className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-none font-normal"
        >
          View
        </Link>
      </div>
    </div>
  );
} 