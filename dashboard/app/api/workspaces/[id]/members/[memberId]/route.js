import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { db, getCollection } from "@/lib/db"; // Importar getCollection
import { ObjectId } from "mongodb";

export const DELETE = withAuth(async (req, context, { userId }) => {
  try {
    const { id: workspaceId, memberId } = context.params;

    if (!workspaceId || !memberId) {
      return NextResponse.json(
        { error: "ID do workspace e ID do membro são obrigatórios" },
        { status: 400 }
      );
    }

    const workspaceObjectId = new ObjectId(workspaceId);
    const workspace = await db.findOne("workspaces", {
      _id: workspaceObjectId,
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace não encontrado" },
        { status: 404 }
      );
    }

    // Apenas o proprietário do workspace pode remover membros
    if (workspace.ownerId !== userId) {
      return NextResponse.json(
        { error: "Acesso negado: apenas o proprietário pode remover membros" },
        { status: 403 }
      );
    }

    // O proprietário não pode remover a si mesmo
    if (memberId === userId) {
      return NextResponse.json(
        { error: "O proprietário não pode remover a si mesmo" },
        { status: 400 }
      );
    }

    // Usar getCollection para a operação $pull
    const workspacesCollection = await getCollection("workspaces");
    const result = await workspacesCollection.updateOne(
      { _id: workspaceObjectId },
      {
        $pull: { members: { userId: memberId } },
        $set: { updatedAt: new Date() }, // Atualizar o timestamp
      }
    );

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: "Membro não encontrado no workspace ou já foi removido" },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: "Membro removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover membro do workspace:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
});
