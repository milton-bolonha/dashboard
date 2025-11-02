"use client";
import { useEffect, useMemo } from "react";
import { useSSE } from "@/hooks/useSSE";

export default function JobStreamConnector() {
  const params = useMemo(
    () =>
      new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : ""
      ),
    []
  );
  const jobId = params.get("job_id");
  const guestId = params.get("guest_id");
  const token = params.get("token");

  const streamUrl = jobId
    ? `/api/streams/jobs/${jobId}${guestId ? `?guest_id=${guestId}` : ""}${
        token ? `${guestId ? "&" : "?"}token=${token}` : ""
      }`
    : null;

  const listeners = useMemo(
    () => ({
      "job:status": (data) => console.debug("[Admin SSE] job:status", data),
      "job:result-completed": (data) =>
        console.debug("[Admin SSE] job:result-completed", data),
      "job:result-chunk": (data) =>
        console.debug("[Admin SSE] job:result-chunk", data),
      "job:error": (data) => console.warn("[Admin SSE] job:error", data),
    }),
    []
  );

  useSSE(streamUrl, listeners);

  useEffect(() => {
    if (!jobId) {
      console.info("[JobStreamConnector] ⚠️  Nenhum job_id nos parâmetros.");
      return;
    }
    console.debug("[JobStreamConnector] 🔌 Conectando ao stream:", streamUrl);
  }, [jobId, streamUrl]);

  return null; // apenas conecta o SSE e registra eventos
}
