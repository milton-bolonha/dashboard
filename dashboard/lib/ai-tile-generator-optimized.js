/**
 * ⚡ Gerador Otimizado de Tiles
 *
 * Estratégia híbrida:
 * - Tiles críticos (1-3): Sequencial com streaming
 * - Tiles secundários (4+): Paralelo com controle de concorrência
 */

import OpenAI from "openai";
import { processPromptVariables } from "./guest-templates";
import { createPipelineContext, PIPELINE_EVENTS } from "./ai-pipeline-logger";

// Inicializar OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Gera um tile com métricas de performance
 */
export async function generateTileWithMetrics(tile, context, options = {}) {
  const { profile, pipelineLogger } = options;

  const metrics = {
    prompt_sent_at: new Date(),
    first_token_at: null,
    completed_at: null,
    generation_duration_ms: null,
    optimization_profile: profile?.name || "DEFAULT",
  };

  try {
    // Logar início
    if (pipelineLogger) {
      await pipelineLogger.logTileStarted(tile.id, tile.title);
    }

    // Usar prompt otimizado se disponível
    const processedPrompt =
      tile.optimizedPrompt || processPromptVariables(tile.prompt, context);
    const systemPrompt =
      tile.optimizedSystemPrompt ||
      `You are an expert sales research assistant helping sales professionals.
Context about the sales rep:
- Works at: ${context.company} (${context.companyWebsite})
- Sells: ${context.solution}
- Researching: ${context.researchTarget} (${context.researchWebsite})
Provide detailed, actionable insights focused on sales opportunities.`;

    const params = {
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: processedPrompt },
      ],
      temperature: profile?.temperature || 0.7,
      max_tokens: profile?.maxTokens || 800,
    };

    // Streaming apenas para tiles críticos (os primeiros 3)
    const useStreaming =
      profile?.name === "CRITICAL_FAST" && options.enableStreaming !== false;

    let answer = "";
    let completion;

    if (useStreaming && options.onStream) {
      // Modo streaming
      completion = await openai.chat.completions.create({
        ...params,
        stream: true,
      });

      let firstTokenReceived = false;

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || "";

        if (content && !firstTokenReceived) {
          metrics.first_token_at = new Date();
          firstTokenReceived = true;

          if (pipelineLogger) {
            await pipelineLogger.logEvent(PIPELINE_EVENTS.TILE_STREAMING, {
              tileId: tile.id,
            });
          }
        }

        answer += content;

        // Callback de progresso
        if (options.onStream) {
          options.onStream(tile.id, answer);
        }
      }
    } else {
      // Modo tradicional
      completion = await openai.chat.completions.create(params);
      answer = completion.choices[0].message.content;
    }

    metrics.completed_at = new Date();
    metrics.generation_duration_ms =
      metrics.completed_at - metrics.prompt_sent_at;

    // Extrair excerpt (primeiras 150 caracteres)
    const excerpt = answer.substring(0, 150).replace(/\n/g, " ").trim() + "...";

    // Logar conclusão
    if (pipelineLogger) {
      await pipelineLogger.logTileCompleted(tile.id, metrics);
    }

    return {
      answer,
      excerpt,
      metrics,
    };
  } catch (error) {
    console.error(`❌ Erro ao gerar tile ${tile.id}:`, error);

    metrics.completed_at = new Date();
    metrics.generation_duration_ms =
      metrics.completed_at - metrics.prompt_sent_at;

    if (pipelineLogger) {
      await pipelineLogger.logEvent(PIPELINE_EVENTS.TILE_FAILED, {
        tileId: tile.id,
        error: error.message,
      });
    }

    throw error;
  }
}

/**
 * Gera tiles críticos em sequência com streaming
 */
