/**
 * Authentication helper for API routes
 * Returns userId and authentication status using Clerk
 * 
 * Security: This function should be called in all API routes to determine
 * if the user is a guest (userId === null) or a member (userId !== null)
 */

import { auth } from '@clerk/nextjs/server';

export async function getAuth(): Promise<{
  userId: string | null;
  isAuthenticated: boolean;
}> {
  const { userId } = await auth();
  
  return {
    userId: userId || null,
    isAuthenticated: !!userId,
  };
}

