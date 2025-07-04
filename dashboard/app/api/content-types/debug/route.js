import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkSuperAdmin } from "@/lib/auth";
import { logDebug, logError } from "@/lib/logger";

/**
 * GET /api/content-types/debug
 * API de depuração para administradores.
 */
export async function GET() {
  try {
    const authCheck = await checkSuperAdmin();
    if (authCheck.error) {
      return NextResponse.json(
        { error: authCheck.error },
        { status: authCheck.status }
      );
    }

    logDebug("Tentando buscar ALL content-types no MongoDB...");

    const contentTypes = await db.find("contentTypes", {});

    logDebug(
      `MongoDB conectado! Encontrados ${contentTypes.length} content-types TOTAL`
    );
    return NextResponse.json({
      contentTypes,
      debug: {
        total: contentTypes.length,
        message: "API de depuração executada com sucesso.",
      },
    });
  } catch (error) {
    logError("Falha ao buscar content-types na rota de debug:", error.message);
    return NextResponse.json(
      {
        error: "Internal server error ao buscar content types para debug.",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
