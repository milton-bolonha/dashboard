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
 */
export async function loadCompaniesWithDashboardsFromMongo(
  sessionId?: string
): Promise<CompanyWithDashboards[]> {
  if (!(await isMongoAvailable())) {
    return [];
  }

  try {
    let workspaceDocs: WorkspaceDocument[];

    if (sessionId) {
      // Load specific workspace
      const workspaceDoc = await db.findOne<WorkspaceDocument>("workspaces", {
        sessionId,
      });
      workspaceDocs = workspaceDoc ? [workspaceDoc] : [];
    } else {
      // Load all workspaces (for admin/migration purposes)
      workspaceDocs = await db.find<WorkspaceDocument>("workspaces", {});
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

      // Load dashboards for this company
      const dashboardDocs = await db.find<DashboardDocument>("dashboards", {
        companyId: workspaceDoc.sessionId,
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
 */
export async function saveCompanyToMongo(
  company: CompanyWithDashboards
): Promise<boolean> {
  if (!(await isMongoAvailable())) {
    return false;
  }

  try {
    // Save or update workspace
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

    await db.findOneAndUpdate<WorkspaceDocument>(
      "workspaces",
      { sessionId: company.id },
      {
        $set: {
          ...workspaceDoc,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    // Save/update all dashboards
    for (const dashboard of company.dashboards) {
      const dashboardDoc = dashboardToDocument(dashboard);
      await db.findOneAndUpdate<DashboardDocument>(
        "dashboards",
        { id: dashboard.id },
        {
          $set: {
            ...dashboardDoc,
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
 */
export async function createDashboardInMongo(
  companyId: string,
  dashboardName: string,
  templateId?: string
): Promise<Dashboard | null> {
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
    await db.insertOne<DashboardDocument>("dashboards", dashboardDoc);

    // Set all other dashboards as inactive
    await db.updateMany<DashboardDocument>(
      "dashboards",
      { companyId, id: { $ne: dashboardId } },
      { $set: { isActive: false } }
    );

    // Set new dashboard as active
    await db.updateOne<DashboardDocument>(
      "dashboards",
      { id: dashboardId },
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
 */
export async function updateDashboardInMongo(
  companyId: string,
  dashboardId: string,
  updates: Partial<Dashboard>
): Promise<boolean> {
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

    await db.updateOne<DashboardDocument>(
      "dashboards",
      { id: dashboardId, companyId },
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
 */
export async function deleteDashboardFromMongo(
  companyId: string,
  dashboardId: string
): Promise<boolean> {
  if (!(await isMongoAvailable())) {
    return false;
  }

  try {
    await db.deleteOne<DashboardDocument>("dashboards", {
      id: dashboardId,
      companyId,
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
 */
export async function getActiveDashboardFromMongo(
  companyId: string
): Promise<Dashboard | null> {
  if (!(await isMongoAvailable())) {
    return null;
  }

  try {
    const dashboardDoc = await db.findOne<DashboardDocument>("dashboards", {
      companyId,
      isActive: true,
    });

    if (!dashboardDoc) {
      // Fallback to first dashboard
      const firstDashboard = await db.findOne<DashboardDocument>("dashboards", {
        companyId,
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
 */
export async function setActiveDashboardInMongo(
  companyId: string,
  dashboardId: string
): Promise<boolean> {
  if (!(await isMongoAvailable())) {
    return false;
  }

  try {
    // Set all dashboards as inactive
    await db.updateMany<DashboardDocument>(
      "dashboards",
      { companyId },
      { $set: { isActive: false } }
    );

    // Set target dashboard as active
    await db.updateOne<DashboardDocument>(
      "dashboards",
      { id: dashboardId, companyId },
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
 */
export async function syncWorkspaceTilesToMongo(
  sessionId: string,
  tiles: unknown[] // Will be typed as Tile[]
): Promise<boolean> {
  if (!(await isMongoAvailable())) {
    return false;
  }

  try {
    // Find active dashboard for this company
    const dashboardDoc = await db.findOne<DashboardDocument>("dashboards", {
      companyId: sessionId,
      isActive: true,
    });

    if (!dashboardDoc) {
      // Try to find any dashboard, or create default
      const anyDashboard = await db.findOne<DashboardDocument>("dashboards", {
        companyId: sessionId,
      });
      
      if (!anyDashboard) {
        console.log("[MongoDB Store] ⚠️ No dashboard found for company, skipping tile sync");
        return false;
      }

      // Update the found dashboard
      await db.updateOne<DashboardDocument>(
        "dashboards",
        { id: anyDashboard.id },
        {
          $set: {
            tiles: tiles.map((tile: Tile) => ({
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

    // Update active dashboard tiles
    await db.updateOne<DashboardDocument>(
      "dashboards",
      { id: dashboardDoc.id },
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
 */
export async function syncWorkspaceContactsToMongo(
  sessionId: string,
  contacts: unknown[] // Will be typed as Contact[]
): Promise<boolean> {
  if (!(await isMongoAvailable())) {
    return false;
  }

  try {
    const dashboardDoc = await db.findOne<DashboardDocument>("dashboards", {
      companyId: sessionId,
      isActive: true,
    }) || await db.findOne<DashboardDocument>("dashboards", {
      companyId: sessionId,
    });

    if (!dashboardDoc) {
      console.log("[MongoDB Store] ⚠️ No dashboard found for company, skipping contact sync");
      return false;
    }

    await db.updateOne<DashboardDocument>(
      "dashboards",
      { id: dashboardDoc.id },
      {
        $set: {
          contacts: contacts.map((contact: Contact) => ({
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
 */
export async function syncWorkspaceNotesToMongo(
  sessionId: string,
  notes: unknown[] // Will be typed as Note[]
): Promise<boolean> {
  if (!(await isMongoAvailable())) {
    return false;
  }

  try {
    const dashboardDoc = await db.findOne<DashboardDocument>("dashboards", {
      companyId: sessionId,
      isActive: true,
    }) || await db.findOne<DashboardDocument>("dashboards", {
      companyId: sessionId,
    });

    if (!dashboardDoc) {
      console.log("[MongoDB Store] ⚠️ No dashboard found for company, skipping note sync");
      return false;
    }

    await db.updateOne<DashboardDocument>(
      "dashboards",
      { id: dashboardDoc.id },
      {
        $set: {
          notes: notes.map((note: Note) => ({
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

