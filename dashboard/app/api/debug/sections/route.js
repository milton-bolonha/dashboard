import { NextResponse } from "next/server";
import { db } from "@/lib/db.js";
import { getCurrentAuth } from "@/lib/auth";

/**
 * GET /api/debug/sections
 * Lista TODAS as sections do usuário (sem filtro de workspace) para debug
 */
export async function GET() {
  try {
    const authData = await getCurrentAuth();
    const userId = authData.userId || "temp_user_dev";

    console.log("🔍 DEBUG: Buscando TODAS as sections do usuário:", userId);

    // Buscar TODAS as sections do usuário, independente do workspace
    const sections = await db.find("sections", {
      userId: userId,
    });

    console.log(`🔍 DEBUG: Encontradas ${sections.length} sections:`);
    sections.forEach((section, index) => {
      console.log(
        `  ${index + 1}. ${section.name} - workspaceId: ${
          section.workspaceId || "UNDEFINED"
        }`
      );
    });

    return NextResponse.json({
      sections,
      debug: {
        userId,
        totalSections: sections.length,
        sectionsWithWorkspace: sections.filter((s) => s.workspaceId).length,
        sectionsWithoutWorkspace: sections.filter((s) => !s.workspaceId).length,
      },
    });
  } catch (error) {
    console.error("❌ DEBUG: Erro ao buscar sections:", error);
    return NextResponse.json(
      { error: "Failed to load sections", details: error.message },
      { status: 500 }
    );
  }
}
