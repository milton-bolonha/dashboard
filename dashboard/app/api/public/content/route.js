import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiKey } from "@/lib/api-key-auth";
import { ObjectId } from "mongodb";

/**
 * GET /api/public/content
 * Retorna todos os dados de conteúdo organizados por seções para build do gatsby
 */
export async function GET(request) {
  try {
    const authResult = await requireApiKey(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }

    const apiKey = authResult.key;
    const workspaceId = apiKey.workspaceId;

    const workspaceObjectId = new ObjectId(workspaceId);

    // Buscar todas as sections do workspace que têm acesso público
    const sections = await db.find("sections", {
      workspaceId: workspaceObjectId,
      "publicAccess.isPublic": true,
    });

    // Para cada section, buscar seus items publicados
    const content = await Promise.all(
      sections.map(async (section) => {
        const items = await db.find("items", {
          sectionId: section._id, // CORREÇÃO: Passar como ObjectId
          status: "published",
        });

        // Filtrar apenas os dados públicos dos items
        const publicItems = items.map((item) => ({
          id: item._id,
          title: item.title,
          slug: item.slug,
          data: item.data,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }));

        return {
          slug: section.slug,
          name: section.name,
          description: section.description,
          strategy: section.strategy,
          items: publicItems,
        };
      })
    );

    return NextResponse.json({
      content,
      workspace: {
        id: workspaceId,
        buildTimestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Erro ao buscar dados de conteúdo:", error);
    if (
      error.message.includes(
        "Argument passed in must be a string of 12 bytes or a string of 24 hex characters"
      )
    ) {
      console.error(
        "[API PUBLIC CONTENT] Erro fatal: O workspaceId fornecido pela chave de API é inválido e não pôde ser convertido para ObjectId."
      );
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
