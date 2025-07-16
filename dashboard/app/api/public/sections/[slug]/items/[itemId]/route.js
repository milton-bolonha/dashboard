import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiKey } from "@/lib/api-key-auth";
import { ObjectId } from "mongodb";

/**
 * GET /api/public/sections/{slug}/items/{itemId}
 * Retorna dados públicos de um item específico
 */
export async function GET(request, { params }) {
  try {
    const { slug, itemId } = params;
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
    const sectionQuery = {
      slug,
      "publicAccess.isPublic": true,
      isActive: true,
    };

    // ✅ NOVO: Se API key foi fornecida, filtrar por workspace da chave
    if (apiKey && apiKey.workspaceId) {
      sectionQuery.workspaceId = apiKey.workspaceId;
    }

    const section = await db.findOne("sections", sectionQuery);

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

    // Buscar item
    const item = await db.findOne("items", {
      _id: new ObjectId(itemId),
      sectionId: section._id,
      isActive: true,
    });

    if (!item) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // Filtrar apenas campos públicos
    const publicItem = {
      id: item._id,
      title: item.title,
      description: item.description,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };

    // Adicionar campos customizados se permitidos
    if (section.publicAccess?.allowedFields?.includes("customFields")) {
      publicItem.customFields = item.customFields || {};
    }

    // Adicionar metadados se permitidos
    if (section.publicAccess?.allowedFields?.includes("metadata")) {
      publicItem.metadata = item.metadata || {};
    }

    // Adicionar dados de relacionamento se permitidos
    if (section.publicAccess?.allowedFields?.includes("relationships")) {
      publicItem.relationships = item.relationships || {};
    }

    return NextResponse.json({
      item: publicItem,
      section: {
        slug: section.slug,
        title: section.name,
        description: section.description,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar item público:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
