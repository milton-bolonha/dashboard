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
 * Best practice: Validate input and handle errors gracefully
 */
export async function migrateWorkspaceToMongo(
  workspace: WorkspaceSnapshot
): Promise<boolean> {
  // Validate input
  if (!workspace || !workspace.sessionId) {
    console.error("[Migration] ❌ Workspace inválido: sessionId ausente");
    return false;
  }

  try {
    const workspaceDoc = workspaceSnapshotToDocument(workspace);

    // Upsert workspace with proper error handling
    const result = await db.findOneAndUpdate<WorkspaceDocument>(
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
      { upsert: true, returnDocument: "after" }
    );

    if (!result) {
      console.warn("[Migration] ⚠️ Upsert retornou null:", workspace.sessionId);
      return false;
    }

    console.log("[Migration] ✅ Workspace migrado:", {
      sessionId: workspace.sessionId,
      companyName: workspace.company?.name,
    });
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as Error & { code?: number | string }).code;
    console.error("[Migration] ❌ Erro ao migrar workspace:", {
      sessionId: workspace.sessionId,
      message: errorMessage,
      code: errorCode,
    });
    return false;
  }
}

/**
 * Migrate a company with dashboards to MongoDB
 * Best practice: Validate input, handle errors per dashboard, and provide detailed logging
 */
export async function migrateDashboardToMongo(
  company: CompanyWithDashboards
): Promise<boolean> {
  // Validate input
  if (!company || !company.id) {
    console.error("[Migration] ❌ Company inválida: id ausente");
    return false;
  }

  if (!Array.isArray(company.dashboards)) {
    console.error("[Migration] ❌ Company inválida: dashboards não é array", company.id);
    return false;
  }

  try {
    // Create workspace document from company
    const workspaceDoc: WorkspaceDocument = {
      sessionId: company.id,
      company: {
        id: company.id,
        name: company.name || "Unnamed Company",
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

    // Upsert workspace with error handling
    const workspaceResult = await db.findOneAndUpdate<WorkspaceDocument>(
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
      { upsert: true, returnDocument: "after" }
    );

    if (!workspaceResult) {
      console.warn("[Migration] ⚠️ Falha ao criar workspace:", company.id);
      return false;
    }

    // Migrate all dashboards with individual error handling
    const dashboardResults: Array<{ success: boolean; dashboardId: string }> = [];
    
    for (const dashboard of company.dashboards) {
      try {
        if (!dashboard || !dashboard.id) {
          console.warn("[Migration] ⚠️ Dashboard inválido ignorado:", {
            companyId: company.id,
            dashboardName: dashboard?.name,
          });
          continue;
        }

        const dashboardDoc = dashboardToDocument(dashboard);
        const result = await db.findOneAndUpdate<DashboardDocument>(
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
          { upsert: true, returnDocument: "after" }
        );

        dashboardResults.push({
          success: !!result,
          dashboardId: dashboard.id,
        });
      } catch (dashboardError) {
        const errorMessage =
          dashboardError instanceof Error
            ? dashboardError.message
            : String(dashboardError);
        console.error("[Migration] ❌ Erro ao migrar dashboard:", {
          companyId: company.id,
          dashboardId: dashboard?.id,
          message: errorMessage,
        });
        dashboardResults.push({
          success: false,
          dashboardId: dashboard?.id || "unknown",
        });
      }
    }

    const successCount = dashboardResults.filter((r) => r.success).length;
    const failureCount = dashboardResults.length - successCount;

    console.log("[Migration] ✅ Company migrada:", {
      companyId: company.id,
      companyName: company.name,
      dashboardsTotal: company.dashboards.length,
      dashboardsSuccess: successCount,
      dashboardsFailed: failureCount,
    });

    // Consider migration successful if at least workspace was created
    return successCount > 0 || company.dashboards.length === 0;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as Error & { code?: number | string }).code;
    console.error("[Migration] ❌ Erro ao migrar company:", {
      companyId: company.id,
      message: errorMessage,
      code: errorCode,
    });
    return false;
  }
}

/**
 * Sync all localStorage data to MongoDB
 * Best practice: Batch processing with error handling per item and progress tracking
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

    if (!Array.isArray(companies)) {
      throw new Error("loadCompaniesWithDashboards returned invalid data");
    }

    console.log("[Migration] 🔄 Iniciando migração de localStorage para MongoDB", {
      companiesCount: companies.length,
      timestamp: new Date().toISOString(),
    });

    // Process companies sequentially to avoid overwhelming MongoDB
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      
      if (!company || !company.id) {
        errors.push(`Invalid company at index ${i}: missing id`);
        continue;
      }

      try {
        const success = await migrateDashboardToMongo(company);
        if (success) {
          companiesMigrated++;
          console.log(`[Migration] ✅ Company ${i + 1}/${companies.length} migrada:`, company.id);
        } else {
          errors.push(`Failed to migrate company ${company.id} (${company.name || "unnamed"})`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorCode = (error as Error & { code?: number | string }).code;
        errors.push(
          `Error migrating company ${company.id}: ${errorMessage}${errorCode ? ` (code: ${errorCode})` : ""}`
        );
        console.error(`[Migration] ❌ Erro ao migrar company ${company.id}:`, {
          message: errorMessage,
          code: errorCode,
        });
      }
    }

    const successRate = companies.length > 0 
      ? ((companiesMigrated / companies.length) * 100).toFixed(1)
      : "0";

    console.log("[Migration] ✅ Migração concluída", {
      companiesTotal: companies.length,
      companiesMigrated,
      companiesFailed: errors.length,
      successRate: `${successRate}%`,
      errorsCount: errors.length,
    });

    return {
      success: errors.length === 0 && companiesMigrated > 0,
      companiesMigrated,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as Error & { code?: number | string }).code;
    console.error("[Migration] ❌ Erro crítico na migração:", {
      message: errorMessage,
      code: errorCode,
    });
    return {
      success: false,
      companiesMigrated,
      errors: [`Critical error: ${errorMessage}${errorCode ? ` (code: ${errorCode})` : ""}`],
    };
  }
}

