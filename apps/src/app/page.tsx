'use client';

import { signIn, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import LatestChanges from "./components/homepage/LatestChages";
import GridBackground from "./components/homepage/GridBackground";
import { HomePageShimmer } from "./components/homepage/ShimmerLoading";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // Redirect authenticated users to dashboard
  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard');
    }
  }, [status, router]);

  const handleSignIn = () => {
    signIn('github', { callbackUrl: '/dashboard' });
  };

  // Show loading state while checking session
  if (status === 'loading') {
    return <HomePageShimmer />;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black relative overflow-hidden">
      {/* Grid background with mask */}
      <GridBackground columns={8} rows={8} maskDirection="left" />

      {/* Main content */}
      <div className="relative z-20 container mx-auto px-4 py-20 md:py-32 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-12 md:mb-0 pr-0 md:pr-12">
          <h1 className="w-[80%] max-w-[600px] text-6xl md:text-7xl lg:text-8xl font-normal tracking-tight text-black dark:text-white mb-8 leading-[1.1]">
            Autogenerate
            <br />
            your
            <br />
            changelog
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-md">
            Create, manage, and share product updates with ease.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleSignIn}
              className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black font-medium hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors"
            >
              Sign in with GitHub
            </button>
            <a
              href="#features"
              className="px-6 py-3 border border-gray-300 dark:border-gray-700 text-black dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors"
            >
              Learn More
            </a>
          </div>
        </div>
        
        <div className="md:w-1/2">
          <LatestChanges />
        </div>
      </div>

      {/* Footer */}
      <footer className="p-4 text-center text-sm text-gray-600">
        <a href="https://github.com/shreyas-sreedhar/logsofchange"
           target="_blank"
           rel="noopener noreferrer"
           className="hover:text-black transition-colors">
          changeoflogs ©2024
        </a>
      </footer>
    </div>
  );
}
