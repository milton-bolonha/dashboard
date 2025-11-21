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
  
  // SaaS & Billing
  plan: "FREE" | "PRO" | "PRO_PLUS";
  stripeCustomerId?: string;
  subscriptionId?: string;
  subscriptionStatus?: "active" | "canceled" | "past_due" | "incomplete";
  
  // Usage Tracking
  usage: {
    tokensUsed: number;      // Resets monthly
    companiesCount: number;  // Total active companies
    contactsCount: number;   // Total active contacts across all companies
    filesUploaded: number;   // Total files uploaded
    lastResetDate: Date;     // For monthly token reset
  };

  createdAt: Date;
  updatedAt: Date;
}

