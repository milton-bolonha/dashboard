// Ponte com deckEngine: aqui apenas definimos a interface esperada e emitimos eventos.
// A implementação real dos runners deve residir em /deckEngine.

import { emitJobEvent } from "@/lib/jobs/events";
import { appendResult } from "@/lib/db/prompt-results";
import { appendLog } from "@/lib/db/prompt-logs";
import { getDeckEngineRunner } from "@/lib/jobs/deck-engine-bridge";
import "@/lib/jobs/deck-engine-runner-openai"; // registra runner default (side-effect)
import { db } from "@/lib/db";
import { invalidateWorkspaceCache } from "@/lib/workspace-cache";
import { getGuestTemplate } from "@/lib/guest-templates";
import { resolveGenerationMode } from "@/config/deck-engine";

export async function queueJob({
  guestId,
  jobId,
  templateId,
  model,
  items,
  scope,
  token,
  entityKey = "companies",
  companyName = null,
  generationMode = undefined,
}) {
  const normalizedGenerationMode = resolveGenerationMode(generationMode);

  console.log(`[DeckEngine] 🚀 queueJob iniciado para job ${jobId}`, {
    guestId,
    templateId,
    model,
    itemsCount: Array.isArray(items) ? items.length : 0,
    entityKey,
    companyName,
    generationMode: normalizedGenerationMode,
  });

  // ⭐ CORREÇÃO CRÍTICA: Calcular total baseado no template, não em items.length
  // O template tem 8 tiles, mas items.length é 1 (apenas dados do form)
  let actualTemplateId = templateId;
  if (
    templateId === "tpl_classic_default" ||
    templateId === "tpl_dynamic_default"
  ) {
    actualTemplateId = "template_1"; // Usar template_1 que tem 8 tiles
  }
  const template = getGuestTemplate(actualTemplateId);
  const templateTilesCount = template?.tiles?.length || 8; // Fallback para 8 se não encontrar
  const itemsCount = Array.isArray(items) ? items.length : 0;
  const total = Math.max(itemsCount, templateTilesCount); // Usar o maior valor (geralmente templateTilesCount)

  console.log(
    `[DeckEngine] 📊 Total calculado: ${total} (items: ${itemsCount}, template tiles: ${templateTilesCount})`
  );
  let successCount = 0;
  let errorCount = 0;

  const resolvedEntityKey = entityKey || "companies";
  let resolvedCompanyName =
    companyName ||
    (Array.isArray(items) && items[0]?.company && items[0].company?.name
      ? items[0].company.name
      : null) ||
    (Array.isArray(items) && items[0]?.target ? items[0].target : null) ||
    (Array.isArray(items) && items[0]?.researchTarget
      ? items[0].researchTarget
      : null);

  console.log(
    `[DeckEngine] 📋 Resolvido: entityKey="${resolvedEntityKey}", companyName="${resolvedCompanyName}"`
  );

  const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  const toArray = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === "object") return Object.values(value);
    return [];
  };

  const normalizedCompanyName =
    typeof resolvedCompanyName === "string"
      ? resolvedCompanyName.trim().toLowerCase()
      : null;

  let resolvedCompanyId = null;
  let resolvedCompanySlug = null;

  try {
    const targetWorkspace = guestId
      ? await db.findOne("guest_workspaces", { guest_id: guestId })
      : null;

    if (targetWorkspace) {
      const workspaceEntities = toArray(
        targetWorkspace.workspace_data?.[resolvedEntityKey]
      );
      const dynamicEntities = toArray(
        targetWorkspace.dynamicData?.[resolvedEntityKey]
      );

      const candidates = [...workspaceEntities, ...dynamicEntities].filter(
        (entity) => entity && typeof entity === "object"
      );

      const matchedEntity =
        candidates.find((entity) => {
          if (!normalizedCompanyName) return false;
          if (typeof entity.name !== "string") return false;
          return entity.name.trim().toLowerCase() === normalizedCompanyName;
        }) || candidates[0];

      if (matchedEntity) {
        resolvedCompanyId =
          matchedEntity.id ||
          matchedEntity.entityId ||
          (typeof matchedEntity._id === "object"
            ? matchedEntity._id?.toString?.()
            : matchedEntity._id) ||
          null;
        resolvedCompanySlug =
          matchedEntity.slug ||
          matchedEntity.handle ||
          matchedEntity.key ||
          null;

        if (
          !resolvedCompanyName &&
          typeof matchedEntity.name === "string" &&
          matchedEntity.name.trim().length > 0
        ) {
          resolvedCompanyName = matchedEntity.name;
        }
      }
    }
  } catch (resolveError) {
    console.warn(
      `[DeckEngine] ⚠️ Falha ao resolver entidade alvo por ID:`,
      resolveError
    );
  }

  console.log(`[DeckEngine] 🧭 Entidade alvo resolvida`, {
    entityKey: resolvedEntityKey,
    name: resolvedCompanyName,
    id: resolvedCompanyId,
    slug: resolvedCompanySlug,
  });

  const persistTileDirectly = async (tileDoc) => {
    if (!guestId || (!resolvedCompanyName && !resolvedCompanyId)) {
      console.warn(
        `[DeckEngine] ⚠️ persistTileDirectly: faltando identificadores da entidade`,
        {
          guestId,
          resolvedCompanyName,
          resolvedCompanyId,
          entityKey: resolvedEntityKey,
        }
      );
      return false;
    }

    const companyQueryField = `workspace_data.${resolvedEntityKey}.name`;
    const tilesField = `workspace_data.${resolvedEntityKey}.$.tiles`;

    const tileToPersist = {
      ...tileDoc,
      entityId:
        tileDoc.entityId ?? resolvedCompanyId ?? tileDoc.companyId ?? null,
      entityKey: tileDoc.entityKey ?? resolvedEntityKey,
      entityName:
        tileDoc.entityName ??
        tileDoc.companyName ??
        resolvedCompanyName ??
        null,
    };

    const entityMatchers = [];
    if (resolvedCompanyId) {
      entityMatchers.push({ id: resolvedCompanyId });
      entityMatchers.push({ entityId: resolvedCompanyId });
    }
    if (resolvedCompanySlug) {
      entityMatchers.push({ slug: resolvedCompanySlug });
      entityMatchers.push({ handle: resolvedCompanySlug });
      entityMatchers.push({ key: resolvedCompanySlug });
    }
    if (resolvedCompanyName) {
      entityMatchers.push({ name: resolvedCompanyName });
      entityMatchers.push({
        name: new RegExp(`^${escapeRegExp(resolvedCompanyName.trim())}$`, "i"),
      });
    }

    const baseFilter = { guest_id: guestId };
    if (entityMatchers.length > 0) {
      const elemMatch =
        entityMatchers.length === 1
          ? entityMatchers[0]
          : { $or: entityMatchers };
      baseFilter[`workspace_data.${resolvedEntityKey}`] = {
        $elemMatch: elemMatch,
      };
    } else if (resolvedCompanyName) {
      baseFilter[companyQueryField] = resolvedCompanyName;
    }

    const matchersForLog = entityMatchers.map((matcher) =>
      Object.fromEntries(
        Object.entries(matcher).map(([key, value]) => [
          key,
          value instanceof RegExp ? value.toString() : value,
        ])
      )
    );

    try {
      console.log(
        `[DeckEngine] 💾 Tentando salvar tile ${tileToPersist.id} para entidade "${resolvedCompanyName}"`,
        {
          guestId,
          entityKey: resolvedEntityKey,
          companyQueryField,
          tilesField,
          tileTitle: tileToPersist.title,
          resolvedCompanyId,
          resolvedCompanySlug,
          filterHasElemMatch: Boolean(
            baseFilter[`workspace_data.${resolvedEntityKey}`]
          ),
          matchers: matchersForLog,
        }
      );

      // Remove versões antigas do mesmo tile
      await db.updateOne(
        "guest_workspaces",
        { ...baseFilter },
        {
          $pull: {
            [tilesField]: { id: tileToPersist.id },
          },
        }
      );

      const result = await db.updateOne(
        "guest_workspaces",
        { ...baseFilter },
        {
          $push: {
            [tilesField]: tileToPersist,
          },
          $inc: { "usage.total_tiles_generated": 1 },
          $set: { updatedAt: new Date() },
        }
      );

      const modified = result?.modifiedCount || 0;
      const matched = result?.matchedCount || 0;

      console.log(`[DeckEngine] 📊 Resultado do save:`, {
        tileId: tileToPersist.id,
        companyName: resolvedCompanyName,
        matched,
        modified,
        success: modified > 0,
      });

      if (modified === 0) {
        console.warn(
          `[DeckEngine] ⚠️ Tile ${tileToPersist.id} não pôde ser salvo diretamente (company=${resolvedCompanyName}). Verificando se a company existe...`,
          { matched, modified, result }
        );
        // Verificar se a company existe
        const workspace = await db.findOne("guest_workspaces", {
          guest_id: guestId,
        });
        const companies = workspace?.workspace_data?.[resolvedEntityKey] || [];
        console.warn(
          `[DeckEngine] 📋 Companies encontradas:`,
          companies.map((c) => c.name)
        );
        return false;
      }

      console.log(
        `[DeckEngine] ✅ Tile ${tileToPersist.id} salvo com sucesso (modified=${modified})`
      );

      // ⭐ FASE 4: Invalidar cache após salvar tile
      if (modified > 0) {
        try {
          invalidateWorkspaceCache(guestId, jobId);
        } catch (cacheError) {
          console.warn(`[DeckEngine] ⚠️ Erro ao invalidar cache:`, cacheError);
        }
      }

      return true;
    } catch (error) {
      console.error(
        `[DeckEngine] ❌ Erro ao salvar tile ${tileToPersist.id} diretamente no backend:`,
        error
      );
      return false;
    }
  };

  const emitStatus = (status, customProgress = null) => {
    const progress = customProgress || {
      current: successCount + errorCount,
      total,
      remaining: Math.max(total - (successCount + errorCount), 0),
    };
    emitJobEvent({
      guestId,
      jobId,
      type: "job:status",
      payload: {
        jobId,
        status,
        progress,
        scope,
        generationMode: normalizedGenerationMode,
      },
      token,
    });
  };

  // ⭐ CRÍTICO: Delay reduzido (100ms) apenas para garantir que logs apareçam
  // Background functions já garantem execução assíncrona, então delay longo não é necessário
  // Delay muito longo reduz o tempo útil do SSE (que tem timeout de 10s)
  await new Promise((resolve) => setTimeout(resolve, 100)); // 100ms (reduzido de 500ms)

  emitStatus("QUEUED", { current: 0, total, remaining: total });

  await appendLog({
    jobId,
    level: "info",
    message: `Job ${jobId} queued (${total} items)`,
  });

  emitStatus("RUNNING");

  const runner = getDeckEngineRunner();
  console.debug("[DeckEngine] 🎬 Verificando runner:", {
    hasRunner: !!runner,
    hasRunJob: runner && typeof runner.runJob === "function",
  });
  if (runner && typeof runner.runJob === "function") {
    // Execução via deckEngine real
    console.debug(
      "[DeckEngine] ✅ Usando runner real para job:",
      jobId,
      "items:",
      total
    );
    await runner.runJob({
      jobId,
      templateId,
      model,
      items,
      scope,
      generationMode: normalizedGenerationMode,
      onStatus: (payload) =>
        emitJobEvent({ guestId, jobId, type: "job:status", payload, token }),
      onChunk: (payload) =>
        emitJobEvent({
          guestId,
          jobId,
          type: "job:result-chunk",
          payload,
          token,
        }),
      onResult: async (payload) => {
        const usedFallback = payload.metrics?.fallback;
        const isRetried = payload.metrics?.retried === true;

        console.log(
          `[DeckEngine] 🧪 onResult recebido (orderIndex=${payload.orderIndex})`,
          {
            title: payload.title,
            usedFallback,
            isRetried,
            metrics: payload.metrics,
          }
        );

        // ⭐ FASE 3: Se for retry bem-sucedido, processar normalmente
        if (isRetried && !usedFallback) {
          successCount++;
          await appendResult({
            jobId,
            itemId: payload.itemId,
            orderIndex: payload.orderIndex,
            status: "COMPLETED",
            result: payload.result,
            error: null,
            metrics: payload.metrics,
          });

          const tileDoc = {
            id: `tile_${jobId}_${payload.orderIndex}`,
            title: payload.title || `Insight ${payload.orderIndex + 1}`,
            content: payload.result || "",
            answer: payload.result || "",
            excerpt:
              payload.result?.slice(0, 200) ||
              payload.excerpt ||
              payload.answer?.slice(0, 200) ||
              "",
            orderIndex: payload.orderIndex,
            metrics: payload.metrics,
            createdAt: new Date().toISOString(),
            jobId,
            entityId: resolvedCompanyId ?? null,
            entityKey: resolvedEntityKey,
            entityName: resolvedCompanyName ?? null,
          };

          console.log(
            `[DeckEngine] 💾 Persistindo tile ${tileDoc.id} após retry bem-sucedido...`
          );
          const persisted = await persistTileDirectly(tileDoc);

          if (!persisted) {
            console.warn(
              `[DeckEngine] ⚠️ Persistência falhou para tile ${tileDoc.id}.`,
              {
                orderIndex: payload.orderIndex,
                companyName: resolvedCompanyName,
              }
            );
          }

          const eventPayload = {
            ...payload,
            title: tileDoc.title,
            persisted,
            entityKey: resolvedEntityKey,
            generationMode: normalizedGenerationMode,
          };

          if (persisted) {
            eventPayload.tile = tileDoc;
          }

          emitJobEvent({
            guestId,
            jobId,
            type: "job:result-completed",
            payload: eventPayload,
            token,
          });

          emitStatus("RUNNING");
          return;
        }

        // ⭐ FASE 3: Se usar fallback E não for retry, NÃO persistir imediatamente
        // Aguardar fase de retry antes de decidir
        if (usedFallback && !isRetried) {
          // Não incrementar successCount ainda
          // Não persistir tile ainda
          // Apenas logar para rastreamento
          await appendLog({
            jobId,
            level: "warn",
            message: `Tile ${payload.orderIndex} entrou em fallback. Aguardando retry pós-processamento.`,
          });

          // Não emitir evento de erro ainda - aguardar retry
          return;
        }

        // Tile bem-sucedido (não fallback, não retry)
        successCount++;
        await appendResult({
          jobId,
          itemId: payload.itemId,
          orderIndex: payload.orderIndex,
          status: "COMPLETED",
          result: payload.result,
          error: null,
          metrics: payload.metrics,
        });

        const tileDoc = {
          id: `tile_${jobId}_${payload.orderIndex}`,
          title: payload.title || `Insight ${payload.orderIndex + 1}`,
          content: payload.result || "",
          answer: payload.result || "",
          excerpt:
            payload.result?.slice(0, 200) ||
            payload.excerpt ||
            payload.answer?.slice(0, 200) ||
            "",
          orderIndex: payload.orderIndex,
          metrics: payload.metrics,
          createdAt: new Date().toISOString(),
          jobId,
          entityId: resolvedCompanyId ?? null,
          entityKey: resolvedEntityKey,
          entityName: resolvedCompanyName ?? null,
          generationMode: normalizedGenerationMode,
        };

        console.log(
          `[DeckEngine] 💾 Persistindo tile ${tileDoc.id} diretamente no backend...`
        );
        const persisted = await persistTileDirectly(tileDoc);
        console.log(
          `[DeckEngine] 📊 Tile ${tileDoc.id} persistido: ${persisted}`
        );

        if (!persisted) {
          console.warn(
            `[DeckEngine] ⚠️ Persistência falhou para tile ${tileDoc.id}.`,
            {
              orderIndex: payload.orderIndex,
              companyName: resolvedCompanyName,
            }
          );
        }

        const eventPayload = {
          ...payload,
          title: tileDoc.title,
          persisted,
          entityKey: resolvedEntityKey,
          generationMode: normalizedGenerationMode,
        };

        if (persisted) {
          eventPayload.tile = tileDoc;
        }

        console.log(
          `[DeckEngine] 📤 Emitindo job:result-completed para tile ${tileDoc.id} (persisted=${persisted})`
        );
        emitJobEvent({
          guestId,
          jobId,
          type: "job:result-completed",
          payload: eventPayload,
          token,
        });
        // Atualiza o status de progresso a cada sucesso
        emitStatus("RUNNING");
      },
      onError: async (payload) => {
        errorCount++;
        console.error(
          `[DeckEngine] ❌ onError recebido (orderIndex=${payload?.orderIndex})`,
          payload?.error || payload
        );
        await appendLog({
          jobId,
          level: "error",
          message: payload?.error?.message || "runner error",
        });

        // ⭐ CORREÇÃO: Incluir status e progress no payload do erro
        const errorPayload = {
          ...payload,
          jobId,
          status: "RUNNING_WITH_ERRORS",
          progress: {
            current: successCount + errorCount,
            total,
            remaining: Math.max(total - (successCount + errorCount), 0),
          },
          scope,
          generationMode: normalizedGenerationMode,
        };

        emitJobEvent({
          guestId,
          jobId,
          type: "job:error",
          payload: errorPayload,
          token,
        });
        // Atualiza o status para refletir que erros ocorreram
        emitStatus("RUNNING_WITH_ERRORS");
      },
      onCompleted: async (payload) => {
        // ⭐ FASE 3: Aguardar um pouco para retry pós-processamento começar
        // O retry é assíncrono, então não bloqueamos aqui
        await new Promise((resolve) => setTimeout(resolve, 500));

        const finalStatus =
          errorCount > 0 ? "COMPLETED_WITH_ERRORS" : "COMPLETED";
        const tilesFailed = payload.progress?.tilesFailed || 0;
        const adjustedTotal = total - tilesFailed;

        console.log(
          `[DeckEngine] ✅ Job ${jobId} finalizado com status: ${finalStatus} (Sucessos: ${successCount}, Erros: ${errorCount}, Tiles falhos: ${tilesFailed})`
        );

        await appendLog({
          jobId,
          level: "info",
          message: `Job ${jobId} completed with status ${finalStatus} (tiles failed: ${tilesFailed})`,
        });

        // ⭐ FASE 3: Garante que o payload final reflita tiles falhos
        const finalPayload = {
          ...payload,
          jobId,
          status: finalStatus,
          progress: {
            current: successCount,
            total: adjustedTotal > 0 ? adjustedTotal : total,
            remaining: 0,
            tilesFailed,
          },
          scope,
          generationMode: normalizedGenerationMode,
        };
        emitJobEvent({
          guestId,
          jobId,
          type: "job:status",
          payload: finalPayload,
          token,
        });
      },
    });
    return;
  }

  // Fallback de simulação (se o runner real não estiver registrado)
  console.debug(
    "[DeckEngine] ⚠️  Usando fallback de simulação (runner não encontrado) para job:",
    jobId,
    "items:",
    total
  );
  let current = 0;
  for (let i = 0; i < total; i++) {
    const item = items[i] || {};
    const orderIndex = item.orderIndex ?? i;
    const promptText = JSON.stringify(item);
    await appendLog({
      jobId,
      level: "info",
      message: `Processing item ${i + 1}/${total} (orderIndex=${orderIndex})`,
    });
    const chunks = ["Parte 1...", " Parte 2...", " Fim."];
    for (let ix = 0; ix < chunks.length; ix++) {
      await new Promise((r) => setTimeout(r, 80));
      emitJobEvent({
        guestId,
        jobId,
        type: "job:result-chunk",
        payload: {
          jobId,
          itemId: `${jobId}_${orderIndex}`,
          orderIndex,
          chunk: chunks[ix],
          ix,
          scope,
        },
        token,
      });
    }
    const result = `Resposta para ${promptText}`;
    await appendResult({
      jobId,
      itemId: `${jobId}_${orderIndex}`,
      orderIndex,
      status: "COMPLETED",
      result,
      error: null,
      metrics: { model, ms: chunks.length * 80 },
    });
    emitJobEvent({
      guestId,
      jobId,
      type: "job:result-completed",
      payload: {
        jobId,
        itemId: `${jobId}_${orderIndex}`,
        orderIndex,
        result,
        metrics: { model, ms: chunks.length * 80 },
        scope,
      },
      token,
    });
    current += 1;
    emitJobEvent({
      guestId,
      jobId,
      type: "job:status",
      payload: {
        jobId,
        status: "RUNNING",
        progress: { current, total, remaining: Math.max(total - current, 0) },
        scope,
      },
      token,
    });
  }
  emitJobEvent({
    guestId,
    jobId,
    type: "job:status",
    payload: {
      jobId,
      status: "COMPLETED",
      progress: { current: total, total, remaining: 0 },
      scope,
    },
    token,
  });
  await appendLog({ jobId, level: "info", message: `Job ${jobId} completed` });
}

export async function controlJob({ guestId, jobId, action }) {
  // Integração real: deckEngine.control(jobId, action)
  const status =
    action === "pause"
      ? "PAUSED"
      : action === "resume"
      ? "RUNNING"
      : action === "cancel"
      ? "CANCELLED"
      : "RUNNING";
  emitJobEvent({
    guestId,
    jobId,
    type: "job:status",
    payload: { jobId, status },
  });
}
