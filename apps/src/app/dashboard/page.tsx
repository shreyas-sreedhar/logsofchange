'use client';

import { useSession, signOut } from "next-auth/react";

export default function Dashboard() {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <button
            onClick={() => signOut({ callbackUrl: '/' })}
            className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-100"
          >
            Sign Out
          </button>
        </div>
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h2 className="text-lg font-medium mb-4">Welcome, {session?.user?.name}!</h2>
          {/* Add your dashboard content here */}
        </div>
      </div>
    </div>
  );
}
