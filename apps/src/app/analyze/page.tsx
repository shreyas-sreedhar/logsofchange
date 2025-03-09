import { redirect } from 'next/navigation';
import { getRepositoryContext } from '../lib/repository-analyzer';
import { getServerSession } from 'next-auth';

interface AnalyzePageProps {
  searchParams: { url?: string };
}

export default async function AnalyzePage({ searchParams }: AnalyzePageProps) {
  // Redirect if no URL is provided
  if (!searchParams.url) {
    redirect('/');
  }
  
  try {
    // Get the session using the built-in Next.js function
    const session = await getServerSession();
    
    // Redirect if not authenticated
    if (!session || !session.user) {
      redirect('/');
    }
    
    // Decode the repository URL
    const repositoryUrl = decodeURIComponent(searchParams.url);
    
    // Get the token from the session
    const accessToken = session.accessToken as string;
    
    if (!accessToken) {
      return (
        <div className="p-4 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">Authentication Error</h2>
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            GitHub access token not found. Please sign in again.
          </div>
        </div>
      );
    }
    
    // Analyze the repository using the user's GitHub token
    const result = await getRepositoryContext(repositoryUrl, accessToken);
    
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Repository Analysis Results</h2>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-2">{result.repositoryName}</h3>
          
          {result.description && (
            <p className="text-gray-600 mb-4">{result.description}</p>
          )}
          
          <div className="mb-4">
            <h4 className="font-medium mb-1">Main Purpose</h4>
            <p>{result.mainPurpose}</p>
          </div>
          
          {result.technologies.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium mb-1">Technologies</h4>
              <div className="flex flex-wrap gap-2">
                {result.technologies.map((tech) => (
                  <span key={tech} className="bg-gray-100 px-2 py-1 rounded text-sm">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {result.keyFiles.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium mb-1">Key Files</h4>
              <ul className="list-disc list-inside">
                {result.keyFiles.map((file) => (
                  <li key={file}>{file}</li>
                ))}
              </ul>
            </div>
          )}
          
          {result.fileStructure && (
            <div>
              <h4 className="font-medium mb-1">File Structure</h4>
              <pre className="bg-gray-50 p-3 rounded text-sm overflow-auto max-h-60">
                {result.fileStructure}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div className="p-4 max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold mb-4">Repository Analysis Error</h2>
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error instanceof Error ? error.message : 'Failed to analyze repository'}
        </div>
      </div>
    );
  }
} 