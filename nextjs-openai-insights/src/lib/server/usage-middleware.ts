/**
 * Server-side usage tracking and rate limiting middleware
 * For Next.js API routes
 */

import { NextRequest, NextResponse } from "next/server";

interface UsageLimits {
  maxTilesPerDay: number;
  maxTilesPerHour: number;
  maxRequestsPerMinute: number;
}

const DEFAULT_LIMITS: UsageLimits = {
  maxTilesPerDay: parseInt(process.env.MAX_TILES_PER_DAY || "1000", 10),
  maxTilesPerHour: parseInt(process.env.MAX_TILES_PER_HOUR || "200", 10),
  maxRequestsPerMinute: parseInt(process.env.MAX_REQUESTS_PER_MINUTE || "10", 10),
};

// In-memory storage for server-side tracking (in production, use Redis or DB)
const usageStore = new Map<string, Array<{ timestamp: number; tilesGenerated?: number }>>();

function getSessionId(body: any, headers: Headers): string {
  // Try to get sessionId from request body or headers
  const sessionId = body?.sessionId || headers.get("x-session-id") || "anonymous";
  return sessionId;
}

function getUsageRecords(sessionId: string): Array<{ timestamp: number; tilesGenerated?: number }> {
  return usageStore.get(sessionId) || [];
}

function recordUsage(sessionId: string, tilesGenerated?: number) {
  const records = getUsageRecords(sessionId);
  records.push({
    timestamp: Date.now(),
    tilesGenerated,
  });
  
  // Keep only last 24 hours
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const filtered = records.filter((r) => r.timestamp > oneDayAgo);
  
  usageStore.set(sessionId, filtered);
}

function checkUsageLimits(
  sessionId: string,
  limits: UsageLimits = DEFAULT_LIMITS
): { allowed: boolean; reason?: string } {
  const records = getUsageRecords(sessionId);
  const now = Date.now();
  
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneMinuteAgo = now - 60 * 1000;
  
  const tilesToday = records
    .filter((r) => r.timestamp > oneDayAgo)
    .reduce((sum, r) => sum + (r.tilesGenerated ?? 0), 0);
  
  const tilesThisHour = records
    .filter((r) => r.timestamp > oneHourAgo)
    .reduce((sum, r) => sum + (r.tilesGenerated ?? 0), 0);
  
  const requestsThisMinute = records.filter((r) => r.timestamp > oneMinuteAgo).length;
  
  if (tilesToday >= limits.maxTilesPerDay) {
    return {
      allowed: false,
      reason: `Daily limit exceeded: ${tilesToday}/${limits.maxTilesPerDay} tiles`,
    };
  }
  
  if (tilesThisHour >= limits.maxTilesPerHour) {
    return {
      allowed: false,
      reason: `Hourly limit exceeded: ${tilesThisHour}/${limits.maxTilesPerHour} tiles`,
    };
  }
  
  if (requestsThisMinute >= limits.maxRequestsPerMinute) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${requestsThisMinute}/${limits.maxRequestsPerMinute} requests per minute`,
    };
  }
  
  return { allowed: true };
}

/**
 * Middleware function to check usage limits before processing request
 */
export async function checkUsageMiddleware(
  body: any,
  headers: Headers,
  tilesToGenerate?: number
): Promise<{ allowed: boolean; response?: NextResponse }> {
  const sessionId = getSessionId(body, headers);
  
  const check = checkUsageLimits(sessionId);
  
  if (!check.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: "Usage limit exceeded",
          reason: check.reason,
          code: "USAGE_LIMIT_EXCEEDED",
        },
        { status: 429 }
      ),
    };
  }
  
  // Record usage after successful check
  recordUsage(sessionId, tilesToGenerate);
  
  return { allowed: true };
}

/**
 * Get current usage stats for a session
 */
export function getUsageStats(sessionId: string) {
  const records = getUsageRecords(sessionId);
  const now = Date.now();
  
  const oneDayAgo = now - 24 * 60 * 60 * 1000;
  const oneHourAgo = now - 60 * 60 * 1000;
  const oneMinuteAgo = now - 60 * 1000;
  
  return {
    tilesToday: records
      .filter((r) => r.timestamp > oneDayAgo)
      .reduce((sum, r) => sum + (r.tilesGenerated ?? 0), 0),
    tilesThisHour: records
      .filter((r) => r.timestamp > oneHourAgo)
      .reduce((sum, r) => sum + (r.tilesGenerated ?? 0), 0),
    requestsThisMinute: records.filter((r) => r.timestamp > oneMinuteAgo).length,
    limits: DEFAULT_LIMITS,
  };
}

