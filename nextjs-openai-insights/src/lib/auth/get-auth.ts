/**
 * Authentication helper for API routes
 * Returns userId and authentication status
 * 
 * Currently returns null (prepared for Clerk integration in FASE 2)
 * In FASE 2, this will check Clerk auth and return the authenticated userId
 * 
 * Security: This function should be called in all API routes to determine
 * if the user is a guest (userId === null) or a member (userId !== null)
 * 
 * Note: Removed "use server" directive as this is used in API routes which are already server-side
 */
export async function getAuth(): Promise<{
  userId: string | null;
  isAuthenticated: boolean;
}> {
  // TODO: FASE 2 - Integrate Clerk authentication
  // const { userId } = await auth();
  // return {
  //   userId: userId || null,
  //   isAuthenticated: !!userId,
  // };

  // For now, return null (guest mode)
  // This ensures guests never save to MongoDB
  return {
    userId: null,
    isAuthenticated: false,
  };
}

