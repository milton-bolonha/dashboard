/**
 * 🚀 Guest Tile Pipeline
 *
 * Pipeline automático para gerar tiles em guest workspaces
 * Similar ao onboarding pipeline, mas para guest sessions
 */

import { db, DEFAULT_MONGODB_BATCH_SIZE } from "./db";
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
  const startTime = Date.now();
  console.log(`\n${"=".repeat(80)}`);
  console.log(`🚀 GERANDO TILES - ${companyName}`);
  console.log(`⏰ ${new Date().toISOString()}`);
  console.log(`${"=".repeat(80)}`);
  console.log(`📋 Contexto:`, { guestId, companyName, companyUrl });

  try {
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
    // ⭐ Nota: context já está no formato legado aqui, então não precisa de theme
    const optimizedTiles = optimizeTiles(baseTiles, context, null);

    console.log(
      `🤖 Gerando ${optimizedTiles.length} tiles otimizados para ${companyName}...`
    );

    // ⭐ NOVO: Batch writes para evitar bloqueio entre tiles
    const tileBatch = [];
    const configuredBatchSize = Number.parseInt(
      process.env.GUEST_TILE_BATCH_SIZE ?? "",
      10
    );
    const fallbackBatchSize = Math.max(
      1,
      Math.min(DEFAULT_MONGODB_BATCH_SIZE, 10)
    );
    const BATCH_SIZE =
      Number.isFinite(configuredBatchSize) && configuredBatchSize > 0
        ? configuredBatchSize
        : fallbackBatchSize;

    // Função para salvar batch usando bulkWrite
    const saveBatchToDb = async (tiles) => {
      const dbSaveStart = Date.now();

      try {
        const operations = tiles.map((tile) => ({
          updateOne: {
            filter: {
              guest_id: guestId,
              "workspace_data.companies.name": companyName,
            },
            update: {
              $push: { "workspace_data.companies.$.tiles": tile },
            },
          },
        }));

        await db.bulkWrite(
          "guest_workspaces",
          operations,
          { ordered: false },
          {
            stage: "guest-tile-pipeline",
            guestId,
            companyName,
            tiles: tiles.length,
          }
        );

        const dbSaveEnd = Date.now();
        const dbSaveDuration = dbSaveEnd - dbSaveStart;

        console.log(
          `💾 Batch de ${tiles.length} tiles salvos em ${dbSaveDuration}ms`
        );
      } catch (error) {
        console.error(`❌ Erro ao salvar batch no DB:`, error);
        throw error;
      }
    };

    // Callback para salvar cada tile via batch
    const saveTileCallback = async (tile) => {
      try {
        console.log(`   💾 Adicionando tile "${tile.title}" ao batch...`);

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

        // Adicionar ao batch
        tileBatch.push(newTile);

        // Se batch estiver cheio, salvar todos de uma vez em background
        if (tileBatch.length >= BATCH_SIZE) {
          const batchToSave = [...tileBatch];
          tileBatch.length = 0; // Limpar batch

          // Fire-and-forget batch save
          saveBatchToDb(batchToSave).catch((error) => {
            console.error(`   ❌ Erro ao salvar batch:`, error);
          });
        }
      } catch (saveError) {
        console.error(`   ❌ Erro ao adicionar tile ao batch:`, saveError);
      }
    };

    // Gerar todos os tiles com estratégia híbrida
    const results = await generateAllTilesOptimized(optimizedTiles, context, {
      pipelineLogger,
      batchSize: Math.min(BATCH_SIZE, optimizedTiles.length || BATCH_SIZE),
      onTileCompleted: saveTileCallback,
    });

    console.log(`✅ ${results.length} tiles gerados com sucesso`);

    // ⭐ FLUSH: Salvar batch pendente ao final
    if (tileBatch && tileBatch.length > 0) {
      console.log(`💾 Salvando batch final com ${tileBatch.length} tiles...`);
      const batchToSave = [...tileBatch];

      try {
        await saveBatchToDb(batchToSave);
        console.log(`✅ Batch final salvo com sucesso`);
      } catch (error) {
        console.error(`❌ Erro ao salvar batch final:`, error);
      }
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

    const totalTime = Date.now() - startTime;
    console.log(`\n${"=".repeat(80)}`);
    console.log(`✅ GERAÇÃO CONCLUÍDA - ${companyName}`);
    console.log(`📊 Tiles gerados: ${results.length}`);
    console.log(
      `⏱️  Tempo total: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`
    );
    console.log(`${"=".repeat(80)}\n`);

    return { success: true, tilesGenerated: results.length };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error(`\n${"=".repeat(80)}`);
    console.error(`❌ ERRO NA GERAÇÃO - ${companyName}`);
    console.error(
      `⏱️  Tempo até erro: ${totalTime}ms (${(totalTime / 1000).toFixed(1)}s)`
    );
    console.error(`❌ Erro:`, error);
    console.error(`${"=".repeat(80)}\n`);

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
