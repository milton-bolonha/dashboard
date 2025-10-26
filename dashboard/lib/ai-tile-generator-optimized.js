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
import { netlifyOpenAI } from "./openai-netlify-client";

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

    // NOVO: Breakdown detalhado
    api_call_start: Date.now(),
    api_call_end: null,
    breakdown: {
      queue_wait_ms: 0,
      api_call_ms: 0,
      ttft_ms: 0,
      streaming_ms: 0,
      db_save_ms: 0,
    },
    model: "gpt-4o-mini", // CORRIGIDO: usar valor direto
    tokens: {
      prompt: 0,
      completion: 0,
      total: 0,
    },
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

    // TESTE: Usar gpt-4o-mini apenas para os dois primeiros tiles
    const isFirstTwoTiles =
      tile.id === "company_description" ||
      tile.title === "What They Do" ||
      tile.id === "revenue_model" ||
      tile.title === "Revenue Model";

    const modelToUse = isFirstTwoTiles ? "gpt-4o-mini" : "gpt-4-turbo-preview";

    console.log(
      `🤖 Tile "${tile.title}": Using model ${modelToUse} (first two tiles: ${isFirstTwoTiles})`
    );

    const params = {
      model: modelToUse,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: processedPrompt },
      ],
      temperature: profile?.temperature || 0.5,
      max_tokens: profile?.maxTokens || 500,
    };

    // Desabilitar streaming temporariamente - usar método normal dos outros tiles
    const useStreaming = false; // options.enableStreaming !== false;

    console.log(
      `🔍 Tile ${tile.title}: profile=${
        profile?.name
      }, useStreaming=${useStreaming}, hasOnStream=${!!options.onStream}`
    );

    // Removido: warmup desnecessário da API OpenAI (-1-3s)

    let answer = "";
    let completion;

    // Desabilitar Netlify Function temporariamente (causa problemas)
    const useNetlifyFunction = false; // typeof window !== "undefined";

    if (useStreaming && options.onStream) {
      // Modo streaming - sempre usar OpenAI direto
      console.log(`🌊 Streaming tile: ${tile.title}`);

      completion = await openai.chat.completions.create({
        ...params,
        stream: true,
      });

      let firstTokenReceived = false;
      const streamingStart = Date.now();

      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || "";

        if (content && !firstTokenReceived) {
          metrics.first_token_at = new Date();
          metrics.breakdown.ttft_ms = Date.now() - streamingStart;
          firstTokenReceived = true;

          console.log(
            `⚡ First token received for ${tile.title} in ${metrics.breakdown.ttft_ms}ms`
          );

          if (pipelineLogger) {
            await pipelineLogger.logEvent(PIPELINE_EVENTS.TILE_STREAMING, {
              tileId: tile.id,
            });
          }
        }

        if (content) {
          answer += content;

          // Callback de progresso - atualizar UI imediatamente
          if (options.onStream) {
            options.onStream(tile.id, answer);
          }
        }
      }

      // Calcular tempo de streaming
      metrics.breakdown.streaming_ms = Date.now() - streamingStart;
      console.log(
        `✅ Streaming completed for ${tile.title} in ${metrics.breakdown.streaming_ms}ms`
      );
    } else {
      // Modo tradicional
      const apiStart = Date.now();

      if (useNetlifyFunction) {
        try {
          console.log("🚀 Using Netlify Function for standard request...");
          completion = await netlifyOpenAI.createCompletion(params);

          // Métricas da Netlify Function
          if (completion.metrics) {
            metrics.breakdown.api_call_ms = completion.metrics.total_time_ms;
            metrics.tokens.prompt = completion.usage?.prompt_tokens || 0;
            metrics.tokens.completion =
              completion.usage?.completion_tokens || 0;
            metrics.tokens.total = completion.usage?.total_tokens || 0;
          }
        } catch (netlifyError) {
          console.warn(
            "⚠️ Netlify Function failed, falling back to direct OpenAI:",
            netlifyError
          );
          // Fallback para OpenAI direto
          completion = await openai.chat.completions.create(params);

          const apiEnd = Date.now();
          metrics.api_call_end = apiEnd;
          metrics.breakdown.api_call_ms = apiEnd - apiStart;
          metrics.tokens.prompt = completion.usage?.prompt_tokens || 0;
          metrics.tokens.completion = completion.usage?.completion_tokens || 0;
          metrics.tokens.total = completion.usage?.total_tokens || 0;
        }
      } else {
        // Servidor: usar OpenAI direto
        completion = await openai.chat.completions.create(params);

        const apiEnd = Date.now();
        metrics.api_call_end = apiEnd;
        metrics.breakdown.api_call_ms = apiEnd - apiStart;
        metrics.tokens.prompt = completion.usage?.prompt_tokens || 0;
        metrics.tokens.completion = completion.usage?.completion_tokens || 0;
        metrics.tokens.total = completion.usage?.total_tokens || 0;
      }

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

    // Adicionar métricas de pipeline
    metrics.pipeline = {
      loading_ms: metrics.breakdown.queue_wait_ms || 0,
      processing_ms: metrics.breakdown.api_call_ms || 0,
      ui_update_ms: metrics.breakdown.db_save_ms || 0,
      total_pipeline_ms: metrics.generation_duration_ms,
    };

    // Log estruturado para debug
    console.log(`
📊 TILE GENERATION METRICS - ${tile.title}
├─ Total: ${metrics.generation_duration_ms}ms
├─ API Call: ${metrics.breakdown.api_call_ms}ms
├─ TTFT: ${metrics.breakdown.ttft_ms}ms
├─ Streaming: ${metrics.breakdown.streaming_ms}ms
├─ DB Save: ${metrics.breakdown.db_save_ms}ms
├─ Model: ${metrics.model}
├─ Tokens: ${metrics.tokens.total} (prompt: ${
      metrics.tokens.prompt
    }, completion: ${metrics.tokens.completion})
├─ Pipeline: Loading: ${metrics.pipeline.loading_ms}ms, Processing: ${
      metrics.pipeline.processing_ms
    }ms, UI: ${metrics.pipeline.ui_update_ms}ms
└─ Profile: ${metrics.optimization_profile}
${
  metrics.generation_duration_ms > 60000
    ? "⚠️ SLOW TILE (>60s)"
    : "✅ Normal speed"
}
    `);

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
      await new Promise((resolve) => setTimeout(resolve, 100)); // Reduzido de 500ms para 100ms
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
  const batchSize = options.batchSize || 4; // MUDADO: era 2, agora 4 requisições simultâneas
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
