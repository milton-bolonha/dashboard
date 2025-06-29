import { NextResponse } from "next/server";
import { db } from "@/lib/db.js";
import { getCurrentAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";

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
    const authData = await getCurrentAuth();
    const userId = authData.userId || "temp_user_dev";

    // Obter workspace ID do header (enviado pelo frontend)
    const workspaceId = request.headers.get("x-workspace-id");

    console.log("🔐 Stats GET: userId =", userId);
    console.log("🏢 Stats: Workspace solicitado:", workspaceId);

    // Obter workspace atual (específico ou fallback)
    const workspace = await getCurrentWorkspace(userId, workspaceId);

    // Contar documentos usando o método mais eficiente `count`
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
      workspaceId: workspace._id,
    };

    console.log(`✅ Stats para workspace ${workspace.name}:`, stats);

    return NextResponse.json(stats);
  } catch (error) {
    console.warn(
      "Could not connect to DB for stats, returning 0.",
      error.message
    );
    // Se o DB não estiver conectado, retorne 0 em vez de erro.
    const stats = {
      sections: 0,
      contentTypes: 0,
      items: 0,
      workspaceName: "Desconhecido",
      workspaceId: null,
    };
    return NextResponse.json(stats);
  }
}
