import { NextResponse } from "next/server";
import { createClerkClient } from "@clerk/nextjs/server";
import { withAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";

export const GET = withAuth(async (req, context, { userId }) => {
  try {
    const { id: workspaceId } = context.params;

    if (!workspaceId) {
      return NextResponse.json(
        { error: "ID do workspace é obrigatório" },
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

    const isMember = workspace.members.some(
      (member) => member.userId === userId
    );
    if (!isMember) {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 });
    }

    const memberUserIds = workspace.members.map((member) => member.userId);

    const clerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    const clerkUsers = await clerkClient.users.getUserList({
      userId: memberUserIds,
      limit: memberUserIds.length,
    });

    const clerkUsersMap = new Map(
      clerkUsers.data.map((user) => [user.id, user])
    );

    const enrichedMembers = workspace.members.map((member) => {
      const clerkUser = clerkUsersMap.get(member.userId);
      return {
        ...member,
        email: clerkUser?.emailAddresses[0]?.emailAddress || "N/A",
        name: clerkUser
          ? `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim()
          : "Usuário Desconhecido",
        imageUrl: clerkUser?.imageUrl || "",
      };
    });

    return NextResponse.json({ members: enrichedMembers });
  } catch (error) {
    console.error("Erro ao listar membros do workspace:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
});
