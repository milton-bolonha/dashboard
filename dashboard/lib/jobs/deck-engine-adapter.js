// Ponte com deckEngine: aqui apenas definimos a interface esperada e emitimos eventos.
// A implementação real dos runners deve residir em /deckEngine.

import { emitJobEvent } from "@/lib/jobs/events";
import { appendResult } from "@/lib/db/prompt-results";
import { appendLog } from "@/lib/db/prompt-logs";
import { getDeckEngineRunner } from "@/lib/jobs/deck-engine-bridge";
import "@/lib/jobs/deck-engine-runner-openai"; // registra runner default (side-effect)

export async function queueJob({
  guestId,
  jobId,
  templateId,
  model,
  items,
  scope,
  token,
}) {
  const total = Array.isArray(items) ? items.length : 0;
  emitJobEvent({
    guestId,
    jobId,
    type: "job:status",
    payload: {
      jobId,
      status: "QUEUED",
      progress: { current: 0, total },
      scope,
    },
    token,
  });
  await appendLog({
    jobId,
    level: "info",
    message: `Job ${jobId} queued (${total} items)`,
  });
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
        await appendResult({
          jobId,
          itemId: payload.itemId,
          orderIndex: payload.orderIndex,
          status: "COMPLETED",
          result: payload.result,
          error: null,
          metrics: payload.metrics,
        });
        emitJobEvent({
          guestId,
          jobId,
          type: "job:result-completed",
          payload,
          token,
        });
      },
      onError: async (payload) => {
        await appendLog({
          jobId,
          level: "error",
          message: payload?.error?.message || "runner error",
        });
        emitJobEvent({ guestId, jobId, type: "job:error", payload, token });
      },
      onCompleted: async (payload) => {
        await appendLog({
          jobId,
          level: "info",
          message: `Job ${jobId} completed`,
        });
        emitJobEvent({ guestId, jobId, type: "job:status", payload, token });
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
      // eslint-disable-next-line no-await-in-loop
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
