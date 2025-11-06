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

  const hasAllParams = Boolean(jobId && guestId && token);

  const streamUrl = hasAllParams
    ? `/api/streams/jobs/${jobId}?guest_id=${guestId}&token=${token}`
    : null;

  const listeners = useMemo(() => {
    if (!hasAllParams) {
      return {};
    }
    return {
      "job:status": (data) => console.debug("[Admin SSE] job:status", data),
      "job:result-completed": (data) =>
        console.debug("[Admin SSE] job:result-completed", data),
      "job:result-chunk": (data) =>
        console.debug("[Admin SSE] job:result-chunk", data),
      "job:error": (data) => console.warn("[Admin SSE] job:error", data),
    };
  }, [hasAllParams]);

  useSSE(streamUrl, listeners);

  useEffect(() => {
    if (!jobId) {
      console.info("[JobStreamConnector] ⚠️  Nenhum job_id nos parâmetros.");
      return;
    }

    if (!hasAllParams) {
      console.warn("[JobStreamConnector] ⚠️ Parâmetros incompletos para SSE.", {
        jobId,
        guestId,
        tokenPresente: Boolean(token),
      });
      return;
    }
    console.debug("[JobStreamConnector] 🔌 Conectando ao stream:", streamUrl);
  }, [hasAllParams, jobId, guestId, token, streamUrl]);

  return null; // apenas conecta o SSE e registra eventos
}
