import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";

/**
 * DELETE /api/workspaces/[id]
 * Deleta um workspace e todos os seus dados associados (em cascata).
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { userId } = await getCurrentAuth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid Workspace ID" },
        { status: 400 }
      );
    }

    const workspaceId = new ObjectId(id);

    // 1. Verificar se o workspace existe e se o usuário é o dono
    const workspace = await db.findOne("workspaces", {
      _id: workspaceId,
      ownerId: userId,
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found or you are not the owner" },
        { status: 404 }
      );
    }

    console.log(`🗑️ Iniciando deleção do workspace: ${workspace.name} (${id})`);

    // 2. Deleção em cascata
    // Deletar Items
    const itemsResult = await db.deleteMany("items", { workspaceId });
    console.log(`   - Deletados ${itemsResult.deletedCount} items.`);

    // Deletar Sections
    const sectionsResult = await db.deleteMany("sections", { workspaceId });
    console.log(`   - Deletadas ${sectionsResult.deletedCount} sections.`);

    // Deletar Content Types
    const contentTypesResult = await db.deleteMany("contentTypes", {
      workspaceId,
    });
    console.log(
      `   - Deletados ${contentTypesResult.deletedCount} content types.`
    );

    // 3. Deletar o Workspace
    const workspaceResult = await db.deleteOne("workspaces", {
      _id: workspaceId,
    });
    console.log(`   - Deletado ${workspaceResult.deletedCount} workspace.`);

    if (workspaceResult.deletedCount === 0) {
      // Isso não deve acontecer se a verificação inicial passou
      throw new Error("Falha ao deletar o documento do workspace.");
    }

    return NextResponse.json({
      message: "Workspace and all associated data deleted successfully.",
      details: {
        deletedItems: itemsResult.deletedCount,
        deletedSections: sectionsResult.deletedCount,
        deletedContentTypes: contentTypesResult.deletedCount,
      },
    });
  } catch (error) {
    console.error("Error deleting workspace:", error);
    return NextResponse.json(
      { error: "Failed to delete workspace" },
      { status: 500 }
    );
  }
}
