import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth";
import { checkRateLimit, sanitizeInput } from "@/lib/rate-limiter";

// Corrigido: Usando path.resolve a partir da raiz do workspace do dashboard
import { DeploymentOrchestrator } from "../../../../lib/deployment/deploy-orchestrator.mjs";

import { db } from "@/lib/db";
import { ObjectId } from "mongodb";

/**
 * POST /api/deploy/netlify
 * Inicia o processo de deploy para um workspace.
 * 🛡️ PROTEGIDO: Rate limiting e sanitização de inputs
 */
export async function POST(request) {
  try {
    const auth = await getCurrentAuth();
    if (!auth.userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 🛡️ SEGURANÇA: Rate limiting para deploys
    const rateLimitResult = await checkRateLimit(
      request,
      "deploy",
      auth.userId
    );
    if (rateLimitResult.blocked) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        {
          status: rateLimitResult.status,
          headers: rateLimitResult.headers,
        }
      );
    }

    const { workspaceId, deployConfig } = await request.json();

    // 🛡️ SEGURANÇA: Validação e sanitização de inputs
    if (
      !workspaceId ||
      !deployConfig ||
      !deployConfig.githubToken ||
      !deployConfig.netlifyToken
    ) {
      return NextResponse.json(
        { error: "Dados da requisição incompletos." },
        { status: 400 }
      );
    }

    // Sanitizar inputs críticos
    try {
      deployConfig.siteName = deployConfig.siteName
        ? sanitizeInput(deployConfig.siteName, "siteName")
        : null;

      deployConfig.customRepoUrl = deployConfig.customRepoUrl
        ? sanitizeInput(deployConfig.customRepoUrl, "repoUrl")
        : null;

      deployConfig.githubToken = sanitizeInput(
        deployConfig.githubToken,
        "token"
      );
      deployConfig.netlifyToken = sanitizeInput(
        deployConfig.netlifyToken,
        "token"
      );
    } catch (sanitizeError) {
      return NextResponse.json(
        { error: `Input inválido: ${sanitizeError.message}` },
        { status: 400 }
      );
    }

    // Validar tokens básica
    if (
      !deployConfig.githubToken.startsWith("ghp_") &&
      !deployConfig.githubToken.startsWith("github_pat_")
    ) {
      return NextResponse.json(
        {
          error:
            "Token do GitHub inválido. Use um Personal Access Token válido.",
        },
        { status: 400 }
      );
    }

    if (!deployConfig.netlifyToken.startsWith("nfp_")) {
      return NextResponse.json(
        {
          error:
            "Token da Netlify inválido. Use um Personal Access Token válido.",
        },
        { status: 400 }
      );
    }

    const orchestrator = new DeploymentOrchestrator();

    // Inicia o processo de deploy e aguarda o ID de rastreamento.
    // O deploy em si continuará em background.
    const deploymentInfo = await orchestrator.startDeploy({
      userId: auth.userId,
      workspaceId,
      deployConfig,
    });

    // Retornamos uma resposta imediata para o frontend com o ID para polling.
    return NextResponse.json(
      {
        message:
          "Processo de deploy iniciado com sucesso. Você pode acompanhar o status no seu dashboard.",
        deploymentId: deploymentInfo.id,
      },
      {
        // 🛡️ SEGURANÇA: Headers de rate limiting
        headers: rateLimitResult.headers,
      }
    );
  } catch (error) {
    console.error("Erro na API de deploy:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * GET /api/deploy/netlify?workspaceId=[id]
 * Lista os deployments de um workspace.
 * 🛡️ PROTEGIDO: Rate limiting moderado para consultas
 */
export async function GET(request) {
  try {
    const auth = await getCurrentAuth();
    if (!auth.userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    // 🛡️ SEGURANÇA: Rate limiting para consultas (mais permissivo)
    const rateLimitResult = await checkRateLimit(
      request,
      "general",
      auth.userId
    );
    if (rateLimitResult.blocked) {
      return NextResponse.json(
        { error: rateLimitResult.message },
        {
          status: rateLimitResult.status,
          headers: rateLimitResult.headers,
        }
      );
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "ID do Workspace é obrigatório." },
        { status: 400 }
      );
    }

    // 🛡️ SEGURANÇA: Sanitizar workspaceId
    const sanitizedWorkspaceId = sanitizeInput(workspaceId, "general");

    // Garante que o usuário só possa ver os deploys do seu workspace
    const workspace = await db.findOne("workspaces", {
      _id: new ObjectId(sanitizedWorkspaceId),
      ownerId: auth.userId,
    });
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace não encontrado ou sem permissão." },
        { status: 404 }
      );
    }

    const deployments = await db.find(
      "deployments",
      { workspaceId: sanitizedWorkspaceId },
      { sort: { createdAt: -1 } }
    );

    return NextResponse.json(deployments, {
      // 🛡️ SEGURANÇA: Headers de rate limiting
      headers: rateLimitResult.headers,
    });
  } catch (error) {
    console.error("Erro ao listar deployments:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
