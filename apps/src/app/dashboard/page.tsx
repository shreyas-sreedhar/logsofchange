'use client';

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import StatsCard from "../components/dashboard/StatsCard";
import RepoCard from "../components/dashboard/RepoCard";
import { ChartIcon, ClockIcon, LinkIcon } from "../components/Icons";
import useGithubRepos from "../hooks/useGithubRepos";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { repos, recentRepos, loading, error, refreshRepos } = useGithubRepos();
  const [showAllRepos, setShowAllRepos] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [pageLoaded, setPageLoaded] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);

  // Set page as loaded after initial render
  useEffect(() => {
    setPageLoaded(true);
    
    // Show skeleton for at least 500ms to avoid flashing
    const timer = setTimeout(() => {
      setShowSkeleton(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  const handleGenerateChangelog = (repoId: number) => {
    router.push(`/repository/${repoId}`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshRepos();
    setRefreshing(false);
  };

  // Show loading state if session is loading and page hasn't loaded yet
  if ((sessionStatus === "loading" || !pageLoaded) && !session) {
    return (
      <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error if not authenticated
  if (sessionStatus === "unauthenticated") {
    return (
      <div className="min-h-screen p-8 bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">You need to be signed in to access this dashboard.</p>
          <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Go to Sign In
          </a>
        </div>
      </div>
    );
  }

  // Render skeleton UI while loading initial data
  const renderSkeletonRepos = () => (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg animate-pulse">
          <div>
            <div className="h-5 w-40 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
          </div>
          <div className="h-8 w-24 bg-gray-200 rounded"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-blue-600">Dashboard</h1>
            <p className="text-gray-600">Generate and manage changelogs for your GitHub repositories.</p>
          </div>
          <div className="flex gap-4">
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100"
            >
              Sign Out
            </button>
            <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
              New Changelog
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatsCard 
            title="Total Repositories" 
            value={showSkeleton ? 0 : repos.length} 
            description="Connected to your GitHub account"
            icon={<ChartIcon />}
          />
          <StatsCard 
            title="Generated Changelogs" 
            value={8} 
            description="Across all repositories"
            icon={<ClockIcon />}
          />
          <StatsCard 
            title="Active Integrations" 
            value={3} 
            description="API connections to websites"
            icon={<LinkIcon />}
          />
        </div>

        {/* Recent Repositories */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h2 className="text-xl font-semibold">Recent Repositories</h2>
              <p className="text-gray-600 text-sm">Select a repository to generate a changelog.</p>
            </div>
            <div className="flex items-center gap-3">
              {!showSkeleton && !loading && repos.length > 0 && (
                <button 
                  onClick={handleRefresh}
                  disabled={loading || refreshing}
                  className="text-blue-600 text-sm font-medium flex items-center"
                  title="Refresh repositories"
                >
                  {refreshing ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-1"></span>
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M9.195 18.44c1.25.713 2.805.715 4.055.002A10.001 10.001 0 0019.938 14H21.75a1.125 1.125 0 000-2.25h-1.813A10.001 10.001 0 0013.5 4.782v2.223a1.125 1.125 0 01-2.25 0V4.782a10.001 10.001 0 00-6.437 6.968H3a1.125 1.125 0 000 2.25h1.813a10.001 10.001 0 006.382 4.44z" />
                      </svg>
                      Refresh
                    </>
                  )}
                </button>
              )}
              {!showSkeleton && !loading && repos.length > recentRepos.length && (
                <button 
                  onClick={() => setShowAllRepos(!showAllRepos)}
                  className="text-blue-600 text-sm font-medium"
                >
                  {showAllRepos ? 'Show Recent Only' : 'Show All Repositories'}
                </button>
              )}
            </div>
          </div>

          {showSkeleton || loading ? (
            renderSkeletonRepos()
          ) : error ? (
            <div className="py-8 text-center">
              <div className="text-red-500 mb-2">Error: {error}</div>
              <button 
                onClick={handleRefresh}
                className="text-blue-600 text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          ) : (showAllRepos ? repos : recentRepos).length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              {showAllRepos 
                ? 'No repositories found. Connect your GitHub account to see your repositories.' 
                : 'No repositories updated in the past week.'}
            </div>
          ) : (
            <div className="space-y-4">
              {(showAllRepos ? repos : recentRepos).map(repo => (
                <RepoCard 
                  key={repo.id}
                  name={repo.name}
                  stars={repo.stars}
                  updatedAt={repo.updatedAt}
                  onGenerateClick={() => handleGenerateChangelog(repo.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
