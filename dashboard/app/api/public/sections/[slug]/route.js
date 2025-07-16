import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiKey } from "@/lib/api-key-auth";

/**
 * GET /api/public/sections/{slug}
 * Retorna dados públicos de uma section específica
 */
export async function GET(request, { params }) {
  try {
    const { slug } = params;
    const { searchParams } = new URL(request.url);

    // Verificar se precisa de API key
    const requireKey = searchParams.get("requireKey") === "true";
    let apiKey = null;

    if (requireKey) {
      const authResult = await requireApiKey(request);
      if (authResult.error) {
        return NextResponse.json(
          { error: authResult.error },
          { status: authResult.status }
        );
      }
      apiKey = authResult.key;
    }

    // ✅ CORREÇÃO: Buscar section com isolamento de workspace
    const query = {
      slug,
      "publicAccess.isPublic": true,
      isActive: true,
    };

    // ✅ NOVO: Se API key foi fornecida, filtrar por workspace da chave
    if (apiKey && apiKey.workspaceId) {
      query.workspaceId = apiKey.workspaceId;
    }

    const section = await db.findOne("sections", query);

    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // ✅ NOVO: Verificar se a section pertence ao workspace da API key
    if (
      apiKey &&
      apiKey.workspaceId &&
      section.workspaceId !== apiKey.workspaceId
    ) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Filtrar apenas campos públicos
    const publicData = {
      slug: section.slug,
      title: section.name,
      description: section.description,
      icon: section.icon,
      itemCount: section.itemCount || 0,
      lastUpdated: section.updatedAt,
      createdAt: section.createdAt,
      settings: {
        defaultView: section.settings?.defaultView || "list",
        itemsPerPage: section.settings?.itemsPerPage || 20,
      },
    };

    // Adicionar campos customizados se permitidos
    if (section.publicAccess?.allowedFields?.includes("customFields")) {
      publicData.customFields = section.customFields || {};
    }

    return NextResponse.json(publicData);
  } catch (error) {
    console.error("Erro ao buscar section pública:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
