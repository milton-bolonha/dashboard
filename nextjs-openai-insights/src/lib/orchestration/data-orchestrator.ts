/**
 * Data Orchestrator - Centralized data flow management
 * 
 * Responsibilities:
 * - Coordinate data sync between localStorage, server cache, and MongoDB
 * - Manage data consistency across storage layers
 * - Handle guest → member migration
 * - Provide unified API for data operations
 */

import type { WorkspaceSnapshot, Tile, Note, Contact } from "@/lib/types";
import type { CompanyWithDashboards, Dashboard } from "@/lib/types/dashboard";

// Client-side imports (conditional)
let workspaceBrowser: any;
let dashboardsStore: any;

if (typeof window !== "undefined") {
  workspaceBrowser = require("@/lib/storage/workspace-browser");
  dashboardsStore = require("@/lib/storage/dashboards-store");
}

// Server-side imports (conditional)
let cookiesStore: any;
let mongodbStore: any;

if (typeof window === "undefined") {
  cookiesStore = require("@/lib/cookies-store");
  mongodbStore = require("@/lib/storage/mongodb-store");
}

/**
 * Storage layer priority:
 * 1. Client: localStorage (fast, always available)
 * 2. Server: Memory cache (30min TTL, for active sessions)
 * 3. Server: MongoDB (persistent, members only)
 */

export interface DataOrchestrationContext {
  userId: string | null; // null = guest, string = member
  sessionId: string;
  isClient: boolean; // true = browser, false = server
}

export interface SyncResult {
  success: boolean;
  source: "localStorage" | "memoryCache" | "mongodb";
  synced: string[]; // List of synced storage layers
  errors?: string[];
}

/**
 * Centralized workspace loader
 * Tries multiple sources in order of priority
 */
export async function loadWorkspaceOrchestrated(
  context: DataOrchestrationContext
): Promise<WorkspaceSnapshot | null> {
  const { userId, sessionId, isClient } = context;

  console.log("[DataOrchestrator] 🔍 Loading workspace", {
    sessionId,
    userId: userId ? "member" : "guest",
    isClient,
  });

  // CLIENT-SIDE: Load from localStorage
  if (isClient) {
    const cached = workspaceBrowser.loadWorkspace(sessionId);
    if (cached) {
      console.log("[DataOrchestrator] ✅ Loaded from localStorage");
      return cached;
    }
    return null;
  }

  // SERVER-SIDE: Try memory cache first (fast)
  try {
    const fromCache = await cookiesStore.readWorkspace();
    if (fromCache && fromCache.sessionId === sessionId) {
      console.log("[DataOrchestrator] ✅ Loaded from memory cache");
      return fromCache;
    }
  } catch (error) {
    console.warn("[DataOrchestrator] ⚠️ Memory cache miss:", error);
  }

  // SERVER-SIDE: Try MongoDB (members only)
  if (userId) {
    try {
      const companies = await mongodbStore.loadCompaniesWithDashboardsFromMongo(
        sessionId,
        userId
      );
      if (companies && companies.length > 0) {
        // Convert company to workspace format
        const company = companies[0];
        const activeDashboard = company.dashboards.find((d: Dashboard) => d.isActive) || company.dashboards[0];
        
        if (activeDashboard) {
          const workspace: WorkspaceSnapshot = {
            sessionId: company.id,
            generatedAt: company.createdAt,
            tilesToGenerate: activeDashboard.tiles?.length || 0,
            company: {
              id: company.id,
              name: company.name,
              website: company.website,
              tiles: activeDashboard.tiles || [],
              notes: activeDashboard.notes || [],
              contacts: activeDashboard.contacts || [],
            },
            appearance: activeDashboard.appearance,
          };
          
          console.log("[DataOrchestrator] ✅ Loaded from MongoDB");
          return workspace;
        }
      }
    } catch (error) {
      console.warn("[DataOrchestrator] ⚠️ MongoDB load failed:", error);
    }
  }

  console.log("[DataOrchestrator] ❌ Workspace not found in any storage");
  return null;
}

/**
 * Centralized workspace saver
 * Saves to appropriate storage layers based on user type
 */
