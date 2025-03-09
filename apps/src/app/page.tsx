'use client';

import { signIn } from "next-auth/react";

import LatestChanges from "./components/homepage/LatestChages";
import GridBackground from "./components/homepage/GridBackground";

export default function Home() {
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
            {/* Get Started Button */}
            <button
              className="bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200 rounded-none px-6 py-6 h-auto"
              onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
            >
              Get Started with Github
            </button>
            {/* Contact Sales Button */}
            {/* <button className="border-black dark:border-white rounded-none px-6 py-6 h-auto">
              Contact Sales
            </button> */}
          </div>
        </div>

        <div className="md:w-1/2">
          <div className="bg-white dark:bg-gray-950 border border-gray-200 dark:border-gray-800 p-6 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-normal">Latest Changes</h2>
              <a
                href="/changelog"
                className="text-sm text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300"
              >
                View all
              </a>
            </div>
            <LatestChanges />
          </div>
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
