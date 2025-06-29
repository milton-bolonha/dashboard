import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAuth } from "@/lib/auth";

/**
 * GET /api/debug/real-analysis
 * Análise SEM FILTROS dos dados reais no banco
 */
export async function GET(request) {
  try {
    const authData = await getCurrentAuth();
    const userId = authData.userId || "temp_user_dev";

    console.log("🔍 ANÁLISE REAL - SEM FILTROS para usuário:", userId);

    // TODAS as coleções SEM filtro de workspace
    const [allWorkspaces, allContentTypes, allSections, allItems] =
      await Promise.all([
        db.find("workspaces", { ownerId: userId }),
        db.find("contentTypes", { userId: userId }),
        db.find("sections", { userId: userId }),
        db.find("items", { userId: userId }),
      ]);

    // Análise detalhada
    const analysis = {
      timestamp: new Date().toISOString(),
      userId: userId,

      workspaces: {
        total: allWorkspaces.length,
        data: allWorkspaces.map((ws) => ({
          id: ws._id?.toString(),
          name: ws.name,
          slug: ws.slug,
          ownerId: ws.ownerId,
        })),
      },

      contentTypes: {
        total: allContentTypes.length,
        withWorkspaceId: allContentTypes.filter((ct) => ct.workspaceId).length,
        withoutWorkspaceId: allContentTypes.filter((ct) => !ct.workspaceId)
          .length,
        data: allContentTypes.map((ct) => ({
          id: ct._id?.toString(),
          name: ct.name,
          slug: ct.slug,
          workspaceId: ct.workspaceId?.toString() || "❌ MISSING",
          hasWorkspaceId: !!ct.workspaceId,
        })),
      },

      sections: {
        total: allSections.length,
        withWorkspaceId: allSections.filter((s) => s.workspaceId).length,
        withoutWorkspaceId: allSections.filter((s) => !s.workspaceId).length,
        data: allSections.map((s) => ({
          id: s._id?.toString(),
          name: s.name,
          slug: s.slug,
          contentTypeId: s.contentTypeId,
          workspaceId: s.workspaceId?.toString() || "❌ MISSING",
          hasWorkspaceId: !!s.workspaceId,
        })),
      },

      items: {
        total: allItems.length,
        withWorkspaceId: allItems.filter((i) => i.workspaceId).length,
        withoutWorkspaceId: allItems.filter((i) => !i.workspaceId).length,
      },

      // Verificar se há dados problemáticos
      problems: {
        contentTypesWithoutWorkspace: allContentTypes.filter(
          (ct) => !ct.workspaceId
        ).length,
        sectionsWithoutWorkspace: allSections.filter((s) => !s.workspaceId)
          .length,
        itemsWithoutWorkspace: allItems.filter((i) => !i.workspaceId).length,
      },
    };

    console.log("✅ ANÁLISE REAL COMPLETA:", analysis);

    return NextResponse.json({
      status: "success",
      analysis,
      rawData: {
        workspaces: allWorkspaces,
        contentTypes: allContentTypes,
        sections: allSections,
        items: allItems.slice(0, 5), // Apenas os primeiros 5 items para não sobrecarregar
      },
    });
  } catch (error) {
    console.error("❌ Erro na análise real:", error);
    return NextResponse.json(
      { error: "Falha na análise", details: error.message },
      { status: 500 }
    );
  }
}
