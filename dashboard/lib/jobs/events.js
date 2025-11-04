/**
 * SSE Events Emitter
 * Padroniza a emissão de eventos para o SSE Manager
 */
import { sseManager } from "@/lib/sse-manager";

// ⭐ CORREÇÃO CRÍTICA: A função estava recebendo (key, type, payload) mas estava sendo
// chamada com um objeto único. A assinatura foi corrigida para desestruturar o objeto.
export function emitJobEvent({ guestId, jobId, type, payload, token }) {
  if (!guestId || !jobId) {
    console.warn("⚠️ emitJobEvent chamado sem guestId ou jobId");
    return;
  }
  // A chave de conexão não precisa mais do token, mas a chave do evento sim
  // para garantir que estamos emitindo para o canal certo.
  const key = `guest:${guestId}:job:${jobId}`;

  const event = { type, payload };

  console.log(`[SSE] 🎯 emitJobEvent para '${key}'`, {
    type: event.type,
    payload: Object.keys(event.payload || {}),
  });

  sseManager.emit(key, event);
}

export function streamKey({ guestId, jobId, token }) {
  const base = guestId ? `guest:${guestId}:job:${jobId}` : `job:${jobId}`;
  return token ? `${base}:token:${token}` : base;
}
