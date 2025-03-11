'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import ProgressTimeline, { OnboardingStep } from './ProgressTimeline';

// Step 1: Connecting to GitHub
export function ConnectingGitHub() {
  return (
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-6"></div>
      <h2 className="text-2xl font-medium mb-4">Connecting to GitHub</h2>
      <p className="text-gray-600 mb-2">Establishing a secure connection to your GitHub account.</p>
      <p className="text-gray-600">This will only take a moment...</p>
    </div>
  );
}

// Step 2: Fetching Repositories
export function FetchingRepositories() {
  return (
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-6"></div>
      <h2 className="text-2xl font-medium mb-4">Fetching Your Repositories</h2>
      <p className="text-gray-600 mb-2">Retrieving your GitHub repositories.</p>
      <p className="text-gray-600">This helps us understand your projects better.</p>
    </div>
  );
}

// Step 3: Fetching Changelogs
export function FetchingChangelogs() {
  return (
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-6"></div>
      <h2 className="text-2xl font-medium mb-4">Fetching Changelogs</h2>
      <p className="text-gray-600 mb-2">Looking for existing changelogs in your repositories.</p>
      <p className="text-gray-600">We'll help you manage and create new ones.</p>
    </div>
  );
}

// Step 4: Fetching Pull Requests
export function FetchingPullRequests() {
  return (
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-6"></div>
      <h2 className="text-2xl font-medium mb-4">Fetching Pull Requests</h2>
      <p className="text-gray-600 mb-2">Analyzing your pull requests for changelog data.</p>
      <p className="text-gray-600">This helps us generate more accurate changelogs.</p>
    </div>
  );
}

// Step 5: Fetching Commits
export function FetchingCommits() {
  return (
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-6"></div>
      <h2 className="text-2xl font-medium mb-4">Fetching Commits</h2>
      <p className="text-gray-600 mb-2">Analyzing commit history for your repositories.</p>
      <p className="text-gray-600">This helps us understand your development patterns.</p>
    </div>
  );
}

// Step 6: Ready
export function Ready() {
  const router = useRouter();
  
  useEffect(() => {
    // Mark user as having completed onboarding
    localStorage.setItem('hasCompletedOnboarding', 'true');
    
    // Redirect to dashboard after 2 seconds
    const timer = setTimeout(() => {
      router.push('/dashboard');
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [router]);
  
  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-medium mb-4">All Set!</h2>
      <p className="text-gray-600 mb-2">Your account is ready to use.</p>
      <p className="text-gray-600">Redirecting you to your dashboard...</p>
    </div>
  );
}

// Main Onboarding Component
export default function OnboardingSteps() {
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('connecting');
  
  useEffect(() => {
    if (status === 'authenticated') {
      // Simulate the onboarding process with delays between steps
      const timers = [
        setTimeout(() => setCurrentStep('fetching-repos'), 2000),
        setTimeout(() => setCurrentStep('fetching-changelogs'), 4000),
        setTimeout(() => setCurrentStep('fetching-prs'), 6000),
        setTimeout(() => setCurrentStep('fetching-commits'), 8000),
        setTimeout(() => setCurrentStep('ready'), 10000)
      ];
      
      // Clean up timers on unmount
      return () => timers.forEach(timer => clearTimeout(timer));
    }
  }, [status]);
  
  // Render the appropriate step component based on current step
  const renderStepComponent = () => {
    switch (currentStep) {
      case 'connecting':
        return <ConnectingGitHub />;
      case 'fetching-repos':
        return <FetchingRepositories />;
      case 'fetching-changelogs':
        return <FetchingChangelogs />;
      case 'fetching-prs':
        return <FetchingPullRequests />;
      case 'fetching-commits':
        return <FetchingCommits />;
      case 'ready':
        return <Ready />;
      default:
        return <ConnectingGitHub />;
    }
  };
  
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <ProgressTimeline currentStep={currentStep} />
        <div className="mt-12">
          {renderStepComponent()}
        </div>
      </div>
    </div>
  );
} 