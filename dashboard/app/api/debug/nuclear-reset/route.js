import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const { userId } = await getCurrentAuth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // Por segurança, só permitir em ambiente de desenvolvimento
    if (process.env.NODE_ENV !== "development") {
      return NextResponse.json(
        {
          error: "Esta operação só é permitida em ambiente de desenvolvimento.",
        },
        { status: 403 }
      );
    }

    const { workspaceId } = await request.json();
    if (!workspaceId) {
      return NextResponse.json(
        { error: "ID do Workspace é obrigatório" },
        { status: 400 }
      );
    }

    const workspaceObjectId = new ObjectId(workspaceId);

    // Validação extra: o usuário pertence ao workspace?
    const workspace = await db.findOne("workspaces", {
      _id: workspaceObjectId,
      "members.userId": userId,
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace não encontrado ou acesso negado." },
        { status: 404 }
      );
    }

    // Executar a limpeza
    const itemsDeleted = await db.deleteMany("items", {
      workspaceId: workspaceObjectId,
    });
    const sectionsDeleted = await db.deleteMany("sections", {
      workspaceId: workspaceObjectId,
    });
    const contentTypesDeleted = await db.deleteMany("contentTypes", {
      workspaceId: workspaceObjectId,
    });

    const message = `Limpeza concluída para o workspace ${workspace.name} (${workspaceId}):\n- ${itemsDeleted.deletedCount} Itens deletados\n- ${sectionsDeleted.deletedCount} Seções deletadas\n- ${contentTypesDeleted.deletedCount} Content Types deletados`;

    console.log(`☢️ NUCLEAR RESET EXECUTADO: ${message}`);

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("Erro no Nuclear Reset:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor", details: error.message },
      { status: 500 }
    );
  }
}
