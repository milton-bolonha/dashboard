/**
 * 🎮 DeckEngine Setup & Singleton
 *
 * Configura e inicializa todos os decks necessários para o sistema
 */

import DeckEngineApp from "../deckEngine/index.js";
import { db } from "./db";
import { ObjectId } from "mongodb";

// Singleton do engine
let engineInstance = null;

/**
 * Retorna instância singleton do DeckEngine
 * @returns {DeckEngineApp}
 */
export function getDeckEngine() {
  if (!engineInstance) {
    console.log("🎮 Inicializando DeckEngine...");

    engineInstance = new DeckEngineApp({
      concurrencyLimit: 20,
      enableMetrics: true,
    });

    // Inicializar todos os decks
    initializeDecks(engineInstance);

    console.log("✅ DeckEngine inicializado com sucesso!");
  }

  return engineInstance;
}

/**
 * Inicializa todos os decks do sistema
 * @param {DeckEngineApp} engine
 */
function initializeDecks(engine) {
  // ===== DECK 1: ONBOARDING PIPELINE =====
  engine.createDeck("onboarding-pipeline", {
    description: "Pipeline de onboarding para novos workspaces",

    arena: {
      name: "onboarding-arena",
      concurrencyLimit: 3, // Max 3 onboardings simultâneos
      priority: 10, // Alta prioridade
    },

    cards: [
      // CARD 1: WORKSPACE SETUP
      {
        name: "workspace-setup",
        play: async (context) => {
          const { workspaceId, userContext } = context.payload;

          context.log("info", "📝 Setting up workspace context...");

          // Atualizar workspace com progresso
          await db.updateOne(
            "workspaces",
            { _id: new ObjectId(workspaceId) },
            {
              "onboarding.completedSteps": [
                "workspace-created",
                "context-saved",
              ],
              "onboarding.currentStep": "setup-dashboard",
            }
          );

          context.log("info", "✅ Workspace context updated");
          return { setupComplete: true };
        },
      },

      // CARD 2: SETUP DASHBOARD
      {
        name: "setup-dashboard",
        play: async (context) => {
          const { workspaceId, userId } = context.payload;

          context.log("info", "📊 Creating Getting Started dashboard...");

          // Criar dashboard inicial vazio
          // TODO: Quando tiver collection dashboards implementada
          // const dashboard = await db.insertOne("dashboards", {
          //   workspaceId: new ObjectId(workspaceId),
          //   userId: userId,
          //   name: "Getting Started",
          //   type: "onboarding",
          //   tiles: [],
          //   layout: { columns: 3 }
          // });

          // Por enquanto, apenas atualizar status
          await db.updateOne(
            "workspaces",
            { _id: new ObjectId(workspaceId) },
            {
              "onboarding.completedSteps": [
                "workspace-created",
                "context-saved",
                "dashboard-created",
              ],
              "onboarding.currentStep": "completed",
            }
          );

          context.log("info", "✅ Dashboard setup completed");
          return { dashboardCreated: true };
        },
      },

      // CARD 3: NOTIFY USER
      {
        name: "notify-user",
        play: async (context) => {
          const { workspaceId, userId } = context.payload;

          context.log("info", "📧 Sending welcome notification...");

          // TODO: Implementar email via Resend ou similar
          // await sendWelcomeEmail(userId, workspaceId);

          console.log(
            `✅ Onboarding completed for workspace: ${workspaceId}, user: ${userId}`
          );

          context.log("info", "✅ Onboarding pipeline completed!");
          return { notified: true };
        },
      },
    ],

    // Retry em caso de falha
    retry: {
      maxAttempts: 3,
      factor: 2,
    },

    // Hook de sucesso
    onVictory: async (context) => {
      const { workspaceId } = context.payload;

      await db.updateOne(
        "workspaces",
        { _id: new ObjectId(workspaceId) },
        {
          "salesContext.pipelineStatus": "completed",
          "salesContext.pipelineCompletedAt": new Date(),
        }
      );

      console.log("✅ Onboarding pipeline VICTORY for workspace:", workspaceId);
    },

    // Hook de falha
    onDefeat: async (context) => {
      const { workspaceId } = context.payload;

      await db.updateOne(
        "workspaces",
        { _id: new ObjectId(workspaceId) },
        {
          "salesContext.pipelineStatus": "failed",
        }
      );

      console.error(
        "❌ Onboarding pipeline DEFEAT for workspace:",
        workspaceId,
        context.errors
      );
    },
  });

  console.log("✅ Deck 'onboarding-pipeline' criado");

  // ===== DECK 2: BULK RESEARCH (Placeholder) =====
  // TODO: Implementar quando tiver companies collection (Week 3)

  // ===== DECK 3: COMPANY RESEARCH (Placeholder) =====
  // TODO: Implementar quando tiver companies e templates (Week 3)
}

/**
 * Health check do DeckEngine
 * @returns {object}
 */
export function getDeckEngineStatus() {
  if (!engineInstance) {
    return { initialized: false };
  }

  return {
    initialized: true,
    status: engineInstance.getGlobalStatus(),
    decks: engineInstance.getDeckNames?.() || [],
  };
}
