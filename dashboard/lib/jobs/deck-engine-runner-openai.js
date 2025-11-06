import { generateStreamedCompletion } from "@/lib/ai/provider";
import { appendLog } from "@/lib/db/prompt-logs";
import { setDeckEngineRunner } from "@/lib/jobs/deck-engine-bridge";
import {
  getGuestTemplate,
  processPromptVariables,
} from "@/lib/guest-templates";

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

// Runner default baseado no provider de IA com streaming
// Assinatura esperada pelo adapter: runJob({ jobId, templateId, model, items, scope, onStatus, onChunk, onResult, onError, onCompleted })
async function runJob({
  jobId,
  templateId,
  model,
  items,
  scope,
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

  // ⭐ BUG FIX: Usar template.tiles.length como total (8 tiles), não items.length
  // ⭐ Se items.length for menor, criar items vazios para os tiles restantes
  const itemsCount = Array.isArray(items) ? items.length : 0;
  const templateTilesCount = template.tiles.length;
  const total = Math.max(itemsCount, templateTilesCount);

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

  // ⭐ NOVO: Mapear orderIndex para tile do template
  // ⭐ BUG FIX: Usar expandedItems em vez de items
  for (let i = 0; i < total; i++) {
    const item = expandedItems[i] || {};
    const orderIndex = i; // ⭐ SEMPRE usar i como orderIndex (0, 1, 2, ..., 7)
    const itemId = `${jobId}_${orderIndex}`;

    try {
      // ⭐ CORREÇÃO: Usar tile do template baseado no orderIndex
      const tile = template.tiles[orderIndex];

      if (!tile) {
        console.warn(
          `[Runner] ⚠️ Tile não encontrado para orderIndex=${orderIndex}, pulando...`
        );
        continue;
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
        // Processar variáveis do prompt com contexto do item
        prompt = processPromptVariables(tile.prompt, context);
        // Log apenas resumo do prompt (não o conteúdo completo)
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

      // Log resumido apenas no início de cada tile
      console.log(
        `[Runner] 🚀 Tile ${orderIndex + 1}/${total}: "${
          tile?.title || "Unknown"
        }"`
      );

      const fallbackMessage =
        "⚠️ No AI output was generated for this insight. Please regenerate or adjust the prompt.";

      let attempt = 0;
      let finalResult = "";
      let finalChunks = [];
      let usedFallback = false;
      let attemptsUsed = 0;
      let lastError = null;

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
        const collectedChunks = [];
        let ix = 0;
        const streamStartTime = Date.now();
        let attemptFailed = false;

        try {
          for await (const chunk of generateStreamedCompletion({
            model,
            prompt,
          })) {
            const chunkContent =
              typeof chunk === "string"
                ? chunk
                : chunk.chunk || chunk.content || String(chunk);

            collectedChunks.push({ chunk: chunkContent, ix });
            accumulatedResult += chunkContent;
            ix += 1;

            // Log apenas a cada 100 chunks (reduzir spam)
            if (ix % 100 === 0) {
              console.log(
                `[Runner] 📊 Tile ${orderIndex + 1}/${total}: ${ix} chunks, ${
                  accumulatedResult.length
                } chars`
              );
            }
          }
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
        const looksLikeRefusal = refusalMatch && trimmedResult.length < 200; // respostas longas são aceitas mesmo com disclaimers

        const invalidResponse =
          attemptFailed || !trimmedResult || looksLikeRefusal;

        const streamDuration = Date.now() - streamStartTime;
        // Log apenas no final bem-sucedido (não a cada tentativa)
        if (!invalidResponse || attempt === TILE_MAX_ATTEMPTS) {
          console.log(
            `[Runner] ⏱️ Tile ${
              orderIndex + 1
            }/${total}: ${streamDuration}ms, ${accumulatedResult.length} chars`
          );
        }

        if (!invalidResponse) {
          finalResult = accumulatedResult;
          finalChunks = collectedChunks;
          usedFallback = false;
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
          // Log apenas se for a primeira tentativa ou se houver mudança significativa
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

        // ⭐ FASE 3: Coletar tile falho para retry pós-processamento
        // NÃO usar fallback imediatamente, marcar como "pending retry"
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
        });

        // Usar fallback temporariamente, mas será substituído se retry funcionar
        finalResult = fallbackMessage;
        finalChunks = [{ chunk: fallbackMessage, ix: 0 }];
        usedFallback = true;
        break;
      }

      if (!finalResult) {
        // ⭐ FASE 3: Também coletar se finalResult estiver vazio
        failedTiles.push({
          orderIndex,
          tile,
          prompt,
          context,
          failureReason: "empty_result",
          attemptsUsed,
        });

        finalResult = fallbackMessage;
        finalChunks = [{ chunk: fallbackMessage, ix: 0 }];
        usedFallback = true;
      }

      let finalChunkIndex = 0;
      for (const chunkData of finalChunks) {
        onChunk?.({
          jobId,
          itemId,
          orderIndex,
          chunk: chunkData.chunk,
          ix: finalChunkIndex,
          scope,
        });
        finalChunkIndex += 1;
      }

      await onResult?.({
        jobId,
        itemId,
        orderIndex,
        title: tile?.title || `Insight ${orderIndex + 1}`,
        result: finalResult,
        metrics: {
          model,
          attempts: attemptsUsed,
          fallback: usedFallback,
          lastError: usedFallback && lastError ? lastError.message : undefined,
        },
      });

      current += 1;
      onStatus?.({
        jobId,
        status: "RUNNING",
        progress: { current, total, remaining: Math.max(total - current, 0) },
        scope,
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
      });
    }
  }

  onCompleted?.({
    jobId,
    status: "COMPLETED",
    progress: { current: total, total, remaining: 0 },
    scope,
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
    });

    // Processar retries individualmente, assíncrono
    (async () => {
      const RETRY_MAX_ATTEMPTS = 2; // 2 tentativas adicionais
      let retrySuccessCount = 0;
      let retryFailedCount = 0;

      for (const failedTile of failedTiles) {
        const { orderIndex, tile, prompt, context: tileContext } = failedTile;

        console.log(
          `[Runner] 🔁 Retry tile ${orderIndex + 1}/${total}: "${tile.title}"`
        );

        let retrySuccess = false;
        let retryAttempt = 0;

        while (retryAttempt < RETRY_MAX_ATTEMPTS && !retrySuccess) {
          retryAttempt += 1;

          try {
            let accumulatedResult = "";
            const collectedChunks = [];

            for await (const chunk of generateStreamedCompletion({
              model,
              prompt,
            })) {
              const chunkContent =
                typeof chunk === "string"
                  ? chunk
                  : chunk.chunk || chunk.content || String(chunk);
              collectedChunks.push({
                chunk: chunkContent,
                ix: collectedChunks.length,
              });
              accumulatedResult += chunkContent;
            }

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

              // Emitir chunks
              let chunkIndex = 0;
              for (const chunkData of collectedChunks) {
                onChunk?.({
                  jobId,
                  itemId: `${jobId}_${orderIndex}`,
                  orderIndex,
                  chunk: chunkData.chunk,
                  ix: chunkIndex,
                  scope,
                });
                chunkIndex += 1;
              }

              // Emitir resultado
              await onResult?.({
                jobId,
                itemId: `${jobId}_${orderIndex}`,
                orderIndex,
                title: tile?.title || `Insight ${orderIndex + 1}`,
                result: accumulatedResult,
                metrics: {
                  model,
                  attempts: TILE_MAX_ATTEMPTS + retryAttempt,
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
          retryFailedCount++;
          console.log(
            `[Runner] ❌ Retry falhou para tile ${
              orderIndex + 1
            } após ${RETRY_MAX_ATTEMPTS} tentativas. Tile será descartado.`
          );

          await appendLog({
            jobId,
            level: "warn",
            message: `Runner: retry failed for tile "${tile.title}" after ${RETRY_MAX_ATTEMPTS} attempts. Tile will be discarded.`,
          });
        }
      }

      // Emitir status final do retry
      const finalTotal = total - retryFailedCount;
      onStatus?.({
        jobId,
        status: retryFailedCount > 0 ? "COMPLETED_WITH_FAILURES" : "COMPLETED",
        progress: {
          current: total - retryFailedCount,
          total: finalTotal,
          remaining: 0,
          tilesFailed: retryFailedCount,
        },
        scope,
      });

      console.log(
        `[Runner] ✅ Retry pós-processamento concluído: ${retrySuccessCount} sucessos, ${retryFailedCount} falhas`
      );
    })();
  }
}

const runner = { runJob };
setDeckEngineRunner(runner);

export default runner;
