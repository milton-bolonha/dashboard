/**
 * 🚀 Onboarding Pipeline Execution
 *
 * Funções para executar e monitorar pipeline de onboarding via DeckEngine
 */

import { getDeckEngine } from "./deck-engine-setup";
import { db } from "./db";
import { ObjectId } from "mongodb";

/**
 * Executa pipeline de onboarding para novo workspace
 *
 * @param {string} workspaceId - ID do workspace (string)
 * @param {object} userContext - Contexto capturado (company, solution, research)
 * @param {string} userId - Clerk userId
 * @returns {Promise<string>} matchId do DeckEngine
 */
export async function executeOnboardingPipeline(
  workspaceId,
  userContext,
  userId
) {
  try {
    const engine = getDeckEngine();

    console.log("🚀 Iniciando onboarding pipeline...", {
      workspaceId,
      userContext,
      userId,
    });

    // Atualizar status inicial
    await db.updateOne(
      "workspaces",
      { _id: new ObjectId(workspaceId) },
      {
        "salesContext.pipelineStatus": "running",
        "salesContext.pipelineStartedAt": new Date(),
      }
    );

    // Executar deck (fire-and-forget)
    const result = await engine.playMatch("onboarding-pipeline", {
      workspaceId,
      userContext,
      userId,
    });

    console.log("✅ Onboarding pipeline enfileirado:", result.matchId);

    // Salvar matchId para tracking
    await db.updateOne(
      "workspaces",
      { _id: new ObjectId(workspaceId) },
      {
        "salesContext.pipelineJobId": result.matchId,
      }
    );

    return result.matchId;
  } catch (error) {
    console.error("❌ Erro ao executar onboarding pipeline:", error);

    // Atualizar status para failed
    await db.updateOne(
      "workspaces",
      { _id: new ObjectId(workspaceId) },
      {
        "salesContext.pipelineStatus": "failed",
      }
    );

    throw error;
  }
}

/**
 * Consulta status do pipeline de onboarding
 *
 * @param {string} workspaceId
 * @returns {Promise<object>}
 */
export async function getOnboardingStatus(workspaceId) {
  try {
    const workspace = await db.findOne("workspaces", {
      _id: new ObjectId(workspaceId),
    });

    if (!workspace) {
      return { status: "not-found" };
    }

    if (!workspace.salesContext?.pipelineJobId) {
      return {
        status: workspace.salesContext?.pipelineStatus || "not-started",
        currentStep: workspace.onboarding?.currentStep,
        completedSteps: workspace.onboarding?.completedSteps || [],
      };
    }

    // Buscar match no engine
    const engine = getDeckEngine();

    // TODO: Implementar getMatch no DeckEngine
    // const match = engine.getMatch?.(workspace.salesContext.pipelineJobId);

    return {
      status: workspace.salesContext.pipelineStatus,
      jobId: workspace.salesContext.pipelineJobId,
      currentStep: workspace.onboarding?.currentStep,
      completedSteps: workspace.onboarding?.completedSteps || [],
      startedAt: workspace.salesContext?.pipelineStartedAt,
      completedAt: workspace.salesContext?.pipelineCompletedAt,
    };
  } catch (error) {
    console.error("❌ Erro ao buscar status do pipeline:", error);
    return { status: "error", error: error.message };
  }
}
