/**
 * User model for MongoDB
 * Prepared for Clerk integration (FASE 2)
 */
export interface UserDocument {
  _id?: string;
  clerkUserId: string; // Clerk user ID (when integrated)
  email?: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

