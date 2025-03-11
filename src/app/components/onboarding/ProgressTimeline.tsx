import React from 'react';

export type OnboardingStep = 
  | 'connecting' 
  | 'fetching-repos' 
  | 'fetching-changelogs' 
  | 'fetching-prs' 
  | 'fetching-commits' 
  | 'ready';

interface ProgressTimelineProps {
  currentStep: OnboardingStep;
}

const steps: { id: OnboardingStep; label: string }[] = [
  { id: 'connecting', label: 'Connecting GitHub' },
  { id: 'fetching-repos', label: 'Fetching Repositories' },
  { id: 'fetching-changelogs', label: 'Fetching Changelogs' },
  { id: 'fetching-prs', label: 'Fetching Pull Requests' },
  { id: 'fetching-commits', label: 'Fetching Commits' },
  { id: 'ready', label: 'Ready!' },
];

export default function ProgressTimeline({ currentStep }: ProgressTimelineProps) {
  // Find the index of the current step
  const currentIndex = steps.findIndex(step => step.id === currentStep);
  
  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        {steps.map((step, index) => {
          // Determine if this step is active, completed, or upcoming
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          const isUpcoming = index > currentIndex;
          
          return (
            <React.Fragment key={step.id}>
              {/* Step circle */}
              <div className="flex flex-col items-center">
                <div 
                  className={`
                    w-10 h-10 flex items-center justify-center rounded-full border-2
                    ${isActive ? 'border-black bg-black text-white' : ''}
                    ${isCompleted ? 'border-black bg-black text-white' : ''}
                    ${isUpcoming ? 'border-gray-300 bg-white text-gray-400' : ''}
                  `}
                >
                  {isCompleted ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span 
                  className={`
                    mt-2 text-xs font-medium
                    ${isActive ? 'text-black' : ''}
                    ${isCompleted ? 'text-black' : ''}
                    ${isUpcoming ? 'text-gray-400' : ''}
                  `}
                >
                  {step.label}
                </span>
              </div>
              
              {/* Connector line (except after the last step) */}
              {index < steps.length - 1 && (
                <div 
                  className={`
                    flex-1 h-0.5 mx-2
                    ${index < currentIndex ? 'bg-black' : 'bg-gray-300'}
                  `}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
} 