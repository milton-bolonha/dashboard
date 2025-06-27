import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/content-types/debug
 * API temporária para debug - SEM AUTENTICAÇÃO
 */
export async function GET() {
  try {
    console.log("🔍 DEBUG: Tentando buscar ALL content-types no MongoDB...");

    const contentTypes = await db.find("contentTypes", {});

    console.log(
      `✅ DEBUG: MongoDB conectado! Encontrados ${contentTypes.length} content-types TOTAL`
    );
    return NextResponse.json({
      contentTypes,
      debug: {
        total: contentTypes.length,
        message: "API debug sem autenticação funcionando",
      },
    });
  } catch (error) {
    console.warn(
      "⚠️ DEBUG: Could not connect to DB, using fallback data.",
      error.message
    );

    // FALLBACK: Content Types mock para teste
    const mockContentTypes = [
      {
        _id: "debug1",
        name: "Debug Página",
        slug: "debug-pagina",
        description: "Content type de debug",
        addons: [],
        isActive: true,
        createdAt: new Date(),
      },
      {
        _id: "debug2",
        name: "Debug Artigo",
        slug: "debug-artigo",
        description: "Content type de debug",
        addons: [],
        isActive: true,
        createdAt: new Date(),
      },
    ];

    console.log(
      `🔄 DEBUG: Retornando ${mockContentTypes.length} content-types mock`
    );
    return NextResponse.json({
      contentTypes: mockContentTypes,
      debug: {
        total: mockContentTypes.length,
        message: "Usando dados mock - MongoDB não disponível",
        error: error.message,
      },
    });
  }
}
