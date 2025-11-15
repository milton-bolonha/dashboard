"use server";

import { db } from "./mongodb";
import type { WorkspaceSnapshot } from "@/lib/types";
import type { CompanyWithDashboards } from "@/lib/types/dashboard";
import {
  workspaceSnapshotToDocument,
  type WorkspaceDocument,
} from "./models/Workspace";
import {
  dashboardToDocument,
  type DashboardDocument,
} from "./models/Dashboard";
import { loadCompaniesWithDashboards } from "../storage/dashboards-store";

/**
 * Migrate a single workspace snapshot to MongoDB
 */
export async function migrateWorkspaceToMongo(
  workspace: WorkspaceSnapshot
): Promise<boolean> {
  try {
    const workspaceDoc = workspaceSnapshotToDocument(workspace);

    // Upsert workspace
    await db.findOneAndUpdate<WorkspaceDocument>(
      "workspaces",
      { sessionId: workspace.sessionId },
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

    console.log("[Migration] ✅ Workspace migrado:", workspace.sessionId);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Migration] ❌ Erro ao migrar workspace:", errorMessage);
    return false;
  }
}

/**
 * Migrate a company with dashboards to MongoDB
 */
export async function migrateDashboardToMongo(
  company: CompanyWithDashboards
): Promise<boolean> {
  try {
    // Create workspace document from company
    const workspaceDoc: WorkspaceDocument = {
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
      createdAt: new Date(company.createdAt),
      updatedAt: new Date(company.updatedAt),
    };

    // Upsert workspace
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

    // Migrate all dashboards
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

    console.log("[Migration] ✅ Company migrada:", company.id, {
      dashboardsCount: company.dashboards.length,
    });
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Migration] ❌ Erro ao migrar company:", errorMessage);
    return false;
  }
}

/**
 * Sync all localStorage data to MongoDB
 */
export async function syncLocalStorageToMongo(): Promise<{
  success: boolean;
  companiesMigrated: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let companiesMigrated = 0;

  try {
    // Load all companies from localStorage
    const companies = loadCompaniesWithDashboards();

    console.log("[Migration] 🔄 Iniciando migração de localStorage para MongoDB", {
      companiesCount: companies.length,
    });

    for (const company of companies) {
      try {
        const success = await migrateDashboardToMongo(company);
        if (success) {
          companiesMigrated++;
        } else {
          errors.push(`Failed to migrate company ${company.id}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Error migrating company ${company.id}: ${errorMessage}`);
        console.error(`[Migration] ❌ Erro ao migrar company ${company.id}:`, errorMessage);
      }
    }

    console.log("[Migration] ✅ Migração concluída", {
      companiesMigrated,
      errorsCount: errors.length,
    });

    return {
      success: errors.length === 0,
      companiesMigrated,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Migration] ❌ Erro crítico na migração:", errorMessage);
    return {
      success: false,
      companiesMigrated,
      errors: [`Critical error: ${errorMessage}`],
    };
  }
}

