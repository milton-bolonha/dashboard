import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";

/**
 * GET /api/debug/check-orphaned-data
 * Verifica e lista dados órfãos
 */
export async function GET(request) {
  try {
    const { userId } = await getCurrentAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar content types órfãos
    const orphanedContentTypes = await db.find("contentTypes", {
      workspaceId: { $exists: false },
    });

    // Verificar sections órfãs
    const orphanedSections = await db.find("sections", {
      workspaceId: { $exists: false },
    });

    // Verificar items órfãos
    const orphanedItems = await db.find("items", {
      workspaceId: { $exists: false },
    });

    // Verificar sections sem content type
    const sectionsWithoutContentType = await db.find("sections", {
      contentTypeId: { $exists: false },
    });

    return NextResponse.json({
      orphanedContentTypes: orphanedContentTypes.length,
      orphanedSections: orphanedSections.length,
      orphanedItems: orphanedItems.length,
      sectionsWithoutContentType: sectionsWithoutContentType.length,
      details: {
        orphanedContentTypes: orphanedContentTypes.map((ct) => ({
          id: ct._id,
          name: ct.name,
        })),
        orphanedSections: orphanedSections.map((s) => ({
          id: s._id,
          name: s.name,
        })),
        orphanedItems: orphanedItems.map((i) => ({ id: i._id, name: i.name })),
        sectionsWithoutContentType: sectionsWithoutContentType.map((s) => ({
          id: s._id,
          name: s.name,
        })),
      },
    });
  } catch (error) {
    console.error("Erro ao verificar dados órfãos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/debug/check-orphaned-data
 * Limpa dados órfãos
 */
export async function DELETE(request) {
  try {
    const { userId } = await getCurrentAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Deletar content types órfãos
    const contentTypesResult = await db.deleteMany("contentTypes", {
      workspaceId: { $exists: false },
    });

    // Deletar sections órfãs
    const sectionsResult = await db.deleteMany("sections", {
      workspaceId: { $exists: false },
    });

    // Deletar items órfãos
    const itemsResult = await db.deleteMany("items", {
      workspaceId: { $exists: false },
    });

    return NextResponse.json({
      message: "Dados órfãos removidos",
      deleted: {
        contentTypes: contentTypesResult.deletedCount,
        sections: sectionsResult.deletedCount,
        items: itemsResult.deletedCount,
      },
    });
  } catch (error) {
    console.error("Erro ao limpar dados órfãos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
