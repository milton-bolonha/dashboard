/**
 * 🚀 Guest Tile Pipeline
 *
 * Pipeline automático para gerar tiles em guest workspaces
 * Similar ao onboarding pipeline, mas para guest sessions
 */

import { db } from "./db";
import { getGuestTemplate, processPromptVariables } from "./guest-templates";
import { generateAllTilesOptimized } from "./ai-tile-generator-optimized";
import { optimizeTiles } from "./prompt-optimizer";
import { createPipelineContext } from "./ai-pipeline-logger";

/**
 * Gera tiles automaticamente para uma company em guest workspace
 *
 * @param {string} guestId - ID da sessão guest
 * @param {string} companyName - Nome da company
 * @param {string} companyUrl - URL da company
 * @param {object} template - Template a ser aplicado (opcional)
 */
export async function generateTilesForCompany(
  guestId,
  companyName,
  companyUrl,
  template = null
) {
  try {
    console.log(
      `🚀 Iniciando geração automática de tiles para: ${companyName}`
    );
    console.log(`🔍 Contexto disponível:`, {
      guestId,
      companyName,
      companyUrl,
    });

    // Buscar guest workspace
    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!guestWorkspace) {
      throw new Error("Guest workspace not found");
    }

    // Marcar como "generating"
    await db.updateOne(
      "guest_workspaces",
      {
        guest_id: guestId,
        "workspace_data.companies.name": companyName,
      },
      {
        $set: {
          "workspace_data.companies.$.tiles_status": "generating",
        },
      }
    );

    // Usar template fornecido ou buscar do workspace
    let templateToUse = template;
    if (!templateToUse) {
      templateToUse = getGuestTemplate(
        guestWorkspace.workspace_data.template_id
      );
    }

    // Preparar contexto para geração
    // Usar context diretamente do guestWorkspace (schema novo)
    const workspaceContext = guestWorkspace.context || {};
    console.log(`🔍 Workspace context:`, workspaceContext);

    const context = {
      company: workspaceContext.company || "Unknown Company",
      companyWebsite: workspaceContext.companyWebsite || "",
      solution: workspaceContext.solution || "Unknown Solution",
      researchTarget: companyName,
      researchWebsite: companyUrl,
    };

    console.log(`🔍 Contexto construído:`, context);

    // Criar contexto de logging
    const pipelineLogger = createPipelineContext({
      guestId,
      companyName: companyName,
    });

    // Preparar tiles com otimização
    const baseTiles = templateToUse.tiles.map((tile) => ({
      id: tile.id,
      title: tile.title,
      prompt: tile.prompt,
      processedPrompt: processPromptVariables(tile.prompt, context), // Processar variáveis
      category: tile.category,
      order: tile.order,
    }));

    // Otimizar tiles
    const optimizedTiles = optimizeTiles(baseTiles, context);

    console.log(
      `🤖 Gerando ${optimizedTiles.length} tiles otimizados para ${companyName}...`
    );

    // Callback para salvar cada tile individualmente
    const saveTileCallback = async (tile) => {
      // Fazer salvamento assíncrono (fire-and-forget) para não bloquear pipeline
      (async () => {
        try {
          console.log(`   💾 Salvando tile "${tile.title}" no banco...`);

          const newTile = {
            id: tile.id,
            title: tile.title,
            question: tile.optimizedPrompt || tile.prompt,
            answer: tile.answer,
            excerpt: tile.excerpt,
            category: tile.category,
            created_at: new Date().toISOString(),
            metrics: {
              total_duration_ms: tile.metrics.generation_duration_ms,
              breakdown: tile.metrics.breakdown,
              model: tile.metrics.model,
              tokens: tile.metrics.tokens,
              optimization_profile: tile.optimizationProfile,
            },
          };

          // Log de streaming se aplicável
          if (tile.metrics.breakdown?.streaming_ms > 0) {
            console.log(
              `🌊 Tile "${tile.title}" was streamed in ${tile.metrics.breakdown.streaming_ms}ms`
            );
          }

          const dbSaveStart = Date.now();

          const result = await db.updateOne(
            "guest_workspaces",
            {
              guest_id: guestId,
              "workspace_data.companies.name": companyName,
            },
            {
              $push: { "workspace_data.companies.$.tiles": newTile },
            }
          );

          const dbSaveEnd = Date.now();
          const dbSaveDuration = dbSaveEnd - dbSaveStart;

          console.log(`💾 Tile "${tile.title}" saved in ${dbSaveDuration}ms`);
        } catch (saveError) {
          console.error(`   ❌ Erro ao salvar tile "${tile.title}":`, saveError);
          // Não propagar erro, continuar gerando outros tiles
        }
      })();
    };

    // Gerar todos os tiles com estratégia híbrida
    const results = await generateAllTilesOptimized(optimizedTiles, context, {
      pipelineLogger,
      batchSize: 2,
      onTileCompleted: saveTileCallback,
    });

    console.log(`✅ ${results.length} tiles gerados com sucesso`);

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

    console.log(
      `✅ Todos os tiles para ${companyName} foram gerados automaticamente!`
    );

    return { success: true, tilesGenerated: results.length };
  } catch (error) {
    console.error(`❌ Erro ao gerar tiles para ${companyName}:`, error);

    // Marcar como falha
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

    throw error;
  }
}
