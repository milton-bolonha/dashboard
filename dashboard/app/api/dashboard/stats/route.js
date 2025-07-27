import { NextResponse } from "next/server";
import { db } from "@/lib/db.js";
import { getAuthenticatedUser } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { logDebug, logError } from "@/lib/logger";

/**
 * Helper para obter workspace atual do usuário
 */
async function getCurrentWorkspace(userId, requestedWorkspaceId = null) {
  try {
    let workspace;

    // Se foi especificado um workspace, usar esse
    if (requestedWorkspaceId) {
      try {
        // ✅ CORREÇÃO: Converter string para ObjectId
        const workspaceObjectId = new ObjectId(requestedWorkspaceId);

        workspace = await db.findOne("workspaces", {
          _id: workspaceObjectId,
          $or: [{ ownerId: userId }, { "members.userId": userId }],
        });

        if (workspace) {
          console.log(
            `🎯 Stats: Usando workspace específico: ${workspace.name} (${workspace._id})`
          );
          return workspace;
        }
      } catch (error) {
        console.log(
          `❌ Stats: Erro ao converter workspaceId para ObjectId: ${requestedWorkspaceId}`,
          error
        );
      }
    }

    // Fallback: buscar qualquer workspace do usuário
    workspace = await db.findOne("workspaces", {
      $or: [{ ownerId: userId }, { "members.userId": userId }],
    });

    if (!workspace) {
      console.log(
        `🔧 Stats: Criando workspace automático para usuário: ${userId}`
      );

      const result = await db.insertOne("workspaces", {
        name: "Meu Workspace",
        slug: `ws-${userId.slice(-8)}-${Date.now()}`,
        ownerId: userId,
        plan: "free",
        members: [{ userId, role: "owner", permissions: { canExport: true } }],
        limits: {
          maxUsers: 1,
          maxContentTypes: 3,
          maxSections: 5,
          maxItems: 100,
        },
        isActive: true,
        createdAt: new Date(),
      });

      workspace = await db.findOne("workspaces", { _id: result.insertedId });
    }

    console.log(
      `🏢 Stats: Workspace selecionado: ${workspace.name} (${workspace._id})`
    );
    return workspace;
  } catch (error) {
    console.error("❌ Stats: Erro ao obter workspace:", error);
    throw error;
  }
}

/**
 * GET /api/dashboard/stats
 * Retorna estatísticas do workspace atual
 */
export async function GET(request) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const { userId } = authResult;

    const requestedWorkspaceId = request.headers.get("x-workspace-id");
    logDebug(
      `Buscando stats para usuário ${userId} e workspace ${requestedWorkspaceId}`
    );

    let workspace;
    if (requestedWorkspaceId) {
      try {
        const workspaceObjectId = new ObjectId(requestedWorkspaceId);
        workspace = await db.findOne("workspaces", {
          _id: workspaceObjectId,
          $or: [{ ownerId: userId }, { "members.userId": userId }],
        });
      } catch (e) {
        logError("ID de workspace inválido fornecido:", requestedWorkspaceId);
      }
    }

    if (!workspace) {
      workspace = await db.findOne("workspaces", {
        $or: [{ ownerId: userId }, { "members.userId": userId }],
      });
    }

    // Se ainda não houver workspace, é um erro, o frontend deveria ter garantido um.
    if (!workspace) {
      logError(
        `Nenhum workspace encontrado para o usuário ${userId}. O frontend deveria ter criado um.`
      );
      return NextResponse.json(
        { error: "Nenhum workspace encontrado para o usuário." },
        { status: 404 }
      );
    }

    logDebug(
      `Calculando stats para o workspace ${workspace.name} (${workspace._id})`
    );

    const [sectionsCount, contentTypesCount, itemsCount] = await Promise.all([
      db.count("sections", {
        workspaceId: workspace._id,
      }),
      db.count("contentTypes", {
        workspaceId: workspace._id,
      }),
      db.count("items", {
        workspaceId: workspace._id,
      }),
    ]);

    const stats = {
      sections: sectionsCount,
      contentTypes: contentTypesCount,
      items: itemsCount,
      workspaceName: workspace.name,
      workspaceId: workspace._id.toString(), // Enviar como string para o frontend
    };

    logDebug(`Stats para workspace ${workspace.name}:`, stats);

    return NextResponse.json(stats);
  } catch (error) {
    logError(
      "Erro ao buscar estatísticas do dashboard:",
      error.message,
      error.stack
    );
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