export async function generateCriticalTilesSequential(
  tiles,
  context,
  options = {}
) {
  const results = [];
  const pipelineLogger = options.pipelineLogger;
  const onTileCompleted = options.onTileCompleted;

  for (const tile of tiles) {
    try {
      const result = await generateTileWithMetrics(tile, context, {
        profile: tile.optimizationProfile || { name: "CRITICAL_FAST" },
        pipelineLogger,
        enableStreaming: true,
        onStream: options.onStream,
      });

      const completedTile = {
        ...tile,
        answer: result.answer,
        excerpt: result.excerpt,
        metrics: result.metrics,
      };

      results.push(completedTile);

      // Chamar callback para salvar imediatamente
      if (onTileCompleted) {
        console.log(
          `   🔔 Callback onTileCompleted chamado para tile "${completedTile.title}"`
        );
        await onTileCompleted(completedTile);
      }

      // Pequeno delay entre tiles
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`❌ Erro ao gerar tile crítico ${tile.id}:`, error);
      // Continuar com próximo tile mesmo se um falhar
    }
  }

  return results;
}

/**
 * Gera tiles secundários em paralelo
 */
export async function generateSecondaryTilesParallel(
  tiles,
  context,
  options = {}
) {
  const batchSize = options.batchSize || 2; // 2-3 requisições simultâneas
  const results = [];
  const pipelineLogger = options.pipelineLogger;
  const onTileCompleted = options.onTileCompleted;

  // Processar em lotes
  for (let i = 0; i < tiles.length; i += batchSize) {
    const batch = tiles.slice(i, i + batchSize);

    // Gerar batch em paralelo
    const batchPromises = batch.map(async (tile) => {
      try {
        const result = await generateTileWithMetrics(tile, context, {
          profile: tile.optimizationProfile || { name: "STANDARD" },
          pipelineLogger,
          enableStreaming: false, // Sem streaming para paralelo
        });

        const completedTile = {
          ...tile,
          answer: result.answer,
          excerpt: result.excerpt,
          metrics: result.metrics,
        };

        // Chamar callback para salvar imediatamente
        if (onTileCompleted) {
          await onTileCompleted(completedTile);
        }

        return completedTile;
      } catch (error) {
        console.error(`❌ Erro ao gerar tile paralelo ${tile.id}:`, error);
        return null;
      }
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults.filter((r) => r !== null));

    // Delay entre batches para respeitar rate limits
    if (i + batchSize < tiles.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return results;
}

/**
 * Gera todos os tiles com estratégia híbrida otimizada
 */
export async function generateAllTilesOptimized(tiles, context, options = {}) {
  const pipelineLogger = options.pipelineLogger;
  const startTime = Date.now();

  // Determinar quantos tiles críticos (primeiros 3)
  const criticalThreshold = 3;
  const criticalTiles = tiles.slice(0, criticalThreshold);
  const secondaryTiles = tiles.slice(criticalThreshold);

  const allResults = [];

  // Fase 1: Tiles críticos (sequencial com streaming)
  if (criticalTiles.length > 0) {
    console.log(
      `🚀 Gerando ${criticalTiles.length} tiles críticos (sequencial + streaming)...`
    );

    const criticalResults = await generateCriticalTilesSequential(
      criticalTiles,
      context,
      {
        pipelineLogger,
        onStream: options.onStream,
        onTileCompleted: options.onTileCompleted,
      }
    );

    allResults.push(...criticalResults);

    console.log(`✅ ${criticalResults.length} tiles críticos gerados`);
  }

  // Fase 2: Tiles secundários (paralelo)
  if (secondaryTiles.length > 0) {
    console.log(
      `🚀 Gerando ${secondaryTiles.length} tiles secundários (paralelo, batch=${
        options.batchSize || 2
      })...`
    );

    const secondaryResults = await generateSecondaryTilesParallel(
      secondaryTiles,
      context,
      {
        pipelineLogger,
        batchSize: options.batchSize || 2,
        onTileCompleted: options.onTileCompleted,
      }
    );

    allResults.push(...secondaryResults);

    console.log(`✅ ${secondaryResults.length} tiles secundários gerados`);
  }

  const totalDuration = Date.now() - startTime;

  if (pipelineLogger) {
    await pipelineLogger.logTilesGenerationCompleted(
      allResults.length,
      totalDuration
    );
  }

  console.log(`✅ Todos os tiles gerados em ${totalDuration}ms`);

  return allResults;
}
