import { generateStreamedCompletion } from "@/lib/ai/provider";
import { appendLog } from "@/lib/db/prompt-logs";
import { setDeckEngineRunner } from "@/lib/jobs/deck-engine-bridge";
import {
  getGuestTemplate,
  processPromptVariables,
} from "@/lib/guest-templates";

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
  const total = Array.isArray(items) ? items.length : 0;
  let current = 0;
  onStatus?.({
    jobId,
    status: "RUNNING",
    progress: { current, total, remaining: total },
    scope,
  });

  // ⭐ NOVO: Carregar template do templateId
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

  // ⭐ NOVO: Construir contexto dos items (primeiro item tem os dados do form)
  // ⭐ CORREÇÃO: Encontrar o primeiro item que tenha dados válidos (não apenas orderIndex)
  let firstItem = items.find(
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
  if (!firstItem && items.length > 0) {
    firstItem = items[0];
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
  for (let i = 0; i < total; i++) {
    const item = items[i] || {};
    const orderIndex =
      typeof item.orderIndex === "number" ? item.orderIndex : i;
    const itemId = `${jobId}_${orderIndex}`;

    try {
      await appendLog({
        jobId,
        level: "info",
        message: `Runner: processing item ${
          i + 1
        }/${total} (orderIndex=${orderIndex})`,
      });

      // ⭐ CORREÇÃO: Usar tile do template baseado no orderIndex
      const tile = template.tiles[orderIndex];
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
          `[Runner] ⚠️ Nenhum prompt encontrado, usando JSON do item`
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

      let accumulatedResult = "";
      let ix = 0;
      const streamStartTime = Date.now();

      // ⭐ STREAMING REAL COM LOGS
      for await (const chunk of generateStreamedCompletion({ model, prompt })) {
        // ⭐ CORREÇÃO: chunk já é string (conteúdo), não objeto
        const chunkContent =
          typeof chunk === "string"
            ? chunk
            : chunk.chunk || chunk.content || String(chunk);

        onChunk?.({
          jobId,
          itemId,
          orderIndex,
          chunk: chunkContent,
          ix,
          scope,
        });

        accumulatedResult += chunkContent;
        ix += 1;

        // Log a cada 50 chunks para não poluir muito
        if (ix % 50 === 0) {
          console.log(
            `[Runner] 📊 Tile ${orderIndex + 1}: ${ix} chunks recebidos, ${
              accumulatedResult.length
            } chars`
          );
        }
      }

      const streamDuration = Date.now() - streamStartTime;
      console.log(
        `[Runner] ✅ Tile ${orderIndex + 1} completado em ${streamDuration}ms`
      );
      console.log(
        `[Runner] 📊 Resultado final: ${accumulatedResult.length} caracteres`
      );

      // Usar resultado acumulado em vez de stub
      await onResult?.({
        jobId,
        itemId,
        orderIndex,
        result: accumulatedResult,
        metrics: { model },
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
