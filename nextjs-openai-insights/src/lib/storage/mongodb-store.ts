"use server";

import { db, getMongoClient } from "@/lib/db/mongodb";
import type { Dashboard, CompanyWithDashboards } from "@/lib/types/dashboard";
import type { WorkspaceSnapshot, Tile, Contact, Note } from "@/lib/types";
import {
  dashboardToDocument,
  dashboardDocumentToDashboard,
  type DashboardDocument,
} from "@/lib/db/models/Dashboard";
import {
  workspaceSnapshotToDocument,
  workspaceDocumentToSnapshot,
  type WorkspaceDocument,
} from "@/lib/db/models/Workspace";

/**
 * Check if MongoDB is available (circuit breaker not open)
 */
async function isMongoAvailable(): Promise<boolean> {
  try {
    await getMongoClient();
    return true;
  } catch (error) {
    const err = error as Error & { code?: string };
    if (err.code === "MONGODB_CIRCUIT_OPEN") {
      return false;
    }
    // Other errors might be transient, but we'll be conservative
    return false;
  }
}

/**
 * Load companies with dashboards from MongoDB
 * Returns array of companies (for compatibility with localStorage API)
 * Security: Only loads data for the specified userId (if provided)
 * If userId is null, returns empty array (guests should not access MongoDB)
 */
export async function loadCompaniesWithDashboardsFromMongo(
  sessionId?: string,
  userId?: string | null
): Promise<CompanyWithDashboards[]> {
  // Security: Guests (userId === null) should never access MongoDB
  if (!userId) {
    return [];
  }

  if (!(await isMongoAvailable())) {
    return [];
  }

  try {
    let workspaceDocs: WorkspaceDocument[];

    // Build filter with userId for security isolation
    const filter: { sessionId?: string; userId: string } = {
      userId,
    };

    if (sessionId) {
      // Load specific workspace for this user
      filter.sessionId = sessionId;
      const workspaceDoc = await db.findOne<WorkspaceDocument>("workspaces", filter);
      workspaceDocs = workspaceDoc ? [workspaceDoc] : [];
    } else {
      // Load all workspaces for this user only
      workspaceDocs = await db.find<WorkspaceDocument>("workspaces", filter);
    }

    const companies: CompanyWithDashboards[] = [];

    for (const workspaceDoc of workspaceDocs) {
      // Convert workspace to company structure
      const company: CompanyWithDashboards = {
        id: workspaceDoc.sessionId,
        name: workspaceDoc.company.name,
        website: workspaceDoc.company.website,
        dashboards: [],
        createdAt: workspaceDoc.createdAt.toISOString(),
        updatedAt: workspaceDoc.updatedAt.toISOString(),
      };

      // Load dashboards for this company (scoped by userId for security)
      const dashboardDocs = await db.find<DashboardDocument>("dashboards", {
        companyId: workspaceDoc.sessionId,
        userId: workspaceDoc.userId || userId, // Ensure userId filter
      });

      company.dashboards = dashboardDocs.map(dashboardDocumentToDashboard);
      companies.push(company);
    }

    return companies;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[MongoDB Store] ❌ Erro ao carregar companies:", errorMessage);
    return [];
  }
}

/**
 * Save company to MongoDB
 * Security: Only saves if userId is provided (members only, not guests)
 * Returns false if userId is null (guests should not save to MongoDB)
 */
