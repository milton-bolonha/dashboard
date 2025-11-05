"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useSSEManager } from "@/hooks/useSSEManager";

const DEFAULT_PROGRESS = { current: 0, total: 0, remaining: 0 };
const POLLING_INTERVAL_MS = 4000;
const MAX_POLLING_ATTEMPTS = 40;

/**
 * Hook para gerenciar streaming de jobs via SSE + fallback polling
 * Encapsula toda a lógica de SSE, polling e estado de progresso
 */
export function useJobStreaming({
  jobId,
  guestId,
  token,
  onTilePersisted,
  revalidateWorkspace,
  isGenerating,
}) {
  const [tileProgress, setTileProgress] = useState(DEFAULT_PROGRESS);

  const pollingRef = useRef({ active: false, attempts: 0, timeoutId: null });
  const isGeneratingRef = useRef(false);

  useEffect(() => {
    isGeneratingRef.current = isGenerating;
    if (!isGenerating) {
      stopPolling("tiles-ready");
    }
  }, [isGenerating, stopPolling]);

  const stopPolling = useCallback((reason = "manual") => {
    if (!pollingRef.current.active) return;
    if (pollingRef.current.timeoutId) {
      clearTimeout(pollingRef.current.timeoutId);
      pollingRef.current.timeoutId = null;
    }
    pollingRef.current.active = false;
    console.log(`[useJobStreaming] 🛑 Polling stopped (${reason}).`);
  }, []);

  const startPolling = useCallback(() => {
    if (pollingRef.current.active) return;
    console.log("[useJobStreaming] 🔄 SSE fallback: starting polling loop...");
    pollingRef.current.active = true;
    pollingRef.current.attempts = 0;

    const tick = async () => {
      if (!pollingRef.current.active) return;
      pollingRef.current.attempts += 1;

      try {
        await revalidateWorkspace();
      } catch (error) {
        console.error("[useJobStreaming] ⚠️ Polling error:", error);
      }

      if (!pollingRef.current.active) return;

      if (!isGeneratingRef.current) {
        stopPolling("tiles-ready");
        return;
      }

      if (pollingRef.current.attempts >= MAX_POLLING_ATTEMPTS) {
        stopPolling("max-attempts");
        return;
      }

      pollingRef.current.timeoutId = setTimeout(tick, POLLING_INTERVAL_MS);
    };

    tick();
  }, [revalidateWorkspace, stopPolling]);

  useEffect(() => {
    return () => {
      stopPolling("unmount");
    };
  }, [stopPolling]);

  const streamUrl = useMemo(() => {
    if (!jobId || !guestId || !token) return null;
    return `/api/streams/jobs/${jobId}?guest_id=${guestId}&token=${token}`;
  }, [guestId, jobId, token]);

  const persistTileAndRefresh = useCallback(
    async (payload) => {
      if (!guestId || !jobId) return;

      if (payload?.persisted) {
        // Backend já persistiu o tile, apenas revalidar snapshot
        revalidateWorkspace();
        return;
      }

      // Se o backend não persistiu, não fazemos nada aqui
      // A persistência deve ser feita pelo backend
      revalidateWorkspace();
    },
    [guestId, jobId, revalidateWorkspace]
  );

  const handleSSEPermanentError = useCallback(() => {
    try {
      if (typeof startPolling === "function") {
        startPolling();
      }
    } catch (error) {
      console.error("[useJobStreaming] Error starting polling:", error);
    }
  }, [startPolling]);

  const handleSSEReconnect = useCallback(() => {
    try {
      if (typeof stopPolling === "function") {
        stopPolling("reconnected");
      }
    } catch (error) {
      console.error("[useJobStreaming] Error stopping polling:", error);
    }
  }, [stopPolling]);

  const sseListeners = useMemo(() => {
    if (!jobId) return {};
    return {
      "job:status": (payload) => {
        if (payload?.progress) {
          setTileProgress(payload.progress);
        }
        if (payload?.status === "COMPLETED") {
          revalidateWorkspace();
        }
      },
      "job:result-completed": (payload) => {
        persistTileAndRefresh(payload);
        if (onTilePersisted) {
          onTilePersisted(payload);
        }
      },
    };
  }, [jobId, persistTileAndRefresh, revalidateWorkspace, onTilePersisted]);

  const sseOptions = useMemo(
    () => ({
      onPermanentError: handleSSEPermanentError,
      onReconnect: handleSSEReconnect,
    }),
    [handleSSEPermanentError, handleSSEReconnect]
  );

  useSSEManager(streamUrl, sseListeners, sseOptions);

  return {
    tileProgress,
  };
}
