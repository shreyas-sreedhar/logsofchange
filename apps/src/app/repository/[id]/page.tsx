// This is a Server Component
import { RepositoryClient } from './RepositoryClient';

// Page components in App Router are Server Components by default
// Use async to properly handle params in server component
export default async function RepositoryPage({ params }: { params: { id: string } }) {
  // Server components can directly access params in an async function
  const id = params.id;
  
  // Pass the unwrapped ID to the client component
  return <RepositoryClient id={id} />;
} 