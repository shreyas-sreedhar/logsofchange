// This is a Server Component
import { RepositoryClient } from './RepositoryClient';
import { use } from 'react';

// Page components in App Router are Server Components by default
export default function RepositoryPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap the params Promise
  const resolvedParams = use(params);
  // Pass the ID to the client component
  return <RepositoryClient id={resolvedParams.id} />;
} 