export async function saveWorkspaceOrchestrated(
  workspace: WorkspaceSnapshot,
  context: DataOrchestrationContext
): Promise<SyncResult> {
  const { userId, isClient } = context;
  const synced: string[] = [];
  const errors: string[] = [];

  console.log("[DataOrchestrator] 💾 Saving workspace", {
    sessionId: workspace.sessionId,
    userId: userId ? "member" : "guest",
    isClient,
    tilesCount: workspace.company.tiles.length,
  });

  // CLIENT-SIDE: Always save to localStorage (cache)
  if (isClient) {
    try {
      workspaceBrowser.saveWorkspace(workspace.sessionId, workspace);
      synced.push("localStorage");
      console.log("[DataOrchestrator] ✅ Saved to localStorage");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`localStorage: ${errorMsg}`);
      console.error("[DataOrchestrator] ❌ localStorage save failed:", errorMsg);
    }

    // Client can't access server storage
    return {
      success: synced.length > 0,
      source: "localStorage",
      synced,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // SERVER-SIDE: Save to memory cache (always)
  try {
    await cookiesStore.writeWorkspace(workspace);
    synced.push("memoryCache");
    console.log("[DataOrchestrator] ✅ Saved to memory cache");
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(`memoryCache: ${errorMsg}`);
    console.error("[DataOrchestrator] ❌ Memory cache save failed:", errorMsg);
  }

  // SERVER-SIDE: Save to MongoDB (members only)
  if (userId) {
    try {
      // Import withRetry from mongodb
      const { withRetry } = await import("@/lib/db/mongodb");
      
      // ✅ Use withRetry for automatic retry with exponential backoff
      await withRetry(
        async () => {
          // Sync tiles
          const tilesSuccess = await mongodbStore.syncWorkspaceTilesToMongo(
            workspace.sessionId,
            userId,
            workspace.company.tiles
          );

          // Sync notes
          const notesSuccess = await mongodbStore.syncWorkspaceNotesToMongo(
            workspace.sessionId,
            userId,
            workspace.company.notes
          );

          // Sync contacts
          const contactsSuccess = await mongodbStore.syncWorkspaceContactsToMongo(
            workspace.sessionId,
            userId,
            workspace.company.contacts
          );

          if (!tilesSuccess || !notesSuccess || !contactsSuccess) {
            throw new Error("Partial sync failure");
          }
        },
        {
          maxRetries: 3,
          onRetry: ({ attempt, delay, error }) => {
            console.log(`[DataOrchestrator] ⏳ Retrying MongoDB sync (attempt ${attempt}) in ${delay}ms`);
            console.log(`[DataOrchestrator] ⚠️ Retry reason:`, error.message);
          },
        }
      );

      synced.push("mongodb");
      console.log("[DataOrchestrator] ✅ Saved to MongoDB with retry protection");
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      errors.push(`mongodb: ${errorMsg}`);
      console.error("[DataOrchestrator] ❌ MongoDB save failed after retries:", errorMsg);
      
      // ✅ Add to sync queue for offline processing (client-side only, members only)
      // Note: Guests (userId === null) don't use MongoDB, so no queue needed
      if (context.isClient && userId) {
        try {
          const { getSyncQueue } = await import("@/lib/orchestration/sync-queue");
          const syncQueue = getSyncQueue();
          
          await syncQueue.add({
            operation: 'saveWorkspace',
            data: {
              tiles: workspace.company.tiles,
              notes: workspace.company.notes,
              contacts: workspace.company.contacts,
            },
            userId, // Always defined here (checked above)
            sessionId: workspace.sessionId,
          });
          
          console.log("[DataOrchestrator] ✅ Added to sync queue for later retry (member only)");
        } catch (queueError) {
          console.error("[DataOrchestrator] ❌ Failed to add to sync queue:", queueError);
        }
      } else if (!userId) {
        console.log("[DataOrchestrator] ℹ️ Guest mode - MongoDB not used, no queue needed");
      }
    }
  }

  return {
    success: synced.length > 0,
    source: synced.includes("mongodb") ? "mongodb" : synced.includes("memoryCache") ? "memoryCache" : "localStorage",
    synced,
    errors: errors.length > 0 ? errors : undefined,
  };
}

/**
 * Update specific tiles in workspace
 * Ensures consistency across all storage layers
 */
export async function updateTilesOrchestrated(
  sessionId: string,
  tiles: Tile[],
  context: DataOrchestrationContext
): Promise<SyncResult> {
  const workspace = await loadWorkspaceOrchestrated(context);
  
  if (!workspace) {
    return {
      success: false,
      source: "localStorage",
      synced: [],
      errors: ["Workspace not found"],
    };
  }

  // Update tiles
  workspace.company.tiles = tiles;

  // Save updated workspace
  return saveWorkspaceOrchestrated(workspace, context);
}

/**
 * Update specific notes in workspace
 */
export async function updateNotesOrchestrated(
  sessionId: string,
  notes: Note[],
  context: DataOrchestrationContext
): Promise<SyncResult> {
  const workspace = await loadWorkspaceOrchestrated(context);
  
  if (!workspace) {
    return {
      success: false,
      source: "localStorage",
      synced: [],
      errors: ["Workspace not found"],
    };
  }

  workspace.company.notes = notes;
  return saveWorkspaceOrchestrated(workspace, context);
}

/**
 * Update specific contacts in workspace
 */
export async function updateContactsOrchestrated(
  sessionId: string,
  contacts: Contact[],
  context: DataOrchestrationContext
): Promise<SyncResult> {
  const workspace = await loadWorkspaceOrchestrated(context);
  
  if (!workspace) {
    return {
      success: false,
      source: "localStorage",
      synced: [],
      errors: ["Workspace not found"],
    };
  }

  workspace.company.contacts = contacts;
  return saveWorkspaceOrchestrated(workspace, context);
}

/**
 * Migrate guest data to member account
 * Called after successful payment/signup
 */
export async function migrateGuestToMemberOrchestrated(
  guestSessionId: string,
  newUserId: string
): Promise<SyncResult> {
  console.log("[DataOrchestrator] 🔄 Migrating guest → member", {
    guestSessionId,
    newUserId,
  });

  const synced: string[] = [];
  const errors: string[] = [];

  // This should only run on server
  if (typeof window !== "undefined") {
    return {
      success: false,
      source: "localStorage",
      synced: [],
      errors: ["Migration must run on server"],
    };
  }

  try {
    // Load guest workspace from memory cache
    const guestWorkspace = await cookiesStore.readWorkspace();
    
    if (!guestWorkspace || guestWorkspace.sessionId !== guestSessionId) {
      errors.push("Guest workspace not found in cache");
      return { success: false, source: "memoryCache", synced, errors };
    }

    // Sync to MongoDB with new userId
    const tilesSuccess = await mongodbStore.syncWorkspaceTilesToMongo(
      guestSessionId,
      newUserId,
      guestWorkspace.company.tiles
    );

    const notesSuccess = await mongodbStore.syncWorkspaceNotesToMongo(
      guestSessionId,
      newUserId,
      guestWorkspace.company.notes
    );

    const contactsSuccess = await mongodbStore.syncWorkspaceContactsToMongo(
      guestSessionId,
      newUserId,
      guestWorkspace.company.contacts
    );

    if (tilesSuccess && notesSuccess && contactsSuccess) {
      synced.push("mongodb");
      console.log("[DataOrchestrator] ✅ Migration completed");
    } else {
      errors.push("Partial migration failure");
    }

    return {
      success: synced.length > 0,
      source: "mongodb",
      synced,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    errors.push(`Migration failed: ${errorMsg}`);
    console.error("[DataOrchestrator] ❌ Migration failed:", errorMsg);
    
    return {
      success: false,
      source: "mongodb",
      synced,
      errors,
    };
  }
}

/**
 * Health check - verify all storage layers are accessible
 */
export async function checkStorageHealth(
  context: DataOrchestrationContext
): Promise<{
  localStorage: boolean;
  memoryCache: boolean;
  mongodb: boolean;
}> {
  const health = {
    localStorage: false,
    memoryCache: false,
    mongodb: false,
  };

  // Check localStorage (client only)
  if (context.isClient) {
    try {
      const testKey = "__storage_test__";
      localStorage.setItem(testKey, "test");
      localStorage.removeItem(testKey);
      health.localStorage = true;
    } catch {
      health.localStorage = false;
    }
  }

  // Check memory cache (server only)
  if (!context.isClient) {
    try {
      const test = await cookiesStore.readWorkspace();
      health.memoryCache = true; // If no error, cache is accessible
    } catch {
      health.memoryCache = false;
    }
  }

  // Check MongoDB (server only, members only)
  if (!context.isClient && context.userId) {
    try {
      await mongodbStore.loadCompaniesWithDashboardsFromMongo(
        context.sessionId,
        context.userId
      );
      health.mongodb = true;
    } catch {
      health.mongodb = false;
    }
  }

  return health;
}
