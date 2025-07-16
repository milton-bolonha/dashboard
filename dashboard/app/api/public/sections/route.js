import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * GET /api/public/sections
 * Lista todas as sections públicas
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit")) || 50;
    const offset = parseInt(searchParams.get("offset")) || 0;

    // Buscar sections públicas
    const sections = await db.find("sections", {
      "publicAccess.isPublic": true,
      isActive: true,
    });

    // Filtrar apenas dados públicos
    const publicSections = sections.map((section) => ({
      slug: section.slug,
      title: section.name,
      description: section.description,
      icon: section.icon,
      itemCount: section.itemCount || 0,
      lastUpdated: section.updatedAt,
      createdAt: section.createdAt,
    }));

    // Paginação
    const paginatedSections = publicSections.slice(offset, offset + limit);

    return NextResponse.json({
      sections: paginatedSections,
      pagination: {
        total: publicSections.length,
        limit,
        offset,
        hasMore: offset + limit < publicSections.length,
      },
    });
  } catch (error) {
    console.error("Erro ao listar sections públicas:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
