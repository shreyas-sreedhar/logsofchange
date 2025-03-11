// components/NextAuthProvider.tsx
'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';

interface NextAuthProviderProps {
  children: ReactNode;
}

const NextAuthProvider = ({ children }: NextAuthProviderProps) => {
  return (
    <SessionProvider 
      // Refetch session every 5 minutes to keep it fresh
      refetchInterval={5 * 60}
      // Refetch session when window focuses
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  );
};

export default NextAuthProvider;
