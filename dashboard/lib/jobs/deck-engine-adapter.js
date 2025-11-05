// Ponte com deckEngine: aqui apenas definimos a interface esperada e emitimos eventos.
// A implementação real dos runners deve residir em /deckEngine.

import { emitJobEvent } from "@/lib/jobs/events";
import { appendResult } from "@/lib/db/prompt-results";
import { appendLog } from "@/lib/db/prompt-logs";
import { getDeckEngineRunner } from "@/lib/jobs/deck-engine-bridge";
import "@/lib/jobs/deck-engine-runner-openai"; // registra runner default (side-effect)
import { db } from "@/lib/db";

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
}) {
  const total = Array.isArray(items) ? items.length : 0;
  let successCount = 0;
  let errorCount = 0;

  const resolvedEntityKey = entityKey || "companies";
  const resolvedCompanyName =
    companyName ||
    (Array.isArray(items) && items[0]?.company && items[0].company?.name
      ? items[0].company.name
      : null) ||
    (Array.isArray(items) && items[0]?.target ? items[0].target : null) ||
    (Array.isArray(items) && items[0]?.researchTarget
      ? items[0].researchTarget
      : null);

  const persistTileDirectly = async (tileDoc) => {
    if (!guestId || !resolvedCompanyName) {
      return false;
    }

    const companyQueryField = `workspace_data.${resolvedEntityKey}.name`;
    const tilesField = `workspace_data.${resolvedEntityKey}.$.tiles`;

    try {
      // Remove versões antigas do mesmo tile
      await db.updateOne(
        "guest_workspaces",
        {
          guest_id: guestId,
          [companyQueryField]: resolvedCompanyName,
        },
        {
          $pull: {
            [tilesField]: { id: tileDoc.id },
          },
        }
      );

      const result = await db.updateOne(
        "guest_workspaces",
        {
          guest_id: guestId,
          [companyQueryField]: resolvedCompanyName,
        },
        {
          $push: {
            [tilesField]: tileDoc,
          },
          $inc: { "usage.total_tiles_generated": 1 },
          $set: { updatedAt: new Date() },
        }
      );

      const modified = result?.modifiedCount || 0;

      if (modified === 0) {
        console.warn(
          `[DeckEngine] ⚠️ Tile ${tileDoc.id} não pôde ser salvo diretamente (company=${resolvedCompanyName}).`
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error(
        `[DeckEngine] ❌ Erro ao salvar tile ${tileDoc.id} diretamente no backend:`,
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
      payload: { jobId, status, progress, scope },
      token,
    });
  };

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

        const usedFallback = payload.metrics?.fallback;
        const failureReason =
          payload.metrics?.lastError ||
          (usedFallback ? "model_refusal" : undefined);

        await appendResult({
          jobId,
          itemId: payload.itemId,
          orderIndex: payload.orderIndex,
          status: usedFallback ? "FAILED" : "COMPLETED",
          result: usedFallback ? null : payload.result,
          error: usedFallback ? failureReason : null,
          metrics: payload.metrics,
        });

        if (usedFallback) {
          errorCount++;
          await appendLog({
            jobId,
            level: "warn",
            message: `Tile ${payload.orderIndex} entrou em fallback (${failureReason}).`,
          });

          emitJobEvent({
            guestId,
            jobId,
            type: "job:error",
            payload: {
              jobId,
              itemId: payload.itemId,
              orderIndex: payload.orderIndex,
              error: {
                message:
                  failureReason ||
                  "AI fallback triggered: no usable completion returned.",
              },
              scope,
            },
            token,
          });

          emitStatus("RUNNING_WITH_ERRORS");
          return;
        }

        successCount++;

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
        };

        const persisted = await persistTileDirectly(tileDoc);

        const eventPayload = {
          ...payload,
          title: tileDoc.title,
          persisted,
          entityKey: resolvedEntityKey,
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
        // Atualiza o status de progresso a cada sucesso
        emitStatus("RUNNING");
      },
      onError: async (payload) => {
        errorCount++;
        await appendLog({
          jobId,
          level: "error",
          message: payload?.error?.message || "runner error",
        });
        emitJobEvent({ guestId, jobId, type: "job:error", payload, token });
        // Atualiza o status para refletir que erros ocorreram
        emitStatus("RUNNING_WITH_ERRORS");
      },
      onCompleted: async (payload) => {
        const finalStatus =
          errorCount > 0 ? "COMPLETED_WITH_ERRORS" : "COMPLETED";
        console.log(
          `[DeckEngine] ✅ Job ${jobId} finalizado com status: ${finalStatus} (Sucessos: ${successCount}, Erros: ${errorCount})`
        );

        await appendLog({
          jobId,
          level: "info",
          message: `Job ${jobId} completed with status ${finalStatus}`,
        });

        // Garante que o payload final em 'onCompleted' reflita o estado real
        const finalPayload = {
          ...payload,
          jobId,
          status: finalStatus,
          progress: {
            current: successCount, // Apenas os sucessos contam como 'current' no final
            total,
            remaining: 0,
          },
          scope,
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
