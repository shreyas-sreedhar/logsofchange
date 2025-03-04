'use client';

import { signIn } from "next-auth/react";

export default function Home() {
  return (
    <div className="grid grid-rows-[1fr_auto] min-h-screen p-8 items-center justify-items-center">
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <button 
          onClick={() => signIn('github', { callbackUrl: '/dashboard' })}
          className="relative flex items-center justify-center w-full px-4 py-3 bg-white border border-gray-300 group hover:bg-gray-100 transition-colors"
        >
          {/* Corner dots with sequential animation */}
          <div className="absolute w-1.5 h-1.5 rounded-none bg-black/70 -top-1 -left-1 
            animate-glow-sequential [animation-delay:0ms]" />
          <div className="absolute w-1.5 h-1.5 rounded-none bg-black/70 -top-1 -right-1 
            animate-glow-sequential [animation-delay:500ms]" />
          <div className="absolute w-1.5 h-1.5 rounded-none bg-black/70 -bottom-1 -right-1 
            animate-glow-sequential [animation-delay:1000ms]" />
          <div className="absolute w-1.5 h-1.5 rounded-none bg-black/70 -bottom-1 -left-1 
            animate-glow-sequential [animation-delay:1500ms]" />
          
          <div className="flex items-center gap-2">
            <svg height="24" width="24" viewBox="0 0 16 16" className="w-5 h-5">
              <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"></path>
            </svg>
            <span className="text-black text-sm font-medium">Sign in with GitHub</span>
          </div>
        </button>
      </div>

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
