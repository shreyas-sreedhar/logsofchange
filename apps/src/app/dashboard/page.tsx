'use client';

import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import StatsCard from "../components/dashboard/StatsCard";
import RepoCard from "../components/dashboard/RepoCard";
import { ChartIcon, ClockIcon, LinkIcon } from "../components/Icons";
import useGithubRepos from "../hooks/useGithubRepos";
import useChangelogs from "../hooks/useChangelogs";
import ChangelogCard from "../components/dashboard/ChangelogCard";
import { DashboardShimmer } from "../components/dashboard/ShimmerLoading";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const { repos, recentRepos, loading, error, refreshRepos } = useGithubRepos();
  const { changelogs, loading: changelogsLoading, error: changelogsError } = useChangelogs(1, 5);
  const [showAllRepos, setShowAllRepos] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const handleGenerateChangelog = (repoId: number) => {
    router.push(`/repository/${repoId}`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshRepos();
    setRefreshing(false);
  };

  // Show loading state if session is loading
  if (sessionStatus === "loading") {
    return <DashboardShimmer />;
  }

  // Show loading state if data is loading
  if (loading || changelogsLoading) {
    return <DashboardShimmer />;
  }

  // Show error if not authenticated
  if (sessionStatus === "unauthenticated") {
    return (
      <div className="min-h-screen p-8 bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-6">You need to be signed in to access this dashboard.</p>
          <a href="/" className="px-4 py-2 bg-black text-white rounded-none hover:bg-gray-800">
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-medium text-black">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">
              {session?.user?.name || session?.user?.email}
            </span>
            <button 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="text-gray-600 hover:text-black"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Section */}
        <section className="mb-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatsCard 
              title="Total Repositories" 
              value={repos.length} 
              description="Repositories connected to your account"
              icon={<LinkIcon className="w-5 h-5" />}
            />
            <StatsCard 
              title="Recent Activity" 
              value={recentRepos.length} 
              description="Repositories updated in the last 7 days"
              icon={<ClockIcon className="w-5 h-5" />}
            />
            <StatsCard 
              title="Changelogs Generated" 
              value={changelogs.length} 
              description="Total changelogs you've created"
              icon={<ChartIcon className="w-5 h-5" />}
            />
          </div>
        </section>

        {/* Repositories Section */}
        <section className="mb-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium text-black">Your Repositories</h2>
            <div className="flex gap-4">
              <button 
                onClick={() => setShowAllRepos(!showAllRepos)}
                className="text-gray-600 hover:text-black"
              >
                {showAllRepos ? 'Show Recent' : 'Show All'}
              </button>
              <button 
                onClick={handleRefresh} 
                disabled={refreshing}
                className="text-gray-600 hover:text-black disabled:text-gray-400"
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-gray-600">Loading repositories...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p>Error loading repositories. Please try again.</p>
            </div>
          ) : (showAllRepos ? repos : recentRepos).length === 0 ? (
            <div className="text-center py-8 border border-gray-200 p-5">
              <p className="text-gray-600 mb-4">No repositories found.</p>
              <a 
                href="https://github.com/new" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-black text-white hover:bg-gray-800 px-4 py-2 rounded-none font-normal"
              >
                Create a Repository
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {(showAllRepos ? repos : recentRepos).map((repo) => (
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
        </section>

        {/* Recent Changelogs Section */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-medium text-black">Recent Changelogs</h2>
            <Link 
              href="/changelogs" 
              className="text-gray-600 hover:text-black flex items-center"
            >
              View All
              <svg className="w-4 h-4 ml-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>

          {changelogsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
              <p className="text-gray-600">Loading changelogs...</p>
            </div>
          ) : changelogsError ? (
            <div className="text-center py-8 text-red-600">
              <p>Error loading changelogs. Please try again.</p>
            </div>
          ) : changelogs.length === 0 ? (
            <div className="text-center py-8 border border-gray-200 p-5">
              <p className="text-gray-600 mb-4">No changelogs generated yet.</p>
              <p className="text-gray-600 mb-4">Select a repository above to generate your first changelog.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {changelogs.map((changelog) => (
                <ChangelogCard key={changelog.id} changelog={changelog} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
