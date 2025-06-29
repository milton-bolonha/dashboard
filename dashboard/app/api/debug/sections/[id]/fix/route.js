import { NextResponse } from "next/server";
import { db } from "@/lib/db.js";
import { getCurrentAuth } from "@/lib/auth";

/**
 * POST /api/debug/sections/[id]/fix
 * Corrige uma section adicionando workspaceId
 */
export async function POST(request, { params }) {
  try {
    const authData = await getCurrentAuth();
    const userId = authData.userId || "temp_user_dev";
    const sectionId = params.id;
    const { workspaceId } = await request.json();

    console.log(
      `🔧 DEBUG: Corrigindo section ${sectionId} para workspace ${workspaceId}`
    );

    // Verificar se a section existe e pertence ao usuário
    const section = await db.findOne("sections", {
      _id: sectionId,
      userId: userId,
    });

    if (!section) {
      return NextResponse.json(
        { error: "Section not found or not authorized" },
        { status: 404 }
      );
    }

    // Verificar se o workspace existe e pertence ao usuário
    const workspace = await db.findOne("workspaces", {
      _id: workspaceId,
      $or: [{ ownerId: userId }, { "members.userId": userId }],
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found or not authorized" },
        { status: 404 }
      );
    }

    // Atualizar a section com o workspaceId
    const result = await db.updateOne(
      "sections",
      { _id: sectionId },
      {
        workspaceId: workspaceId,
        updatedAt: new Date(),
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Failed to update section" },
        { status: 500 }
      );
    }

    console.log(
      `✅ DEBUG: Section ${section.name} corrigida com workspace ${workspace.name}`
    );

    return NextResponse.json({
      success: true,
      message: `Section "${section.name}" corrigida para workspace "${workspace.name}"`,
      section: {
        id: sectionId,
        name: section.name,
        workspaceId: workspaceId,
        workspaceName: workspace.name,
      },
    });
  } catch (error) {
    console.error("❌ DEBUG: Erro ao corrigir section:", error);
    return NextResponse.json(
      { error: "Failed to fix section", details: error.message },
      { status: 500 }
    );
  }
}
