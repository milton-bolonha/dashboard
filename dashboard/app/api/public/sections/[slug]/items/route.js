import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiKey } from "@/lib/api-key-auth";

/**
 * GET /api/public/sections/{slug}/items
 * Lista items públicos de uma section
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

    // Parâmetros de paginação e filtros
    const limit = parseInt(searchParams.get("limit")) || 20;
    const offset = parseInt(searchParams.get("offset")) || 0;
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const search = searchParams.get("search") || "";

    // ✅ CORREÇÃO: Query otimizada para items
    const query = {
      sectionId: section._id,
      isActive: true,
    };

    // Adicionar busca se especificada
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // ✅ OTIMIZAÇÃO: Executar queries em paralelo
    const [items, total] = await Promise.all([
      db.find("items", query, {
        sort: { [sortBy]: sortOrder === "desc" ? -1 : 1 },
        limit,
        skip: offset,
      }),
      db.count("items", query),
    ]);

    // Filtrar apenas campos públicos
    const publicItems = items.map((item) => {
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

      return publicItem;
    });

    return NextResponse.json({
      items: publicItems,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
      section: {
        slug: section.slug,
        title: section.name,
        description: section.description,
      },
    });
  } catch (error) {
    console.error("Erro ao listar items públicos:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
