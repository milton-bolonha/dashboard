/**
 * 🎮 Deck do DeckEngine para Pipeline de Geração de Tiles
 * 
 * Orquestra a geração de tiles com retry automático, métricas e monitoramento
 */

import { getDeckEngine } from "./deck-engine-setup";
import { generateAllTilesOptimized } from "./ai-tile-generator-optimized";
import { optimizeTiles } from "./prompt-optimizer";
import { getGuestTemplate, processPromptVariables } from "./guest-templates";
import { createPipelineContext } from "./ai-pipeline-logger";

let aiTilesDeck = null;

/**
 * Inicializa o deck de geração de tiles
 */
export function initializeAITilesDeck(engine) {
  if (aiTilesDeck) {
    return aiTilesDeck;
  }

  console.log("🎮 Criando deck de geração de tiles...");

  aiTilesDeck = engine.createDeck("ai-tiles-generation", {
    title: "AI Tiles Generation",
    description: "Gera tiles de pesquisa AI com otimização e métricas",
    
    cards: [
      // Card 1: Validação e preparação
      {
        name: "validate-and-prepare",
        play: async (context) => {
          console.log("✅ Card 1: Validando contexto...");
          
          const { guestId, companyName, companyUrl } = context.payload;
          
          if (!guestId || !companyName) {
            throw new Error("Guest ID e company name são obrigatórios");
          }

          // Criar contexto de logging
          const pipelineLogger = createPipelineContext({
            guestId,
            companyName,
          });

          // Buscar template
          const template = getGuestTemplate(context.payload.templateId || "template_1");
          
          context.pipelineLogger = pipelineLogger;
          context.template = template;
          context.startTime = Date.now();

          console.log(`✅ Contexto validado para ${companyName}`);
          return context;
        },
      },

      // Card 2: Otimizar prompts
      {
        name: "optimize-prompts",
        play: async (context) => {
          console.log("⚡ Card 2: Otimizando prompts...");
          
          const { template } = context;
          const { context: contextData } = context.payload;

          // Preparar contexto para processamento
          const tileContext = {
            company: contextData.company || "Unknown Company",
            companyWebsite: contextData.companyWebsite || "",
            solution: contextData.solution || "Unknown Solution",
            researchTarget: context.payload.companyName,
            researchWebsite: context.payload.companyUrl || "",
          };

          // Processar prompts do template
          const baseTiles = template.tiles.map((tile) => ({
            id: tile.id,
            title: tile.title,
            prompt: tile.prompt,
            category: tile.category,
            order: tile.order,
          }));

          // Otimizar tiles
          const optimizedTiles = optimizeTiles(baseTiles, tileContext);
          
          context.optimizedTiles = optimizedTiles;
          context.tileContext = tileContext;

          console.log(`✅ ${optimizedTiles.length} tiles otimizados`);
          return context;
        },
      },

      // Card 3: Gerar tiles
      {
        name: "generate-tiles",
        play: async (context) => {
          console.log("🤖 Card 3: Gerando tiles...");
          
          const { optimizedTiles, tileContext, pipelineLogger } = context;
          
          // Logar início da geração
          if (pipelineLogger) {
            await pipelineLogger.logTilesGenerationStarted(
              context.template.id,
              optimizedTiles.length
            );
          }

          // Gerar tiles usando gerador otimizado
          const results = await generateAllTilesOptimized(
            optimizedTiles,
            tileContext,
            {
              pipelineLogger,
              batchSize: 2, // 2 tiles em paralelo
            }
          );

          context.generatedTiles = results;

          console.log(`✅ ${results.length} tiles gerados`);
          return context;
        },
      },

      // Card 4: Salvar no banco
      {
        name: "save-to-database",
        play: async (context) => {
          console.log("💾 Card 4: Salvando tiles no banco...");
          
          const { generatedTiles, pipelineLogger } = context;
          const { guestId, companyName } = context.payload;

          // Importar db dinamicamente
          const { db } = await import("./db");

          // Salvar cada tile
          for (const tile of generatedTiles) {
            await db.updateOne(
              "guest_workspaces",
              {
                guest_id: guestId,
                "workspace_data.companies.name": companyName,
              },
              {
                $push: {
                  "workspace_data.companies.$.tiles": {
                    id: tile.id,
                    title: tile.title,
                    question: tile.optimizedPrompt || tile.prompt,
                    answer: tile.answer,
                    excerpt: tile.excerpt,
                    category: tile.category,
                    created_at: new Date().toISOString(),
                    metrics: tile.metrics, // Incluir métricas
                  },
                },
              }
            );
          }

          // Marcar como completo
          await db.updateOne(
            "guest_workspaces",
            {
              guest_id: guestId,
              "workspace_data.companies.name": companyName,
            },
            {
              $set: {
                "workspace_data.companies.$.tiles_status": "completed",
              },
            }
          );

          const totalDuration = Date.now() - context.startTime;

          if (pipelineLogger) {
            await pipelineLogger.logTilesGenerationCompleted(
              generatedTiles.length,
              totalDuration
            );
          }

          console.log(`✅ Tiles salvos em ${totalDuration}ms`);
          return context;
        },
      },
    ],

    retry: {
      maxAttempts: 3,
      factor: 2,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
    },

    onCardPlayed: async (context, cardIndex, result) => {
      console.log(`🎴 Card ${cardIndex + 1} jogado`);
      if (context.pipelineLogger) {
        await context.pipelineLogger.logEvent("card_played", {
          cardIndex,
          cardName: context.deck?.cards[cardIndex]?.name,
        });
      }
    },

    handleError: async (context, error) => {
      console.error("❌ Erro no deck de tiles:", error);
      
      if (context.pipelineLogger) {
        await context.pipelineLogger.logEvent("deck_error", {
          error: error.message,
          stack: error.stack,
        });
      }

      // Marcar como falha no banco
      const { guestId, companyName } = context.payload;
      const { db } = await import("./db");
      
      await db.updateOne(
        "guest_workspaces",
        {
          guest_id: guestId,
          "workspace_data.companies.name": companyName,
        },
        {
          $set: {
            "workspace_data.companies.$.tiles_status": "failed",
          },
        }
      );
    },
  });

  console.log("✅ Deck de tiles criado com sucesso");
  return aiTilesDeck;
}

/**
 * Executa a geração de tiles usando o deck
 */
export async function generateTilesWithDeck(payload) {
  const engine = getDeckEngine();
  
  // Garantir que o deck existe
  if (!aiTilesDeck) {
    initializeAITilesDeck(engine);
  }

  console.log("🎮 Executando geração de tiles com DeckEngine...");

  // Executar deck
  const result = await engine.playMatch("ai-tiles-generation", payload, {
    waitForCompletion: true,
  });

  return result;
}
