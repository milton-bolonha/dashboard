import { NextResponse } from "next/server";
import { syncLocalStorageToMongo } from "@/lib/db/migration-helpers";

/**
 * POST /api/migrate
 * Migrates data from localStorage to MongoDB
 */
export async function POST() {
  try {
    console.log("[API] /api/migrate - Iniciando migração de localStorage para MongoDB");

    const result = await syncLocalStorageToMongo();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: "Migration completed successfully",
        companiesMigrated: result.companiesMigrated,
        errors: result.errors,
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          message: "Migration completed with errors",
          companiesMigrated: result.companiesMigrated,
          errors: result.errors,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[API] /api/migrate - Erro crítico na migração:", errorMessage);
    return NextResponse.json(
      {
        success: false,
        message: "Migration failed",
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}

