/**
 * SSE Events Emitter
 * Padroniza a emissão de eventos para o SSE Manager
 */
import { sseManager } from "@/lib/sse-manager";

// ⭐ CORREÇÃO CRÍTICA: A função estava recebendo (key, type, payload) mas estava sendo
// chamada com um objeto único. A assinatura foi corrigida para desestruturar o objeto.
// Throttle para reduzir logs repetitivos
const lastEventLog = new Map();
const EVENT_LOG_THROTTLE = 5000; // Log apenas a cada 5s para eventos repetitivos

export function emitJobEvent({ guestId, jobId, type, payload, token }) {
  if (!guestId || !jobId) {
    console.warn("⚠️ emitJobEvent chamado sem guestId ou jobId");
    return;
  }
  // A chave de conexão não precisa mais do token, mas a chave do evento sim
  // para garantir que estamos emitindo para o canal certo.
  const key = `guest:${guestId}:job:${jobId}`;

  const event = { type, payload };

  // Log apenas eventos críticos ou com throttling para eventos repetitivos
  const isCriticalEvent =
    type === "job:status" &&
    (payload?.status === "COMPLETED" ||
      payload?.status === "FAILED" ||
      payload?.status === "QUEUED");

  const eventKey = `${key}:${type}`;
  const now = Date.now();
  const lastLog = lastEventLog.get(eventKey) || 0;
  const shouldLog = isCriticalEvent || now - lastLog > EVENT_LOG_THROTTLE;

  if (shouldLog) {
    console.log(`[SSE] 🎯 ${type} para '${key}'`, {
      status: payload?.status,
      progress: payload?.progress,
    });
    lastEventLog.set(eventKey, now);
  }

  sseManager.emit(key, event);
}

export function streamKey({ guestId, jobId, token }) {
  const base = guestId ? `guest:${guestId}:job:${jobId}` : `job:${jobId}`;
  return token ? `${base}:token:${token}` : base;
}
