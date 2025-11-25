import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";

import {
  readWorkspace,
  updateWorkspace,
  getCurrentSession,
} from "@/lib/cookies-store";
import { getAuth } from "@/lib/auth/get-auth";
import { resolveModel } from "@/lib/ai/settings";
import type { Tile } from "@/lib/types";
import { generateTileContent } from "@/lib/ai/tile-generation";
import { syncWorkspaceTilesToMongo } from "@/lib/storage/mongodb-store";
import {
  getCompanyById,
  updateDashboard,
} from "@/lib/storage/dashboards-store";

const createTileSchema = z.object({
  title: z.string().min(1, "Title is required"),
  prompt: z.string().min(1, "Prompt is required"),
  model: z.string().optional(),
  useMaxPrompt: z.boolean().optional(),
  requestSize: z.enum(["small", "medium", "large"]).optional(),
  // ✅ CORREÇÃO: Adicionar dashboardId e companyId para isolar dados corretamente
  dashboardId: z.string().optional(),
  companyId: z.string().optional(),
});

// Map request size to max tokens
function getMaxTokensForSize(size: "small" | "medium" | "large"): number {
  switch (size) {
    case "small":
      return 400; // ~200-400 tokens
    case "medium":
      return 800; // ~600-800 tokens
    case "large":
      return 1600; // ~1200-1600 tokens
    default:
      return 400;
  }
}

