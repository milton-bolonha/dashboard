import type { Document } from "mongodb";

/**
 * User model for MongoDB
 * Prepared for Clerk integration (FASE 2)
 * Best practice: Extends Document for MongoDB compatibility
 */
export interface UserDocument extends Document {
  _id?: string;
  clerkUserId: string; // Clerk user ID (when integrated)
  email?: string;
  name?: string;
  createdAt: Date;
  updatedAt: Date;
}

