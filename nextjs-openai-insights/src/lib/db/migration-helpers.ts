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
 * Security: Only migrates if userId is provided (members only, not guests)
 * Returns false if userId is null (guests should not migrate to MongoDB)
 * Best practice: Validate input and handle errors gracefully
 */
export async function migrateWorkspaceToMongo(
  workspace: WorkspaceSnapshot,
  userId: string | null
): Promise<boolean> {
  // Security: Guests (userId === null) should never migrate to MongoDB
  if (!userId) {
    console.log("[Migration] ⚠️ Tentativa de migrar workspace sem userId (guest), ignorando MongoDB");
    return false;
  }

  // Validate input
  if (!workspace || !workspace.sessionId) {
    console.error("[Migration] ❌ Workspace inválido: sessionId ausente");
    return false;
  }

  try {
    const workspaceDoc = workspaceSnapshotToDocument(workspace);
    
    // Ensure userId is set in the document
    const workspaceDocWithUserId: WorkspaceDocument = {
      ...workspaceDoc,
      userId,
    } as WorkspaceDocument;

    // Upsert workspace with proper error handling (scoped by userId for security)
    const result = await db.findOneAndUpdate<WorkspaceDocument>(
      "workspaces",
      { sessionId: workspace.sessionId, userId }, // Security: Filter by userId
      {
        $set: {
          ...workspaceDocWithUserId,
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
      userId,
      companyName: workspace.company?.name,
    });
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as Error & { code?: number | string }).code;
    console.error("[Migration] ❌ Erro ao migrar workspace:", {
      sessionId: workspace.sessionId,
      userId,
      message: errorMessage,
      code: errorCode,
    });
    return false;
  }
}

/**
 * Migrate a company with dashboards to MongoDB
 * Security: Only migrates if userId is provided (members only, not guests)
 * Returns false if userId is null (guests should not migrate to MongoDB)
 * Best practice: Validate input, handle errors per dashboard, and provide detailed logging
 */
export async function migrateDashboardToMongo(
  company: CompanyWithDashboards,
  userId: string | null
): Promise<boolean> {
  // Security: Guests (userId === null) should never migrate to MongoDB
  if (!userId) {
    console.log("[Migration] ⚠️ Tentativa de migrar company sem userId (guest), ignorando MongoDB");
    return false;
  }

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
    // Create workspace document from company with userId
    const workspaceDoc: WorkspaceDocument = {
      sessionId: company.id,
      userId,
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

    // Upsert workspace with error handling (scoped by userId for security)
    const workspaceResult = await db.findOneAndUpdate<WorkspaceDocument>(
      "workspaces",
      { sessionId: company.id, userId }, // Security: Filter by userId
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
        // Ensure userId is set in dashboard document
        const dashboardDocWithUserId: DashboardDocument = {
          ...dashboardDoc,
          userId,
        } as DashboardDocument;

        const result = await db.findOneAndUpdate<DashboardDocument>(
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
      userId,
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
      userId,
      message: errorMessage,
      code: errorCode,
    });
    return false;
  }
}

/**
 * Migrate guest data (localStorage) to member (MongoDB) after payment confirmation
 * Security: Associates all guest data with the authenticated userId
 * This function is called by the Stripe webhook when payment is confirmed
 * 
 * @param userId - Clerk user ID (required, must be authenticated)
 * @param sessionId - Optional sessionId to migrate specific workspace, or null to migrate all
 * @returns Migration result with success status and details
 */
export async function migrateGuestDataToMember(
  userId: string,
  sessionId?: string | null
): Promise<{
  success: boolean;
  workspacesMigrated: number;
  companiesMigrated: number;
  errors: string[];
}> {
  // Security: userId is required (this function should only be called for authenticated users)
  if (!userId) {
    throw new Error("migrateGuestDataToMember requires userId (must be authenticated)");
  }

  const errors: string[] = [];
  let workspacesMigrated = 0;
  let companiesMigrated = 0;

  try {
    // Load all companies from localStorage
    const companies = loadCompaniesWithDashboards();

    if (!Array.isArray(companies)) {
      throw new Error("loadCompaniesWithDashboards returned invalid data");
    }

    // Filter companies if sessionId is provided
    const companiesToMigrate = sessionId
      ? companies.filter((c) => c.id === sessionId)
      : companies;

    console.log("[Migration] 🔄 Iniciando migração de guest data para member", {
      userId,
      sessionId: sessionId || "all",
      companiesCount: companiesToMigrate.length,
      timestamp: new Date().toISOString(),
    });

    // Process companies sequentially to avoid overwhelming MongoDB
    for (let i = 0; i < companiesToMigrate.length; i++) {
      const company = companiesToMigrate[i];
      
      if (!company || !company.id) {
        errors.push(`Invalid company at index ${i}: missing id`);
        continue;
      }

      try {
        // Migrate company with userId (associates all data with the authenticated user)
        const success = await migrateDashboardToMongo(company, userId);
        if (success) {
          companiesMigrated++;
          workspacesMigrated++; // Each company has one workspace
          console.log(`[Migration] ✅ Company ${i + 1}/${companiesToMigrate.length} migrada para userId ${userId}:`, company.id);
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
          userId,
          message: errorMessage,
          code: errorCode,
        });
      }
    }

    const successRate = companiesToMigrate.length > 0 
      ? ((companiesMigrated / companiesToMigrate.length) * 100).toFixed(1)
      : "0";

    console.log("[Migration] ✅ Migração de guest para member concluída", {
      userId,
      companiesTotal: companiesToMigrate.length,
      companiesMigrated,
      workspacesMigrated,
      companiesFailed: errors.length,
      successRate: `${successRate}%`,
      errorsCount: errors.length,
    });

    return {
      success: errors.length === 0 && companiesMigrated > 0,
      workspacesMigrated,
      companiesMigrated,
      errors,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorCode = (error as Error & { code?: number | string }).code;
    console.error("[Migration] ❌ Erro crítico na migração:", {
      userId,
      message: errorMessage,
      code: errorCode,
    });
    return {
      success: false,
      workspacesMigrated,
      companiesMigrated,
      errors: [`Critical error: ${errorMessage}${errorCode ? ` (code: ${errorCode})` : ""}`],
    };
  }
}

/**
 * Sync all localStorage data to MongoDB (legacy function, kept for backward compatibility)
 * Note: This function does not require userId, so it should not be used for guest-to-member migration
 * Use migrateGuestDataToMember instead for payment confirmation flow
 * Best practice: Batch processing with error handling per item and progress tracking
 */
export async function syncLocalStorageToMongo(): Promise<{
  success: boolean;
  companiesMigrated: number;
  errors: string[];
}> {
  console.warn("[Migration] ⚠️ syncLocalStorageToMongo is deprecated. Use migrateGuestDataToMember with userId instead.");
  
  const errors: string[] = [];
  let companiesMigrated = 0;

  try {
    // Load all companies from localStorage
    const companies = loadCompaniesWithDashboards();

    if (!Array.isArray(companies)) {
      throw new Error("loadCompaniesWithDashboards returned invalid data");
    }

    console.log("[Migration] 🔄 Iniciando migração de localStorage para MongoDB (legacy)", {
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
        // Legacy: migrate without userId (will fail due to security checks)
        const success = await migrateDashboardToMongo(company, null);
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

