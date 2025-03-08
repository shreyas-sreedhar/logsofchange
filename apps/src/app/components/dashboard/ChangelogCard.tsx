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

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg text-blue-600">{changelog.repo_name}</h3>
          <p className="text-gray-600 text-sm">{dateRange}</p>
        </div>
        <div className="flex items-center">
          <span className={`${statusColor} h-2.5 w-2.5 rounded-full mr-2`}></span>
          <span className="text-gray-600 text-sm capitalize">{changelog.status}</span>
        </div>
      </div>
      
      <div className="mt-3 flex justify-between items-center">
        <div className="text-gray-500 text-sm">
          <span>{changelog.commit_count} commit{changelog.commit_count !== 1 ? 's' : ''}</span>
          <span className="mx-2">•</span>
          <span>Generated {timeAgo}</span>
        </div>
        
        <Link 
          href={`/changelog/${changelog.id}`}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          View Changelog
        </Link>
      </div>
    </div>
  );
} 