export async function POST(request: Request) {
  console.log("[API] /api/workspace/tiles - Creating custom tile");

  const body = await request.json().catch(() => null);
  console.log("[API] /api/workspace/tiles - Received body:", body);

  // Check usage limits (simplified check - in production use proper middleware)
  // For now, we'll rely on client-side tracking and add server-side checks later

  // We need to parse body first to get requestSize
  const parseResult = createTileSchema.safeParse(body);
  if (!parseResult.success) {
    console.error(
      "[API] /api/workspace/tiles - Invalid payload:",
      parseResult.error.flatten()
    );
    return NextResponse.json(
      { error: "Invalid payload", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { requestSize = "small" } = parseResult.data;
  const maxTokens = getMaxTokensForSize(requestSize);
  // Estimate tiles to generate as 1 (since we are creating 1 tile)
  // But wait, the middleware expects "tilesToGenerate" to calculate tokens?
  // In middleware: const tokensCost = tilesToGenerate * 100;
  // Here we know the maxTokens.
  // We should probably update middleware to accept "tokens" directly or just use the "tiles" abstraction.
  // If 1 tile = 100 tokens in middleware, and here we might use up to 1600 tokens...
  // The middleware logic "1 tile = 100 tokens" is a bit arbitrary if we have variable sizes.
  // Let's stick to the "tiles" abstraction for now as per plan "Monthly Token Allowance ... (~30 actions/ tiles)".
  // So 1 action = 1 tile.

  const { checkUsageMiddleware } = await import(
    "@/lib/server/usage-middleware"
  );
  const usageCheck = await checkUsageMiddleware(body, request.headers, 1);

  if (!usageCheck.allowed) {
    return (
      usageCheck.response ||
      NextResponse.json(
        { error: "Usage limit exceeded", code: "USAGE_LIMIT_EXCEEDED" },
        { status: 429 }
      )
    );
  }

  const { title, prompt, model, useMaxPrompt, dashboardId, companyId } =
    parseResult.data;

  // ✅ CORREÇÃO: Se dashboardId e companyId foram fornecidos, usar dashboard específico
  // Caso contrário, usar workspace (fallback para compatibilidade)
  let targetDashboard: { id: string; companyId: string; tiles: Tile[] } | null =
    null;
  let workspace: Awaited<ReturnType<typeof readWorkspace>> | null = null;

  if (dashboardId && companyId) {
    // Usar dashboard específico (isolamento correto)
    console.log("[API] /api/workspace/tiles - Using specific dashboard", {
      dashboardId,
      companyId,
    });

    const company = getCompanyById(companyId);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    const dashboard = company.dashboards.find((d) => d.id === dashboardId);
    if (!dashboard) {
      return NextResponse.json(
        { error: "Dashboard not found" },
        { status: 404 }
      );
    }

    targetDashboard = {
      id: dashboard.id,
      companyId: company.id,
      tiles: dashboard.tiles || [],
    };

    // Carregar workspace para contexto da company (nome, website, etc)
    // ✅ CORREÇÃO: Não criar workspace temporário - usar dados da company diretamente
    workspace = await readWorkspace();

    // Se workspace não corresponde ou não existe, usar dados da company para contexto
    // Mas NÃO criar um novo workspace - isso causaria problemas de isolamento
    if (!workspace || workspace.sessionId !== companyId) {
      console.warn(
        "[API] /api/workspace/tiles - Workspace sessionId mismatch",
        {
          workspaceSessionId: workspace?.sessionId,
          companyId,
          note: "Using company data for context only, not creating new workspace",
        }
      );

      // Usar dados da company para contexto, mas não criar workspace
      // O workspace será atualizado apenas se corresponder ao companyId
      workspace = {
        sessionId: companyId,
        company: {
          id: company.id,
          name: company.name,
          website: company.website,
          tiles: dashboard.tiles || [], // Usar tiles do dashboard
          notes: dashboard.notes || [],
          contacts: dashboard.contacts || [],
        },
        generatedAt: company.createdAt ? new Date(company.createdAt) : null,
        tilesToGenerate: 0,
      } as any;
    }
  } else {
    // Fallback: usar workspace (compatibilidade com código antigo)
    // ⚠️ AVISO: Este modo não garante isolamento correto - sempre passe dashboardId e companyId
    workspace = await readWorkspace();
    if (!workspace) {
      console.error(
        "[API] /api/workspace/tiles - No workspace found and no dashboardId/companyId provided"
      );
      return NextResponse.json(
        {
          error:
            "Workspace cache expired. Please provide dashboardId and companyId to ensure correct data isolation.",
          code: "MISSING_DASHBOARD_ID",
        },
        { status: 404 }
      );
    }

    console.warn(
      "[API] /api/workspace/tiles - Using workspace fallback mode (dashboardId/companyId not provided)",
      {
        workspaceSessionId: workspace.sessionId,
        note: "This may cause data isolation issues. Always provide dashboardId and companyId.",
      }
    );
  }

  if (!workspace) {
    return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
  }

  // Determine model: useMaxPrompt = true -> gpt-5, false -> gpt-5-nano
  const selectedModel = model || (useMaxPrompt ? "gpt-5" : "gpt-5-nano");
  const resolvedModel = resolveModel(selectedModel);

  // Get max tokens based on request size (already calculated above)
  // const maxTokens = getMaxTokensForSize(requestSize);

  // Add company context to prompt (internal context, not visible to user)
  // This helps the AI understand which company is being researched
  const companyName = workspace.company.name || "the company";
  const companyWebsite = workspace.company.website;
  const companyContext = companyWebsite
    ? `[Context: This research is about ${companyName} (${companyWebsite}). Use this information to provide accurate and relevant insights, but do not mention the company name or website in your response unless explicitly asked.]\n\n`
    : `[Context: This research is about ${companyName}. Use this information to provide accurate and relevant insights, but do not mention the company name in your response unless explicitly asked.]\n\n`;
  const enhancedPrompt = companyContext + prompt;

  console.log(
    "[API] /api/workspace/tiles - Creating tile with model:",
    resolvedModel,
    "maxTokens:",
    maxTokens,
    "company:",
    companyName
  );

  try {
    // ✅ CORREÇÃO: Usar tiles do dashboard específico se disponível, senão usar workspace
    const existingTiles = targetDashboard
      ? targetDashboard.tiles
      : workspace.company.tiles || [];

    const generationResult = await generateTileContent({
      prompt: enhancedPrompt,
      title,
      templateId: "custom",
      model: resolvedModel,
      orderIndex: existingTiles.length,
      maxTokens,
    });

    // Para tiles individuais criados pelo usuário, colocar no início (orderIndex negativo)
    // Isso faz com que apareçam primeiro, mas ainda podem ser reordenados via drag and drop
    // Usamos -1 para o mais recente, -2 para o anterior, etc.
    // Tiles de template têm orderIndex positivo (0, 1, 2...)
    const minOrderIndex =
      existingTiles.length > 0
        ? Math.min(...existingTiles.map((t) => t.orderIndex ?? 0))
        : 0;
    const newOrderIndex = minOrderIndex < 0 ? minOrderIndex - 1 : -1;

    const newTile: Tile = {
      id: `tile_${randomUUID()}`,
      title,
      content: generationResult.content,
      prompt, // Store original prompt (without company context) for display
      templateId: "custom",
      category: "custom",
      model: resolvedModel,
      orderIndex: newOrderIndex, // Negativo para aparecer primeiro
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalTokens: generationResult.totalTokens,
      attempts: generationResult.attempts,
      history: generationResult.history || [],
    };

    console.log("[API] /api/workspace/tiles - Tile created:", newTile.id);

    // ✅ CORREÇÃO: Atualizar dashboard específico se fornecido, senão atualizar workspace
    let updatedWorkspace: Awaited<ReturnType<typeof updateWorkspace>> | null =
      null;

    if (targetDashboard && dashboardId && companyId) {
      // Atualizar dashboard específico (isolamento correto)
      console.log("[API] /api/workspace/tiles - Updating specific dashboard", {
        dashboardId,
        companyId,
        tilesCount: existingTiles.length + 1,
      });

      updateDashboard(companyId, dashboardId, {
        tiles: [...existingTiles, newTile],
      });

      // ✅ CORREÇÃO: Só atualizar workspace se sessionId corresponder ao companyId
      // Isso previne criar/atualizar workspace errado
      try {
        const currentWorkspace = await readWorkspace();
        if (currentWorkspace && currentWorkspace.sessionId === companyId) {
          updatedWorkspace = await updateWorkspace((ws) => ({
            ...ws,
            company: {
              ...ws.company,
              tiles: [...existingTiles, newTile],
            },
          }));
          console.log(
            "[API] /api/workspace/tiles - Dashboard and workspace updated"
          );
        } else {
          console.log(
            "[API] /api/workspace/tiles - Skipping workspace update (sessionId mismatch)",
            {
              workspaceSessionId: currentWorkspace?.sessionId,
              companyId,
              note: "Dashboard is source of truth, workspace sync will happen on next load",
            }
          );
        }
      } catch (workspaceError) {
        // Se workspace não existe ou não corresponde, não é crítico
        // O dashboard é a fonte da verdade
        console.warn(
          "[API] /api/workspace/tiles - Could not update workspace (non-critical):",
          workspaceError
        );
      }
    } else {
      // Fallback: atualizar workspace (compatibilidade)
      updatedWorkspace = await updateWorkspace((ws) => ({
        ...ws,
        company: {
          ...ws.company,
          tiles: [...existingTiles, newTile],
        },
      }));
      console.log(
        "[API] /api/workspace/tiles - Workspace updated (fallback mode)"
      );
    }

    // Dual-write: Sync tiles to MongoDB if available (non-blocking)
    try {
      const { userId } = await getAuth();
      const { sessionId } = await getCurrentSession();
      if (sessionId && userId && updatedWorkspace) {
        await syncWorkspaceTilesToMongo(
          sessionId,
          userId,
          updatedWorkspace.company.tiles
        );

        // Increment token usage
        // We use maxTokens as an estimate or the actual tokens if available?
        // The middleware check used "1 tile" which maps to 100 tokens in the simple model.
        // But here we have `generationResult.totalTokens`. We should use that if possible.
        // Or stick to the plan "Monthly Token Allowance ... (~30 actions/ tiles)".
        // If we track "tokensUsed", we should probably use the actual tokens used.
        // But the plan says "3000 tokens (~30 actions)". This implies 1 action = 100 tokens.
        // If we use actual tokens, a single GPT-4 call can be 1000+ tokens.
        // So "3000 tokens" in the plan description might be "App Tokens" (credits), not LLM tokens.
        // Let's assume 1 tile = 100 "App Tokens".
        const { incrementUsage } = await import("@/lib/saas/usage-service");
        await incrementUsage(userId, "tokensUsed", 100);

        console.log(
          "[API] /api/workspace/tiles - ✅ Tiles também sincronizados no MongoDB"
        );
      }
    } catch (mongoError) {
      // Log but don't fail the request if MongoDB is unavailable
      const errorMessage =
        mongoError instanceof Error ? mongoError.message : String(mongoError);
      console.warn(
        "[API] /api/workspace/tiles - ⚠️ Falha ao sincronizar no MongoDB (não crítico):",
        errorMessage
      );
    }

    return NextResponse.json({
      success: true,
      tile: newTile,
      workspace: updatedWorkspace || workspace, // Retornar workspace atualizado ou original
      dashboardId: targetDashboard?.id,
      companyId: targetDashboard?.companyId,
    });
  } catch (error) {
    console.error("[API] /api/workspace/tiles - Error generating tile:", error);
    return NextResponse.json(
      {
        error: "Failed to generate tile content",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
