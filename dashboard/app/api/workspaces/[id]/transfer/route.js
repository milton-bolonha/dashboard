import { NextResponse } from "next/server";
import { createClerkClient } from "@clerk/nextjs/server";
import { withAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";

export const POST = withAuth(
  async (req, context, { userId: currentOwnerId }) => {
    try {
      const { id: workspaceId } = context.params;
      const body = await req.json();
      const {
        newOwnerEmail,
        newOwnerId: newOwnerIdFromInput,
        isHack = false,
      } = body;

      if (!workspaceId) {
        return NextResponse.json(
          { error: "ID do workspace é obrigatório" },
          { status: 400 }
        );
      }

      if (!newOwnerEmail && !newOwnerIdFromInput) {
        return NextResponse.json(
          {
            error:
              "É necessário fornecer o e-mail ou o ID do novo proprietário",
          },
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

      if (workspace.ownerId !== currentOwnerId) {
        return NextResponse.json(
          { error: "Apenas o proprietário atual pode transferir o workspace" },
          { status: 403 }
        );
      }

      let newOwnerId;

      if (isHack && newOwnerIdFromInput) {
        console.log("HACK ATIVADO: Pulando verificação do Clerk.");
        newOwnerId = newOwnerIdFromInput;
      } else {
        const clerkClient = createClerkClient({
          secretKey: process.env.CLERK_SECRET_KEY,
        });
        let newOwner;
        if (newOwnerIdFromInput) {
          try {
            newOwner = await clerkClient.users.getUser(newOwnerIdFromInput);
          } catch (error) {
            console.error(
              "Erro ao buscar usuário do Clerk por ID:",
              error.message
            );
            return NextResponse.json(
              { error: "Usuário de destino não encontrado com o ID fornecido" },
              { status: 404 }
            );
          }
        } else if (newOwnerEmail) {
          const users = await clerkClient.users.getUserList({
            emailAddress: [newOwnerEmail],
          });
          if (users && users.data.length > 0) {
            newOwner = users.data[0];
          } else {
            return NextResponse.json(
              {
                error:
                  "Usuário de destino não encontrado com o e-mail fornecido",
              },
              { status: 404 }
            );
          }
        }
        newOwnerId = newOwner.id;
      }

      if (newOwnerId === currentOwnerId) {
        return NextResponse.json(
          { error: "Você não pode transferir a propriedade para si mesmo" },
          { status: 400 }
        );
      }

      const oldOwnerMemberIndex = workspace.members.findIndex(
        (member) => member.userId === currentOwnerId
      );
      if (oldOwnerMemberIndex !== -1) {
        workspace.members[oldOwnerMemberIndex].role = "admin";
      }

      const newOwnerMemberIndex = workspace.members.findIndex(
        (member) => member.userId === newOwnerId
      );

      if (newOwnerMemberIndex !== -1) {
        workspace.members[newOwnerMemberIndex].role = "owner";
      } else {
        workspace.members.push({
          userId: newOwnerId,
          role: "owner",
          joinedAt: new Date(),
        });
      }

      const updatedWorkspaceData = {
        ...workspace,
        ownerId: newOwnerId,
      };
      delete updatedWorkspaceData._id;

      await db.updateOne(
        "workspaces",
        { _id: workspaceObjectId },
        updatedWorkspaceData // CORREÇÃO: Passando o objeto de atualização diretamente
      );

      const finalWorkspace = await db.findOne("workspaces", {
        _id: workspaceObjectId,
      });

      return NextResponse.json(finalWorkspace);
    } catch (error) {
      console.error("Erro ao transferir propriedade do workspace:", error);
      return NextResponse.json(
        { error: "Erro interno do servidor" },
        { status: 500 }
      );
    }
  }
);
