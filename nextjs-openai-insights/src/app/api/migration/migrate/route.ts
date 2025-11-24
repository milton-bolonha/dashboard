import { NextResponse } from "next/server";
import { migrateGuestDataToMember } from "@/lib/db/migration-helpers";
import type { CompanyWithDashboards } from "@/lib/types/dashboard";
import { currentUser } from "@clerk/nextjs/server";

/**
 * POST /api/migration/migrate
 *
 * Migra dados do localStorage para MongoDB após pagamento confirmado.
 * Deve ser chamado do CLIENTE após onboarding completo.
 *
 * Body: { companiesData?: CompanyWithDashboards[] }
 * - Se companiesData não for fornecido, tentará carregar do localStorage (só funciona no cliente)
 */
export async function POST(request: Request) {
  try {
    // Verificar autenticação Clerk
    const clerkUser = await currentUser();

    if (!clerkUser) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userId = clerkUser.id;
    const body = await request.json();
    const { companiesData, sessionId } = body;

    console.log("[Migration API] 🔄 Starting migration", {
      userId,
      hasCompaniesData: !!companiesData,
      companiesCount: companiesData?.length || 0,
      sessionId,
    });

    // Chamar função de migração com dados do cliente
    const migrationResult = await migrateGuestDataToMember(
      userId,
      sessionId || undefined,
      companiesData // Passar dados do cliente
    );

    if (migrationResult.success) {
      console.log("[Migration API] ✅ Migration completed:", {
        userId,
        workspacesMigrated: migrationResult.workspacesMigrated,
        companiesMigrated: migrationResult.companiesMigrated,
      });

      return NextResponse.json({
        success: true,
        message: "Migration completed successfully",
        workspacesMigrated: migrationResult.workspacesMigrated,
        companiesMigrated: migrationResult.companiesMigrated,
        errors: migrationResult.errors,
      });
    } else {
      console.error("[Migration API] ⚠️ Migration partially failed:", {
        userId,
        errors: migrationResult.errors,
      });

      return NextResponse.json(
        {
          success: false,
          message: "Migration completed with errors",
          workspacesMigrated: migrationResult.workspacesMigrated,
          companiesMigrated: migrationResult.companiesMigrated,
          errors: migrationResult.errors,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Migration API] ❌ Critical error:", errorMessage);

    return NextResponse.json(
      {
        success: false,
        error: "Migration failed",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
