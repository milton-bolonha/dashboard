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
  console.log(`[Runner] 📋 ========== TEMPLATE CARREGADO ==========`);
  console.log(`[Runner] 📋 Template ID solicitado: ${templateId}`);
  console.log(`[Runner] 📋 Template ID usado: ${actualTemplateId}`);
  console.log(`[Runner] 📋 Template nome: ${template.name}`);
  console.log(
    `[Runner] 📋 Total de tiles no template: ${template.tiles.length}`
  );
  console.log(
    `[Runner] 📋 Tiles disponíveis:`,
    template.tiles.map((t) => t.title)
  );
  console.log(`[Runner] 📋 ======================================`);

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

  console.log(`[Runner] 🔍 ========== PRIMEIRO ITEM ENCONTRADO ==========`);
  console.log(`[Runner] 🔍 Item completo:`, JSON.stringify(firstItem, null, 2));
  console.log(`[Runner] 🔍 Campos disponíveis:`, Object.keys(firstItem));
  console.log(
    `[Runner] 🔍 Has ResearchTarget: ${!!firstItem.researchTarget} = "${
      firstItem.researchTarget
    }"`
  );
  console.log(
    `[Runner] 🔍 Has Company: ${!!firstItem.company} = "${firstItem.company}"`
  );
  console.log(
    `[Runner] 🔍 Has Solution: ${!!firstItem.solution} = "${
      firstItem.solution
    }"`
  );
  console.log(
    `[Runner] 🔍 Has ResearchWebsite: ${!!firstItem.researchWebsite} = "${
      firstItem.researchWebsite
    }"`
  );
  console.log(
    `[Runner] 🔍 Has CompanyWebsite: ${!!firstItem.companyWebsite} = "${
      firstItem.companyWebsite
    }"`
  );
  console.log(`[Runner] 🔍 ======================================`);

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

  console.log(`[Runner] 📝 ========== CONTEXTO CONSTRUÍDO ==========`);
  console.log(`[Runner] 📝 Company Name: "${context.company.name}"`);
  console.log(`[Runner] 📝 Company Website: "${context.company.website}"`);
  console.log(`[Runner] 📝 Solution: "${context.solution}"`);
  console.log(`[Runner] 📝 Research Target: "${context.researchTarget}"`);
  console.log(`[Runner] 📝 Research Website: "${context.researchWebsite}"`);
  console.log(
    `[Runner] 📝 Selling Solutions For: "${context.sellingSolutionsFor}"`
  );
  console.log(`[Runner] 📝 Sales Rep At: "${context.salesRepAt}"`);
  console.log(
    `[Runner] 📝 Context completo (JSON):`,
    JSON.stringify(context, null, 2)
  );
  console.log(`[Runner] 📝 ======================================`);

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
        console.log(`[Runner] 📋 Prompt gerado para "${tile.title}":`);
        console.log(`[Runner] 📋 Prompt completo:`, prompt);
        console.log(`[Runner] 📋 Prompt length: ${prompt.length} caracteres`);
      } else if (typeof item.prompt === "string") {
        prompt = processPromptVariables(item.prompt, context);
      } else {
        console.warn(
          `[Runner] ⚠️ Nenhum prompt encontrado para tile "${tile.title}", usando JSON do item`
        );
        prompt = JSON.stringify(item);
      }

      // ⭐ LOGS DETALHADOS: Antes de iniciar streaming
      console.log(
        `[Runner] 🚀 ========== INICIANDO TILE ${
          orderIndex + 1
        }/${total} ==========`
      );
      console.log(`[Runner] 📋 Tile: ${tile?.title || "Unknown"}`);
      console.log(
        `[Runner] 📝 Prompt processado:`,
        prompt.substring(0, 200) + "..."
      );
      console.log(`[Runner] 🔧 Model: ${model}`);

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

            if (ix % 50 === 0) {
              console.log(
                `[Runner] 📊 Tile ${
                  orderIndex + 1
                } (attempt ${attempt}): ${ix} chunks recebidos, ${
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

        const streamDuration = Date.now() - streamStartTime;
        console.log(
          `[Runner] ⏱️ Tile ${
            orderIndex + 1
          } attempt ${attempt} finalizado em ${streamDuration}ms (length=${
            accumulatedResult.length
          })`
        );

        const trimmedResult = accumulatedResult.trim();
        const looksLikeRefusal = trimmedResult
          ? TILE_REFUSAL_PATTERNS.some((regex) => regex.test(trimmedResult))
          : true;

        const invalidResponse =
          attemptFailed || !trimmedResult || looksLikeRefusal;

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
          : "empty_response";

        await appendLog({
          jobId,
          level: "warn",
          message: `Runner: attempt ${attempt} produced invalid response (${failureReason}) for tile "${tile.title}"`,
        });

        if (attempt < TILE_MAX_ATTEMPTS) {
          const backoff =
            Math.min(Math.pow(2, attempt) * 500, 4000) +
            Math.floor(Math.random() * 200);
          console.log(
            `[Runner] 🔁 Reattempting tile ${
              orderIndex + 1
            } em ${backoff}ms (reason: ${failureReason})`
          );
          await sleep(backoff);
          continue;
        }

        finalResult = fallbackMessage;
        finalChunks = [{ chunk: fallbackMessage, ix: 0 }];
        usedFallback = true;
        break;
      }

      if (!finalResult) {
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
}

const runner = { runJob };
setDeckEngineRunner(runner);

export default runner;
