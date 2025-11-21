/**
 * Server-side usage tracking and rate limiting middleware
 * For Next.js API routes
 */

import { NextResponse } from "next/server";
import { checkLimit, incrementUsage } from "@/lib/saas/usage-service";
import { db } from "@/lib/db/mongodb";
import { UserDocument } from "@/lib/db/models/User";

// Helper to get userId from session (this is a bit hacky, ideally we'd use a proper auth middleware)
// But since we are using a session ID cookie, we need to map it to a user if possible.
// However, the requirement implies we are using Clerk or some auth.
// The current implementation uses "sessionId" which maps to a workspace.
// We need to find the user associated with this session/workspace.

async function getUserIdFromSession(sessionId: string): Promise<string | null> {
  // 1. Check if we have a workspace with this sessionId
  const workspace = await db.findOne("workspaces", { sessionId });
  if (workspace && workspace.userId) {
    return workspace.userId;
  }
  
  // 2. If no workspace, maybe we can't track user limits yet (guest mode?)
  // For guest mode, we might want to stick to the IP/Session based limits or just allow it for now.
  // But the requirements are for SaaS plans, which implies logged in users.
  // If we are in guest mode (no userId), we fall back to the old limits or a "Guest" plan.
  return null;
  return null;
}

// --- Guest Limit Helpers (In-Memory) ---

interface GuestLimits {
  maxTilesPerDay: number;
  maxTilesPerHour: number;
  maxRequestsPerMinute: number;
}

// In-memory storage for server-side tracking (in production, use Redis or DB)
const usageStore = new Map<string, Array<{ timestamp: number; tilesGenerated?: number }>>();

function getUsageRecords(sessionId: string): Array<{ timestamp: number; tilesGenerated?: number }> {
  return usageStore.get(sessionId) || [];
}

function checkUsageLimits(
  sessionId: string,
  limits: GuestLimits
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

function recordGuestUsage(sessionId: string, tilesGenerated?: number) {
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

/**
 * Helper to record usage after success (Unified)
 */
export async function recordUsage(userIdOrSessionId: string, tilesGenerated: number, isGuest = false) {
  if (isGuest) {
    recordGuestUsage(userIdOrSessionId, tilesGenerated);
  } else {
    // Member usage (DB)
    const { incrementUsage } = await import("@/lib/saas/usage-service");
    await incrementUsage(userIdOrSessionId, "tokensUsed", tilesGenerated * 100);
  }
}
export async function checkUsageMiddleware(
  body: Record<string, unknown> | null,
  headers: Headers,
  tilesToGenerate?: number
): Promise<{ allowed: boolean; response?: NextResponse; userId?: string }> {
  const sessionId = (body?.sessionId as string | undefined) || headers.get("x-session-id") || "anonymous";
  
  // If we have a userId in the body (e.g. from client), use it.
  // Otherwise try to resolve from session.
  let userId = (body?.userId as string | undefined);
  
  if (!userId && sessionId !== "anonymous") {
    userId = await getUserIdFromSession(sessionId) || undefined;
  }

  if (!userId) {
    // Guest Mode: Use in-memory tracking based on sessionId
    // This enforces "Free" limits for guests to prevent abuse before sign-up
    
    // Check Guest Limits (Session-based)
    const guestLimits = {
      maxTilesPerDay: 1000, // Generous limit for guests to try the tool
      maxTilesPerHour: 200,
      maxRequestsPerMinute: 20,
    };

    const check = checkUsageLimits(sessionId, guestLimits);
    if (!check.allowed) {
      return {
        allowed: false,
        response: NextResponse.json(
          {
            error: "Guest usage limit exceeded",
            reason: check.reason,
            code: "GUEST_LIMIT_EXCEEDED",
          },
          { status: 429 }
        ),
      };
    }

    // Record usage for guest
    if (tilesToGenerate && tilesToGenerate > 0) {
       // We don't await here to not block response
       recordUsage(sessionId, tilesToGenerate, true);
    }
    
    return { allowed: true };
  }

  // Check Token Limits
  if (tilesToGenerate && tilesToGenerate > 0) {
    // Assuming 1 tile = 100 tokens for now, or we just track "tiles" directly?
    // The plan says "Monthly Token Allowance ... (~30 actions/ tiles)". 
    // So 3000 tokens / 30 tiles = 100 tokens per tile.
    const tokensCost = tilesToGenerate * 100; 
    
    const limitCheck = await checkLimit(userId, "tokens", tokensCost);
    
    if (!limitCheck.allowed) {
      return {
        allowed: false,
        response: NextResponse.json(
          {
            error: "Usage limit exceeded",
            reason: limitCheck.reason,
            code: "USAGE_LIMIT_EXCEEDED",
          },
          { status: 429 }
        ),
      };
    }
    
    // We don't increment here, we increment after success in the route handler usually.
    // But the middleware name implies "checkUsage".
    // The original middleware called "recordUsage" at the end.
    // We should probably return a function to record usage if successful.
  }

  return { allowed: true, userId };
}

/**
 * Helper to record usage after success
 */