export async function saveCompanyToMongo(
  company: CompanyWithDashboards,
  userId: string | null
): Promise<boolean> {
  // Security: Guests (userId === null) should never save to MongoDB
  if (!userId) {
    console.log("[MongoDB Store] ⚠️ Tentativa de salvar company sem userId (guest), ignorando MongoDB");
    return false;
  }

  if (!(await isMongoAvailable())) {
    return false;
  }

  try {
    // Save or update workspace with userId
    const workspaceDoc = workspaceSnapshotToDocument({
      sessionId: company.id,
      company: {
        id: company.id,
        name: company.name,
        website: company.website,
        tiles: [],
        notes: [],
        contacts: [],
      },
      generatedAt: company.createdAt,
      tilesToGenerate: 0,
    });

    // Ensure userId is set in the document
    const workspaceDocWithUserId: WorkspaceDocument = {
      ...workspaceDoc,
      userId,
    } as WorkspaceDocument;

    await db.findOneAndUpdate<WorkspaceDocument>(
      "workspaces",
      { sessionId: company.id, userId }, // Security: Filter by userId
      {
        $set: {
          ...workspaceDocWithUserId,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Save/update all dashboards with userId
    for (const dashboard of company.dashboards) {
      const dashboardDoc = dashboardToDocument(dashboard);
      // Ensure userId is set in dashboard document
      const dashboardDocWithUserId: DashboardDocument = {
        ...dashboardDoc,
        userId,
      } as DashboardDocument;

      await db.findOneAndUpdate<DashboardDocument>(
        "dashboards",
        { id: dashboard.id, userId }, // Security: Filter by userId
        {
          $set: {
            ...dashboardDocWithUserId,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
    }

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[MongoDB Store] ❌ Erro ao salvar company:", errorMessage);
    return false;
  }
}

/**
 * Create dashboard in MongoDB
 * Security: Only creates if userId is provided (members only, not guests)
 * Returns null if userId is null (guests should not create in MongoDB)
 */
export async function createDashboardInMongo(
  companyId: string,
  dashboardName: string,
  userId: string | null,
  templateId?: string
): Promise<Dashboard | null> {
  // Security: Guests (userId === null) should never create in MongoDB
  if (!userId) {
    console.log("[MongoDB Store] ⚠️ Tentativa de criar dashboard sem userId (guest), ignorando MongoDB");
    return null;
  }

  if (!(await isMongoAvailable())) {
    return null;
  }

  try {
    const dashboardId = `dashboard_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const now = new Date();

    const dashboard: Dashboard = {
      id: dashboardId,
      name: dashboardName,
      companyId,
      templateId: templateId || undefined,
      tiles: [],
      notes: [],
      contacts: [],
      appearance: undefined,
      contrastMode: false,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      isActive: false,
    };

    const dashboardDoc = dashboardToDocument(dashboard);
    // Ensure userId is set in dashboard document
    const dashboardDocWithUserId: DashboardDocument = {
      ...dashboardDoc,
      userId,
    } as DashboardDocument;

    await db.insertOne<DashboardDocument>("dashboards", dashboardDocWithUserId);

    // Set all other dashboards as inactive (scoped by userId for security)
    await db.updateMany<DashboardDocument>(
      "dashboards",
      { companyId, userId, id: { $ne: dashboardId } }, // Security: Filter by userId
      { $set: { isActive: false } }
    );

    // Set new dashboard as active (scoped by userId for security)
    await db.updateOne<DashboardDocument>(
      "dashboards",
      { id: dashboardId, userId }, // Security: Filter by userId
      { $set: { isActive: true } }
    );

    dashboard.isActive = true;
    return dashboard;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[MongoDB Store] ❌ Erro ao criar dashboard:", errorMessage);
    return null;
  }
}

/**
 * Update dashboard in MongoDB
 * Security: Requires userId to ensure ownership verification
 */
export async function updateDashboardInMongo(
  companyId: string,
  dashboardId: string,
  userId: string | null,
  updates: Partial<Dashboard>
): Promise<boolean> {
  // Security: Guests (userId === null) should never update in MongoDB
  if (!userId) {
    console.log("[MongoDB Store] ⚠️ Tentativa de atualizar dashboard sem userId (guest), ignorando MongoDB");
    return false;
  }

  if (!(await isMongoAvailable())) {
    return false;
  }

  try {
    const updateDoc: Partial<DashboardDocument> = {};
    
    if (updates.name !== undefined) updateDoc.name = updates.name;
    if (updates.templateId !== undefined) updateDoc.templateId = updates.templateId;
    if (updates.appearance !== undefined) updateDoc.appearance = updates.appearance;
    if (updates.contrastMode !== undefined) updateDoc.contrastMode = updates.contrastMode;
    if (updates.isActive !== undefined) updateDoc.isActive = updates.isActive;
    
    if (updates.tiles !== undefined) {
      updateDoc.tiles = updates.tiles.map((tile) => ({
        ...tile,
        createdAt: new Date(tile.createdAt),
        updatedAt: new Date(tile.updatedAt),
      })) as DashboardDocument["tiles"];
    }
    
    if (updates.notes !== undefined) {
      updateDoc.notes = updates.notes.map((note) => ({
        ...note,
        createdAt: new Date(note.createdAt),
        updatedAt: new Date(note.updatedAt),
      })) as DashboardDocument["notes"];
    }
    
    if (updates.contacts !== undefined) {
      updateDoc.contacts = updates.contacts.map((contact) => ({
        ...contact,
        createdAt: new Date(contact.createdAt),
      })) as DashboardDocument["contacts"];
    }

    // Security: Filter by userId to ensure ownership
    await db.updateOne<DashboardDocument>(
      "dashboards",
      { id: dashboardId, companyId, userId }, // Security: Filter by userId
      { $set: updateDoc }
    );

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[MongoDB Store] ❌ Erro ao atualizar dashboard:", errorMessage);
    return false;
  }
}

/**
 * Delete dashboard from MongoDB
 * Security: Requires userId to ensure ownership verification
 */
export async function deleteDashboardFromMongo(
  companyId: string,
  dashboardId: string,
  userId: string | null
): Promise<boolean> {
  // Security: Guests (userId === null) should never delete from MongoDB
  if (!userId) {
    console.log("[MongoDB Store] ⚠️ Tentativa de deletar dashboard sem userId (guest), ignorando MongoDB");
    return false;
  }

  if (!(await isMongoAvailable())) {
    return false;
  }

  try {
    // Security: Filter by userId to ensure ownership
    await db.deleteOne<DashboardDocument>("dashboards", {
      id: dashboardId,
      companyId,
      userId, // Security: Filter by userId
    });
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[MongoDB Store] ❌ Erro ao deletar dashboard:", errorMessage);
    return false;
  }
}

/**
 * Get active dashboard for a company
 * Security: Requires userId to ensure data isolation
 */
export async function getActiveDashboardFromMongo(
  companyId: string,
  userId: string | null
): Promise<Dashboard | null> {
  // Security: Guests (userId === null) should never access MongoDB
  if (!userId) {
    return null;
  }

  if (!(await isMongoAvailable())) {
    return null;
  }

  try {
    // Security: Filter by userId to ensure data isolation
    const dashboardDoc = await db.findOne<DashboardDocument>("dashboards", {
      companyId,
      userId, // Security: Filter by userId
      isActive: true,
    });

    if (!dashboardDoc) {
      // Fallback to first dashboard for this user
      const firstDashboard = await db.findOne<DashboardDocument>("dashboards", {
        companyId,
        userId, // Security: Filter by userId
      });
      if (!firstDashboard) return null;
      return dashboardDocumentToDashboard(firstDashboard);
    }

    return dashboardDocumentToDashboard(dashboardDoc);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[MongoDB Store] ❌ Erro ao buscar active dashboard:", errorMessage);
    return null;
  }
}

/**
 * Set active dashboard
 * Security: Requires userId to ensure ownership verification
 */
export async function setActiveDashboardInMongo(
  companyId: string,
  dashboardId: string,
  userId: string | null
): Promise<boolean> {
  // Security: Guests (userId === null) should never update in MongoDB
  if (!userId) {
    console.log("[MongoDB Store] ⚠️ Tentativa de definir active dashboard sem userId (guest), ignorando MongoDB");
    return false;
  }

  if (!(await isMongoAvailable())) {
    return false;
  }

  try {
    // Set all dashboards as inactive (scoped by userId for security)
    await db.updateMany<DashboardDocument>(
      "dashboards",
      { companyId, userId }, // Security: Filter by userId
      { $set: { isActive: false } }
    );

    // Set target dashboard as active (scoped by userId for security)
    await db.updateOne<DashboardDocument>(
      "dashboards",
      { id: dashboardId, companyId, userId }, // Security: Filter by userId
      { $set: { isActive: true } }
    );

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[MongoDB Store] ❌ Erro ao definir active dashboard:", errorMessage);
    return false;
  }
}

/**
 * Sync workspace tiles to active dashboard in MongoDB
 * This is used when workspace.company.tiles is updated
 * Security: Requires userId to ensure ownership verification
 */
export async function syncWorkspaceTilesToMongo(
  sessionId: string,
  userId: string | null,
  tiles: unknown[] // Will be typed as Tile[]
): Promise<boolean> {
  // Security: Guests (userId === null) should never sync to MongoDB
  if (!userId) {
    console.log("[MongoDB Store] ⚠️ Tentativa de sincronizar tiles sem userId (guest), ignorando MongoDB");
    return false;
  }

  if (!(await isMongoAvailable())) {
    return false;
  }

  try {
    // Find active dashboard for this company (scoped by userId for security)
    const dashboardDoc = await db.findOne<DashboardDocument>("dashboards", {
      companyId: sessionId,
      userId, // Security: Filter by userId
      isActive: true,
    });

    if (!dashboardDoc) {
      // Try to find any dashboard for this user, or create default
      const anyDashboard = await db.findOne<DashboardDocument>("dashboards", {
        companyId: sessionId,
        userId, // Security: Filter by userId
      });
      
      if (!anyDashboard) {
        console.log("[MongoDB Store] ⚠️ No dashboard found for company, skipping tile sync");
        return false;
      }

      // Update the found dashboard (scoped by userId for security)
      await db.updateOne<DashboardDocument>(
        "dashboards",
        { id: anyDashboard.id, userId }, // Security: Filter by userId
        {
          $set: {
            tiles: tiles.map((tile: any) => ({
              ...tile,
              createdAt: new Date(tile.createdAt),
              updatedAt: new Date(tile.updatedAt),
            })) as DashboardDocument["tiles"],
            updatedAt: new Date(),
          },
        }
      );
      return true;
    }

    // Update active dashboard tiles (scoped by userId for security)
    await db.updateOne<DashboardDocument>(
      "dashboards",
      { id: dashboardDoc.id, userId }, // Security: Filter by userId
      {
        $set: {
          tiles: tiles.map((tile: any) => ({
            ...tile,
            createdAt: new Date(tile.createdAt),
            updatedAt: new Date(tile.updatedAt),
          })) as DashboardDocument["tiles"],
          updatedAt: new Date(),
        },
      }
    );

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[MongoDB Store] ❌ Erro ao sincronizar tiles:", errorMessage);
    return false;
  }
}

/**
 * Sync workspace contacts to active dashboard in MongoDB
 * Security: Requires userId to ensure ownership verification
 */
export async function syncWorkspaceContactsToMongo(
  sessionId: string,
  userId: string | null,
  contacts: unknown[] // Will be typed as Contact[]
): Promise<boolean> {
  // Security: Guests (userId === null) should never sync to MongoDB
  if (!userId) {
    console.log("[MongoDB Store] ⚠️ Tentativa de sincronizar contacts sem userId (guest), ignorando MongoDB");
    return false;
  }

  if (!(await isMongoAvailable())) {
    return false;
  }

  try {
    // Security: Filter by userId to ensure data isolation
    const dashboardDoc = await db.findOne<DashboardDocument>("dashboards", {
      companyId: sessionId,
      userId, // Security: Filter by userId
      isActive: true,
    }) || await db.findOne<DashboardDocument>("dashboards", {
      companyId: sessionId,
      userId, // Security: Filter by userId
    });

    if (!dashboardDoc) {
      console.log("[MongoDB Store] ⚠️ No dashboard found for company, skipping contact sync");
      return false;
    }

    // Security: Filter by userId to ensure ownership
    await db.updateOne<DashboardDocument>(
      "dashboards",
      { id: dashboardDoc.id, userId }, // Security: Filter by userId
      {
        $set: {
          contacts: contacts.map((contact: any) => ({
            ...contact,
            createdAt: new Date(contact.createdAt),
          })) as DashboardDocument["contacts"],
          updatedAt: new Date(),
        },
      }
    );

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[MongoDB Store] ❌ Erro ao sincronizar contacts:", errorMessage);
    return false;
  }
}

/**
 * Sync workspace notes to active dashboard in MongoDB
 * Security: Requires userId to ensure ownership verification
 */
export async function syncWorkspaceNotesToMongo(
  sessionId: string,
  userId: string | null,
  notes: unknown[] // Will be typed as Note[]
): Promise<boolean> {
  // Security: Guests (userId === null) should never sync to MongoDB
  if (!userId) {
    console.log("[MongoDB Store] ⚠️ Tentativa de sincronizar notes sem userId (guest), ignorando MongoDB");
    return false;
  }

  if (!(await isMongoAvailable())) {
    return false;
  }

  try {
    // Security: Filter by userId to ensure data isolation
    const dashboardDoc = await db.findOne<DashboardDocument>("dashboards", {
      companyId: sessionId,
      userId, // Security: Filter by userId
      isActive: true,
    }) || await db.findOne<DashboardDocument>("dashboards", {
      companyId: sessionId,
      userId, // Security: Filter by userId
    });

    if (!dashboardDoc) {
      console.log("[MongoDB Store] ⚠️ No dashboard found for company, skipping note sync");
      return false;
    }

    // Security: Filter by userId to ensure ownership
    await db.updateOne<DashboardDocument>(
      "dashboards",
      { id: dashboardDoc.id, userId }, // Security: Filter by userId
      {
        $set: {
          notes: notes.map((note: any) => ({
            ...note,
            createdAt: new Date(note.createdAt),
            updatedAt: new Date(note.updatedAt),
          })) as DashboardDocument["notes"],
          updatedAt: new Date(),
        },
      }
    );

    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[MongoDB Store] ❌ Erro ao sincronizar notes:", errorMessage);
    return false;
  }
}

