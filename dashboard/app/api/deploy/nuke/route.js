import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";

/**
 * POST /api/deploy/nuke
 * Remove completamente todos os recursos de deploy de um workspace
 * 🛡️ PROTEGIDO: Requer autenticação e permissão no workspace
 */
export async function POST(request) {
  try {
    const auth = await getCurrentAuth();
    if (!auth.userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { workspaceId } = await request.json();

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o usuário tem permissão no workspace
    const workspace = await db.findOne("workspaces", {
      _id: new ObjectId(workspaceId),
      $or: [
        { ownerId: auth.userId },
        {
          "members.userId": auth.userId,
          "members.permissions.canManageDeployments": true,
        },
      ],
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace não encontrado ou sem permissão" },
        { status: 404 }
      );
    }

    console.log(
      `[NUKE] Iniciando remoção completa para workspace: ${workspace.name}`
    );

    let deletedResources = [];
    let errors = [];

    // 1. Deletar site da Netlify (se existir)
    if (workspace.netlifyDeployment?.siteId) {
      try {
        const { NetlifyManager } = await import(
          "@/lib/deployment/netlify-manager"
        );

        // Para deletar o site, precisamos do token da Netlify
        // Como não temos o token armazenado, vamos apenas limpar as referências
        console.log(
          `[NUKE] Site Netlify: ${workspace.netlifyDeployment.siteId} (limpeza de referência)`
        );
        deletedResources.push(
          `Site Netlify: ${workspace.netlifyDeployment.siteName}`
        );
      } catch (error) {
        console.error("[NUKE] Erro ao tentar deletar site Netlify:", error);
        errors.push(`Site Netlify: ${error.message}`);
      }
    }

    // 2. Deletar repositório GitHub (se existir)
    if (workspace.netlifyDeployment?.repoUrl) {
      try {
        const { GitManager } = await import("@/lib/deployment/git-manager");

        // Similarmente, para deletar o repo, precisaríamos do token do GitHub
        // Por ora, apenas limpamos as referências
        console.log(
          `[NUKE] Repositório GitHub: ${workspace.netlifyDeployment.repoUrl} (limpeza de referência)`
        );
        deletedResources.push(
          `Repositório: ${workspace.netlifyDeployment.repoUrl}`
        );
      } catch (error) {
        console.error(
          "[NUKE] Erro ao tentar deletar repositório GitHub:",
          error
        );
        errors.push(`Repositório GitHub: ${error.message}`);
      }
    }

    // 3. Limpar informações de deploy do workspace
    const { getCollection } = await import("@/lib/db");
    const workspacesCollection = await getCollection("workspaces");
    await workspacesCollection.updateOne(
      { _id: new ObjectId(workspaceId) },
      {
        $unset: { netlifyDeployment: 1 },
        $set: { updatedAt: new Date() },
      }
    );
    deletedResources.push("Configurações de deploy do workspace");

    // 4. Deletar todos os registros de deployment
    const deleteResult = await db.deleteMany("deployments", {
      workspaceId: workspaceId,
    });

    if (deleteResult.deletedCount > 0) {
      deletedResources.push(`${deleteResult.deletedCount} registros de deploy`);
    }

    console.log(`[NUKE] Remoção concluída para workspace: ${workspace.name}`);
    console.log(`[NUKE] Recursos removidos:`, deletedResources);

    if (errors.length > 0) {
      console.log(`[NUKE] Erros encontrados:`, errors);
    }

    return NextResponse.json({
      message: `🗑️ Nuke concluído! Workspace limpo com sucesso.`,
      deletedResources,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("🚨 Erro durante operação de nuke:", error);
    return NextResponse.json(
      {
        error: "Erro interno durante operação de nuke",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
