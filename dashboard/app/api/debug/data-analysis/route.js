import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAuth } from "@/lib/auth";

/**
 * GET /api/debug/data-analysis
 * Análise completa dos dados para identificar inconsistências
 */
export async function GET(request) {
  try {
    const authData = await getCurrentAuth();
    const userId = authData.userId || "temp_user_dev";

    console.log("🔍 ANÁLISE COMPLETA DOS DADOS para usuário:", userId);

    // 1. Analisar Workspaces
    const workspaces = await db.find("workspaces", {
      $or: [{ ownerId: userId }, { "members.userId": userId }],
    });

    // 2. Analisar Content Types (TODOS)
    const allContentTypes = await db.find("contentTypes", { userId: userId });
    const contentTypesWithWorkspace = allContentTypes.filter(
      (ct) => ct.workspaceId
    );
    const contentTypesWithoutWorkspace = allContentTypes.filter(
      (ct) => !ct.workspaceId
    );

    // 3. Analisar Sections (TODAS)
    const allSections = await db.find("sections", { userId: userId });
    const sectionsWithWorkspace = allSections.filter((s) => s.workspaceId);
    const sectionsWithoutWorkspace = allSections.filter((s) => !s.workspaceId);

    // 4. Analisar Items (TODOS)
    const allItems = await db.find("items", { userId: userId });
    const itemsWithWorkspace = allItems.filter((i) => i.workspaceId);
    const itemsWithoutWorkspace = allItems.filter((i) => !i.workspaceId);

    // 5. Análise de Consistência
    const analysis = {
      timestamp: new Date().toISOString(),
      userId: userId,

      workspaces: {
        total: workspaces.length,
        list: workspaces.map((ws) => ({
          id: ws._id,
          name: ws.name,
          slug: ws.slug,
          ownerId: ws.ownerId,
        })),
      },

      contentTypes: {
        total: allContentTypes.length,
        withWorkspace: contentTypesWithWorkspace.length,
        withoutWorkspace: contentTypesWithoutWorkspace.length,
        orphaned: contentTypesWithoutWorkspace.map((ct) => ({
          id: ct._id,
          name: ct.name,
          slug: ct.slug,
          workspaceId: ct.workspaceId || "❌ MISSING",
        })),
      },

      sections: {
        total: allSections.length,
        withWorkspace: sectionsWithWorkspace.length,
        withoutWorkspace: sectionsWithoutWorkspace.length,
        orphaned: sectionsWithoutWorkspace.map((s) => ({
          id: s._id,
          name: s.name,
          slug: s.slug,
          contentTypeId: s.contentTypeId,
          workspaceId: s.workspaceId || "❌ MISSING",
        })),
      },

      items: {
        total: allItems.length,
        withWorkspace: itemsWithWorkspace.length,
        withoutWorkspace: itemsWithoutWorkspace.length,
      },

      // Análise de relacionamentos quebrados
      brokenRelationships: {
        sectionsWithInvalidContentType: [],
        itemsWithInvalidSection: [],
      },
    };

    // Verificar sections com contentTypeId inválido
    for (const section of allSections) {
      const contentType = allContentTypes.find(
        (ct) => ct._id.toString() === section.contentTypeId
      );
      if (!contentType) {
        analysis.brokenRelationships.sectionsWithInvalidContentType.push({
          sectionId: section._id,
          sectionName: section.name,
          invalidContentTypeId: section.contentTypeId,
        });
      }
    }

    console.log("✅ ANÁLISE COMPLETA:", analysis);

    return NextResponse.json({
      status: "success",
      analysis,
      recommendations: [
        contentTypesWithoutWorkspace.length > 0
          ? "❌ Migrar content types órfãos"
          : "✅ Content types OK",
        sectionsWithoutWorkspace.length > 0
          ? "❌ Migrar sections órfãs"
          : "✅ Sections OK",
        analysis.brokenRelationships.sectionsWithInvalidContentType.length > 0
          ? "❌ Corrigir relacionamentos quebrados"
          : "✅ Relacionamentos OK",
        workspaces.length === 0
          ? "❌ Criar workspace inicial"
          : "✅ Workspaces OK",
      ],
    });
  } catch (error) {
    console.error("❌ Erro na análise:", error);
    return NextResponse.json(
      { error: "Falha na análise", details: error.message },
      { status: 500 }
    );
  }
}
