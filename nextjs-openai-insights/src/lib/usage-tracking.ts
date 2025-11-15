/**
 * Usage tracking and rate limiting for API endpoints
 * Tracks usage per workspace/session to prevent abuse
 */

interface UsageRecord {
  sessionId: string;
  timestamp: number;
  endpoint: string;
  tilesGenerated?: number;
}

interface UsageLimits {
  maxTilesPerDay: number;
  maxTilesPerHour: number;
  maxRequestsPerMinute: number;
}

const DEFAULT_LIMITS: UsageLimits = {
  maxTilesPerDay: 1000, // Max tiles per day per session
  maxTilesPerHour: 200, // Max tiles per hour per session
  maxRequestsPerMinute: 10, // Max API requests per minute per session
};

const USAGE_STORAGE_KEY = "insights_usage_tracking";

function isBrowser() {
  return typeof window !== "undefined";
}

function getStorageKey(sessionId: string): string {
  return `${USAGE_STORAGE_KEY}_${sessionId}`;
}

/**
 * Get usage records for a session
 */
export function getUsageRecords(sessionId: string): UsageRecord[] {
  if (!isBrowser()) return [];
  try {
    const key = getStorageKey(sessionId);
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as UsageRecord[]) : [];
  } catch {
    return [];
  }
}

/**
 * Save usage record
 */
export function recordUsage(sessionId: string, endpoint: string, tilesGenerated?: number) {
  if (!isBrowser()) return;
  try {
    const records = getUsageRecords(sessionId);
    const newRecord: UsageRecord = {
      sessionId,
      timestamp: Date.now(),
      endpoint,
      tilesGenerated,
    };
    
    records.push(newRecord);
    
    // Keep only last 24 hours of records
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const filtered = records.filter((r) => r.timestamp > oneDayAgo);
    
    const key = getStorageKey(sessionId);
    localStorage.setItem(key, JSON.stringify(filtered));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Check if usage limits are exceeded
 */
export function checkUsageLimits(
  sessionId: string,
  limits: UsageLimits = DEFAULT_LIMITS
): { allowed: boolean; reason?: string; currentUsage?: { tilesToday: number; tilesThisHour: number; requestsThisMinute: number } } {
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
  
  const currentUsage = {
    tilesToday,
    tilesThisHour,
    requestsThisMinute,
  };
  
  if (tilesToday >= limits.maxTilesPerDay) {
    return {
      allowed: false,
      reason: `Daily limit exceeded: ${tilesToday}/${limits.maxTilesPerDay} tiles`,
      currentUsage,
    };
  }
  
  if (tilesThisHour >= limits.maxTilesPerHour) {
    return {
      allowed: false,
      reason: `Hourly limit exceeded: ${tilesThisHour}/${limits.maxTilesPerHour} tiles`,
      currentUsage,
    };
  }
  
  if (requestsThisMinute >= limits.maxRequestsPerMinute) {
    return {
      allowed: false,
      reason: `Rate limit exceeded: ${requestsThisMinute}/${limits.maxRequestsPerMinute} requests per minute`,
      currentUsage,
    };
  }
  
  return {
    allowed: true,
    currentUsage,
  };
}

/**
 * Clear usage records for a session (useful for testing or reset)
 */
export function clearUsageRecords(sessionId: string) {
  if (!isBrowser()) return;
  try {
    const key = getStorageKey(sessionId);
    localStorage.removeItem(key);
  } catch {
    // Ignore errors
  }
}

