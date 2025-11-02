import { sseManager } from "@/lib/sse-manager";

export function emitJobEvent({ guestId, jobId, type, payload, token }) {
  const key = streamKey({ guestId, jobId, token });
  console.debug("[SSE] 🎯 emitJobEvent", {
    key,
    type,
    payload: payload ? Object.keys(payload) : null,
  });
  sseManager.emit(key, type, payload);
}

export function streamKey({ guestId, jobId, token }) {
  const base = guestId ? `guest:${guestId}:job:${jobId}` : `job:${jobId}`;
  return token ? `${base}:token:${token}` : base;
}
