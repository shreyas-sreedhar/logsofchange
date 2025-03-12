import NextAuth, { DefaultSession, NextAuthConfig } from "next-auth";
import GitHub from "next-auth/providers/github";
import { upsertUser } from "./lib/db/users";

// Extend the built-in types
declare module "next-auth" {
  interface Session {
    accessToken?: string;
    user: {
      id: string;
      login: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    login: string;
    name?: string;
    email?: string;
    image?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    id: string;
    login?: string;
  }
}

// Validate environment variables
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error('NEXTAUTH_SECRET environment variable is not set');
}

if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
  throw new Error('GitHub OAuth credentials are not properly configured');
}

// NextAuth configuration
export const config: NextAuthConfig = {
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: { params: { scope: "read:user repo user:email" } },
      profile(profile) {
        return {
          id: String(profile.id),
          login: profile.login,
          name: profile.name || profile.login,
          email: profile.email,
          image: profile.avatar_url,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        // Create or update the user in the database
        if (profile && user) {
          await upsertUser({
            github_id: String(profile.id),
            login: profile.login as string,
            email: user.email || undefined,
            name: user.name || undefined,
            avatar_url: user.image || undefined
          });
        }
        return true;
      } catch (error) {
        console.error("Error saving user to database:", error);
        // Still allow sign in even if database save fails
        return true;
      }
    },
    async jwt({ token, account, user }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          id: user.id,
          login: user.login,
        };
      }
      
      // Return previous token if the access token has not expired yet
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken;
        session.user.id = token.id || "";
        session.user.login = token.login || "";
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    signOut: "/",
    error: "/",
    newUser: "/dashboard",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};

// Create the auth object
const { handlers, auth, signIn, signOut } = NextAuth(config);

// Export NextAuth utilities
export { handlers, auth, signIn, signOut };

// Helper function for server components
export async function getServerAuth() {
  return await auth();
}