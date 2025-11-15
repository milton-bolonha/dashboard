/**
 * Usage counter model for MongoDB
 * Tracks API usage for rate limiting
 */
export interface UsageCounterDocument {
  _id?: string;
  sessionId: string; // Session identifier
  userId?: string; // Clerk user ID (when integrated, FASE 2)
  date: string; // YYYY-MM-DD format
  tilesGenerated: number;
  requestsCount: number;
  lastRequestAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Create a new usage counter document
 */
export function createUsageCounter(
  sessionId: string,
  date: string
): Omit<UsageCounterDocument, "_id" | "createdAt" | "updatedAt"> {
  return {
    sessionId,
    date,
    tilesGenerated: 0,
    requestsCount: 0,
    lastRequestAt: new Date(),
  };
}

