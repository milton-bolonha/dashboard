import { generateCompletion } from "@/lib/ai/provider";
import { appendLog } from "@/lib/db/prompt-logs";
import { setDeckEngineRunner } from "@/lib/jobs/deck-engine-bridge";
import {
  getGuestTemplate,
  processPromptVariables,
} from "@/lib/guest-templates";
import {
  getDeckGenerationConfig,
  resolveGenerationMode,
  getDeckWarmupConfig,
  getDeckModelConfig,
} from "@/config/deck-engine";

const TILE_MAX_ATTEMPTS = 3;
const TILE_REFUSAL_PATTERNS = [
  /i['’`]?m sorry/i,
  /i cannot/i,
  /i can't/i,
  /i do not have/i,
  /as an ai language model/i,
  /unable to comply/i,
  /cannot comply/i,
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const estimateTokensFromText = (text) => {
  if (!text) return 0;
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return 0;
  return Math.max(1, Math.round(cleaned.length / 4));
};

const DEFAULT_COMPLETION_MAX_TOKENS = Math.max(
  200,
  parseInt(process.env.DECK_ENGINE_MAX_TOKENS || "600", 10)
);

const TILE_TOKEN_LIMITS = {
  company_description: 320,
  revenue_model: 320,
  international_offices: 320,
  business_goals_2025: 380,
  business_challenges: 360,
  solution_need: 340,
  ceo_info: 260,
  sales_email: 220,
  // Template 2 overrides
  company_description_2: 320,
  revenue_model_2: 320,
  biggest_goal_2025: 320,
  industry_challenges: 340,
  solution_need_2: 340,
  top_competitors: 360,
  holding_company: 320,
  ceo_info_2: 260,
  cold_call_scripts: 240,
};

// Runner default baseado no provider de IA com streaming
// Assinatura esperada pelo adapter: runJob({ jobId, templateId, model, items, scope, onStatus, onChunk, onResult, onError, onCompleted })
async function runJob({
  jobId,
  templateId,
  model,
  items,
  scope,
  generationMode,
  onStatus,
  onChunk,
  onResult,
  onError,
  onCompleted,
}) {
  // ⭐ NOVO: Carregar template do templateId PRIMEIRO para saber quantos tiles gerar
  // ⭐ CORREÇÃO: Mapear templateIds do page.js para os templates reais
  let actualTemplateId = templateId;
  if (
    templateId === "tpl_classic_default" ||
    templateId === "tpl_dynamic_default"
  ) {
    actualTemplateId = "template_1"; // Usar template_1 que tem 8 tiles
    console.log(
      `[Runner] 🔄 Mapeando templateId ${templateId} → ${actualTemplateId}`
    );
  }

  const template = getGuestTemplate(actualTemplateId);
  console.log(
    `[Runner] 📋 Template: ${template.name} (${template.tiles.length} tiles)`
  );

  const modelConfig = getDeckModelConfig();
  const defaultModel = modelConfig.model;
  const reasoningEffort = modelConfig.reasoningEffort;
  const verbosity = modelConfig.verbosity;
  const activeModel = model || defaultModel;

  // ⭐ BUG FIX: Usar template.tiles.length como total (8 tiles), não items.length
  // ⭐ Se items.length for menor, criar items vazios para os tiles restantes
  const itemsCount = Array.isArray(items) ? items.length : 0;
  const templateTilesCount = template.tiles.length;
  const total = Math.max(itemsCount, templateTilesCount);

  const { batchConcurrency } = getDeckGenerationConfig();
  const normalizedGenerationMode = resolveGenerationMode(generationMode);
  const concurrency =
    normalizedGenerationMode === "batch" ? Math.max(1, batchConcurrency) : 1;
  const shouldProcessInParallel = concurrency > 1;

  console.log(
    `[Runner] ⚙️ Generation mode: ${normalizedGenerationMode} (concurrency=${concurrency})`
  );
  console.log(`[Runner] 🧠 Modelo ativo: ${activeModel}`);

  const warmupConfig = getDeckWarmupConfig();
  if (warmupConfig.enabled) {
    const warmupModel = warmupConfig.model || activeModel;
    try {
      const warmupStart = Date.now();
      await generateCompletion({
        model: warmupModel,
        prompt: warmupConfig.prompt,
        max_tokens: warmupConfig.maxTokens,
        reasoningEffort,
        verbosity,
        maxAttempts: 1,
      });
      console.log(
        `[Runner] 🔥 Warmup concluído em ${Date.now() - warmupStart}ms`
      );
    } catch (warmupError) {
      console.warn(
        `[Runner] ⚠️ Warmup falhou: ${warmupError?.message || warmupError}`
      );
    }
  }

  // ⭐ BUG FIX: Garantir que temos items para todos os tiles do template
  const expandedItems = Array.from({ length: total }, (_, i) => {
    if (i < itemsCount && items[i]) {
      return { ...items[i], orderIndex: i };
    }
    // Criar item vazio para tiles restantes do template
    return { orderIndex: i };
  });

  console.log(
    `[Runner] 📊 Items originais: ${itemsCount}, Template tiles: ${templateTilesCount}, Total a processar: ${total}`
  );

  let current = 0;
  onStatus?.({
    jobId,
    status: "RUNNING",
    progress: { current, total, remaining: total },
    scope,
    generationMode: normalizedGenerationMode,
  });

  // ⭐ NOVO: Construir contexto dos items (primeiro item tem os dados do form)
  // ⭐ CORREÇÃO: Encontrar o primeiro item que tenha dados válidos (não apenas orderIndex)
  // ⭐ BUG FIX: Buscar em expandedItems, mas priorizar items originais com dados
  let firstItem = (Array.isArray(items) ? items : []).find(
    (item) =>
      item &&
      (item.researchTarget ||
        item.company ||
        item.name ||
        item.researchWebsite ||
        item.companyWebsite ||
        item.solution)
  );

  // Se não encontrou, usar o primeiro item mesmo que vazio
  if (!firstItem && expandedItems.length > 0) {
    firstItem =
      expandedItems.find(
        (item) =>
          item &&
          (item.researchTarget ||
            item.company ||
            item.name ||
            item.researchWebsite ||
            item.companyWebsite ||
            item.solution)
      ) || expandedItems[0];
  }

  firstItem = firstItem || {};

  // Log resumido do item (apenas campos principais)
  console.log(`[Runner] 🔍 Item:`, {
    target: firstItem.researchTarget || firstItem.target || "N/A",
    company:
      typeof firstItem.company === "object"
        ? firstItem.company?.name || "N/A"
        : firstItem.company || "N/A",
    solution: firstItem.solution || "N/A",
  });

  // ⭐ CORREÇÃO: Construir contexto no formato esperado pelos prompts
  // Templates usam {company.name} e {company.website}, então precisamos context.company
  const companyName =
    firstItem.researchTarget || firstItem.company || firstItem.name || "";
  // ⭐ CORREÇÃO: Formatar URL corretamente (adicionar http:// se necessário)
  let companyWebsite =
    firstItem.researchWebsite ||
    firstItem.companyWebsite ||
    firstItem.website ||
    "";

  // Garantir que URL tenha protocolo
  if (companyWebsite && !companyWebsite.match(/^https?:\/\//i)) {
    companyWebsite = `https://${companyWebsite}`;
    console.log(`[Runner] 🔗 URL formatada: "${companyWebsite}"`);
  }

  // ⭐ CORREÇÃO: Construir contexto preservando company como objeto
  // O spread de firstItem pode sobrescrever company com string, então precisamos garantir ordem
  const context = {
    // ⭐ Formato legado primeiro (para backward compatibility)
    companyWebsite,
    solution: firstItem.solution || "",
    researchTarget: companyName,
    researchWebsite: companyWebsite,
    sellingSolutionsFor: firstItem.solution || "",
    salesRepAt: firstItem.company || firstItem.salesRepAt || "",

    // ⭐ Spread do firstItem DEPOIS (mas não vamos deixar sobrescrever company)
    ...firstItem,

    // ⭐ Formato dinâmico: {company.name} e {company.website} - PRINCIPAL
    // ⭐ CORREÇÃO CRÍTICA: Sempre garantir que company seja objeto, não string
    // Isso deve vir DEPOIS do spread para sobrescrever qualquer string
    company: {
      name: companyName,
      website: companyWebsite,
    },
  };

  // Log resumido do contexto (apenas valores principais)
  console.log(`[Runner] 📝 Contexto:`, {
    company: context.company.name,
    website: context.company.website,
    solution: context.solution,
    researchTarget: context.researchTarget,
  });

  // ⭐ FASE 3: Array para coletar tiles falhos para retry pós-processamento
  const failedTiles = [];

  const processTile = async (orderIndex) => {
    const item = expandedItems[orderIndex] || {};
    const itemId = `${jobId}_${orderIndex}`;
    const tileStartTime = Date.now();
    let completionMs = null;
    let responseChars = 0;

    try {
      const tile = template.tiles[orderIndex];
      const tileId = tile?.id;
      const maxTokensForTile =
        TILE_TOKEN_LIMITS[tileId] ?? DEFAULT_COMPLETION_MAX_TOKENS;

      if (!tile) {
        console.warn(
          `[Runner] ⚠️ Tile não encontrado para orderIndex=${orderIndex}, pulando...`
        );
        return;
      }

      await appendLog({
        jobId,
        level: "info",
        message: `Runner: processing tile "${tile.title}" (${
          orderIndex + 1
        }/${total})`,
      });

      let prompt;

      if (tile && tile.prompt) {
        prompt = processPromptVariables(tile.prompt, context);
        console.log(
          `[Runner] 📋 Prompt: "${tile.title}" (${prompt.length} chars)`
        );
      } else if (typeof item.prompt === "string") {
        prompt = processPromptVariables(item.prompt, context);
      } else {
        console.warn(
          `[Runner] ⚠️ Nenhum prompt encontrado para tile "${tile.title}", usando JSON do item`
        );
        prompt = JSON.stringify(item);
      }

      console.log(
        `[Runner] 🚀 Tile ${orderIndex + 1}/${total}: "${
          tile?.title || "Unknown"
        }"`
      );

      const fallbackMessage =
        "⚠️ No AI output was generated for this insight. Please regenerate or adjust the prompt.";

      let attempt = 0;
      let finalResult = "";
      let usedFallback = false;
      let attemptsUsed = 0;
      let lastError = null;
      let usageInfo = null;

      while (attempt < TILE_MAX_ATTEMPTS) {
        attempt += 1;
        attemptsUsed = attempt;
        const attemptLabel = `${
          orderIndex + 1
        }/${total} (attempt ${attempt}/${TILE_MAX_ATTEMPTS})`;

        await appendLog({
          jobId,
          level: "info",
          message: `Runner: processing tile "${tile.title}" ${attemptLabel}`,
        });

        let accumulatedResult = "";
        const streamStartTime = Date.now();
        let attemptFailed = false;

        try {
          const completionResult = await generateCompletion({
            model: activeModel,
            prompt,
            max_tokens: maxTokensForTile,
            reasoningEffort,
            verbosity,
          });

          accumulatedResult = completionResult?.content ?? "";
          completionMs =
            completionResult?.totalDurationMs ?? Date.now() - streamStartTime;
          usageInfo = completionResult?.usage ?? usageInfo;
        } catch (error) {
          attemptFailed = true;
          lastError = error;
          console.error(
            `[Runner] ❌ Erro na tentativa ${attempt} para tile ${
              orderIndex + 1
            }:`,
            error
          );
          await appendLog({
            jobId,
            level: "error",
            message: `Runner: attempt ${attempt} failed for tile "${tile.title}" - ${error.message}`,
          });
        }

        const trimmedResult = accumulatedResult.trim();
        const refusalMatch = trimmedResult
          ? TILE_REFUSAL_PATTERNS.some((regex) => regex.test(trimmedResult))
          : false;
        const looksLikeRefusal = refusalMatch && trimmedResult.length < 200;

        const invalidResponse =
          attemptFailed || !trimmedResult || looksLikeRefusal;

        if (!invalidResponse) {
          finalResult = accumulatedResult;
          usedFallback = false;
          responseChars = accumulatedResult.length;
          break;
        }

        const failureReason = attemptFailed
          ? lastError?.message || "stream_error"
          : looksLikeRefusal
          ? "model_refusal"
          : "empty_result";

        console.warn(
          `[Runner] ⚠️ Resposta considerada inválida (${failureReason}) para tile "${tile.title}"`,
          {
            attempt,
            trimmedPreview: trimmedResult.slice(0, 200),
            looksLikeRefusal,
          }
        );

        await appendLog({
          jobId,
          level: "warn",
          message: `Runner: attempt ${attempt} produced invalid response (${failureReason}) for tile "${tile.title}"`,
        });

        if (attempt < TILE_MAX_ATTEMPTS) {
          const backoff =
            Math.min(Math.pow(2, attempt) * 500, 4000) +
            Math.floor(Math.random() * 200);
          if (attempt === 1) {
            console.log(
              `[Runner] 🔁 Retry tile ${
                orderIndex + 1
              }/${total} em ${backoff}ms`
            );
          }
          await sleep(backoff);
          continue;
        }

        if (completionMs === null) {
          completionMs = Date.now() - streamStartTime;
        }

        failedTiles.push({
          orderIndex,
          tile,
          prompt,
          context,
          failureReason: attemptFailed
            ? lastError?.message || "stream_error"
            : looksLikeRefusal
            ? "model_refusal"
            : "empty_response",
          attemptsUsed,
          fallbackMessage,
          usage: usageInfo,
        });

        finalResult = fallbackMessage;
        usedFallback = true;
        responseChars = finalResult.length;
        break;
      }

      if (!finalResult) {
        failedTiles.push({
          orderIndex,
          tile,
          prompt,
          context,
          failureReason: "empty_result",
          attemptsUsed,
          fallbackMessage,
          usage: usageInfo,
        });

        finalResult = fallbackMessage;
        usedFallback = true;
        responseChars = finalResult.length;
      }

      const totalDurationMs = Date.now() - tileStartTime;
      const metricsSummary = {
        model: activeModel,
        attempts: attemptsUsed,
        fallback: usedFallback,
        lastError: usedFallback && lastError ? lastError.message : undefined,
        ttftMs: null,
        completionMs: completionMs ?? totalDurationMs,
        totalDurationMs,
        responseChars,
        estimatedTokens: estimateTokensFromText(finalResult),
        chunkCount: 0,
        promptTokens: usageInfo?.prompt_tokens ?? null,
        completionTokens: usageInfo?.completion_tokens ?? null,
        totalTokens: usageInfo?.total_tokens ?? null,
      };

      await appendLog({
        jobId,
        level: "debug",
        message: `Runner metrics for tile ${orderIndex + 1}/${total}`,
        metadata: {
          orderIndex,
          attempts: attemptsUsed,
          fallback: usedFallback,
          completionMs: completionMs ?? totalDurationMs,
          totalDurationMs,
          responseChars,
          promptTokens: usageInfo?.prompt_tokens ?? null,
          completionTokens: usageInfo?.completion_tokens ?? null,
          totalTokens: usageInfo?.total_tokens ?? null,
        },
      });

      await onResult?.({
        jobId,
        itemId,
        orderIndex,
        title: tile?.title || `Insight ${orderIndex + 1}`,
        result: finalResult,
        generationMode: normalizedGenerationMode,
        metrics: metricsSummary,
      });

      current += 1;
      onStatus?.({
        jobId,
        status: "RUNNING",
        progress: { current, total, remaining: Math.max(total - current, 0) },
        scope,
        generationMode: normalizedGenerationMode,
      });
    } catch (error) {
      await appendLog({
        jobId,
        level: "error",
        message: `Runner error on orderIndex=${orderIndex}: ${
          error?.message || String(error)
        }`,
      });
      onError?.({
        jobId,
        itemId,
        orderIndex,
        error: { message: error?.message || "unknown" },
        generationMode: normalizedGenerationMode,
      });
    }
  };

  if (shouldProcessInParallel) {
    const activeTasks = new Set();
    const pendingTasks = [];

    for (let i = 0; i < total; i++) {
      const task = processTile(i).finally(() => {
        activeTasks.delete(task);
      });
      activeTasks.add(task);
      pendingTasks.push(task);

      if (activeTasks.size >= concurrency) {
        await Promise.race(activeTasks);
      }
    }

    if (pendingTasks.length > 0) {
      await Promise.all(pendingTasks);
    }
  } else {
    for (let i = 0; i < total; i++) {
      await processTile(i);
    }
  }

  onCompleted?.({
    jobId,
    status: "COMPLETED",
    progress: { current: total, total, remaining: 0 },
    scope,
    generationMode: normalizedGenerationMode,
  });

  // ⭐ FASE 3: Retry assíncrono pós-processamento para tiles falhos
  if (failedTiles.length > 0) {
    console.log(
      `[Runner] 🔄 Iniciando retry assíncrono para ${failedTiles.length} tiles falhos...`
    );

    // Emitir evento de retry iniciado
    onStatus?.({
      jobId,
      status: "RETRYING",
      progress: {
        current: total - failedTiles.length,
        total,
        remaining: failedTiles.length,
      },
      scope,
      generationMode: normalizedGenerationMode,
    });

    // Processar retries individualmente, assíncrono
    (async () => {
      const RETRY_MAX_ATTEMPTS = 2; // 2 tentativas adicionais
      let retrySuccessCount = 0;
      let retryFailedCount = 0;
      let fallbackCompletedCount = 0;

      for (const failedTile of failedTiles) {
        const {
          orderIndex,
          tile,
          prompt,
          attemptsUsed,
          fallbackMessage: storedFallbackMessage,
        } = failedTile;

        console.log(
          `[Runner] 🔁 Retry tile ${orderIndex + 1}/${total}: "${tile.title}"`
        );

        let retrySuccess = false;
        let retryAttempt = 0;
        const tileId = tile?.id;
        const maxTokensForTile =
          TILE_TOKEN_LIMITS[tileId] ?? DEFAULT_COMPLETION_MAX_TOKENS;

        while (retryAttempt < RETRY_MAX_ATTEMPTS && !retrySuccess) {
          retryAttempt += 1;

          try {
            let accumulatedResult = "";
            const completionResult = await generateCompletion({
              model: activeModel,
              prompt,
              max_tokens: maxTokensForTile,
              reasoningEffort,
              verbosity,
            });
            accumulatedResult = completionResult?.content ?? "";

            const trimmedResult = accumulatedResult.trim();
            const looksLikeRefusal = trimmedResult
              ? TILE_REFUSAL_PATTERNS.some((regex) => regex.test(trimmedResult))
              : true;

            if (trimmedResult && !looksLikeRefusal) {
              // Retry bem-sucedido!
              retrySuccess = true;
              retrySuccessCount++;

              console.log(
                `[Runner] ✅ Retry bem-sucedido para tile ${
                  orderIndex + 1
                } (tentativa ${retryAttempt}/${RETRY_MAX_ATTEMPTS})`
              );

              // Emitir resultado
              await onResult?.({
                jobId,
                itemId: `${jobId}_${orderIndex}`,
                orderIndex,
                title: tile?.title || `Insight ${orderIndex + 1}`,
                result: accumulatedResult,
                generationMode: normalizedGenerationMode,
                metrics: {
                  model: activeModel,
                  attempts: attemptsUsed + retryAttempt,
                  fallback: false,
                  retried: true,
                },
              });

              await appendLog({
                jobId,
                level: "info",
                message: `Runner: retry successful for tile "${tile.title}" (attempt ${retryAttempt}/${RETRY_MAX_ATTEMPTS})`,
              });
            } else {
              console.log(
                `[Runner] ⚠️ Retry ${retryAttempt}/${RETRY_MAX_ATTEMPTS} para tile ${
                  orderIndex + 1
                } ainda inválido`
              );
            }
          } catch (error) {
            console.error(
              `[Runner] ❌ Erro no retry ${retryAttempt}/${RETRY_MAX_ATTEMPTS} para tile ${
                orderIndex + 1
              }:`,
              error
            );
          }

          // Backoff entre tentativas de retry
          if (!retrySuccess && retryAttempt < RETRY_MAX_ATTEMPTS) {
            const backoff = Math.min(Math.pow(2, retryAttempt) * 500, 2000);
            await sleep(backoff);
          }
        }

        if (!retrySuccess) {
          const fallbackResult =
            storedFallbackMessage ||
            "⚠️ No AI output was generated for this insight. Please regenerate or adjust the prompt.";

          fallbackCompletedCount++;

          console.log(
            `[Runner] ⚠️ Persistindo fallback para tile ${
              orderIndex + 1
            } após retries esgotarem.`
          );

          await appendLog({
            jobId,
            level: "warn",
            message: `Runner: retries exhausted for tile "${tile.title}". Persisting fallback message.`,
          });

          await onResult?.({
            jobId,
            itemId: `${jobId}_${orderIndex}`,
            orderIndex,
            title: tile?.title || `Insight ${orderIndex + 1}`,
            result: fallbackResult,
            generationMode: normalizedGenerationMode,
            metrics: {
              model: activeModel,
              attempts: attemptsUsed + RETRY_MAX_ATTEMPTS,
              fallback: true,
              retried: true,
              retryExhausted: true,
            },
          });
        }
      }

      const finalStatus =
        retryFailedCount > 0
          ? "COMPLETED_WITH_FAILURES"
          : fallbackCompletedCount > 0
          ? "COMPLETED_WITH_WARNINGS"
          : "COMPLETED";

      // Emitir status final do retry
      const finalTotal = total - retryFailedCount;
      onStatus?.({
        jobId,
        status: finalStatus,
        progress: {
          current: total - retryFailedCount,
          total: finalTotal,
          remaining: 0,
          tilesFailed: retryFailedCount,
          tilesWithFallback: fallbackCompletedCount,
        },
        scope,
        generationMode: normalizedGenerationMode,
      });

      console.log(
        `[Runner] ✅ Retry pós-processamento concluído: ${retrySuccessCount} sucessos, ${retryFailedCount} falhas, ${fallbackCompletedCount} com fallback`
      );
    })();
  }
}

const runner = { runJob };
setDeckEngineRunner(runner);

export default runner;
