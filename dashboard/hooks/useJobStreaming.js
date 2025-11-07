"use client";

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { useSSEManager } from "@/hooks/useSSEManager";
import { cookieModeEnabled } from "@/lib/config/features";

const DEFAULT_PROGRESS = { current: 0, total: 0, remaining: 0 };
const POLLING_INTERVAL_MS = 3000; // ⭐ REDUZIDO: De 4s para 3s para melhor responsividade
const MAX_POLLING_ATTEMPTS = 40;
const POLLING_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos máximo de polling

// ⭐ FASE 2: Polling adaptativo - intervalo aumenta com tentativas
const getAdaptiveInterval = (attempts) => {
  if (attempts < 20) return 3000; // Primeiros 20: 3s
  if (attempts < 40) return 5000; // Próximos 20: 5s
  if (attempts < 60) return 10000; // Próximos 20: 10s
  return 15000; // Depois: 15s
};

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
  if (cookieModeEnabled) {
    return {
      tileProgress: DEFAULT_PROGRESS,
    };
  }

  const [tileProgress, setTileProgress] = useState(DEFAULT_PROGRESS);

  const enableSSE = useMemo(() => {
    if (typeof process === "undefined" || !process?.env) {
      return false;
    }
    const flag = process.env.NEXT_PUBLIC_ENABLE_SSE;
    if (flag === undefined) {
      return false;
    }
    return /^true$/i.test(flag);
  }, []);

  const pollingRef = useRef({
    active: false,
    attempts: 0,
    timeoutId: null,
    startTime: null, // ⭐ NOVO: Tempo de início do polling
  });
  const isGeneratingRef = useRef(false);

  // Definir stopPolling ANTES de qualquer useEffect que o use
  const stopPolling = useCallback((reason = "manual") => {
    if (!pollingRef.current.active) return;
    if (pollingRef.current.timeoutId) {
      clearTimeout(pollingRef.current.timeoutId);
      pollingRef.current.timeoutId = null;
    }
    pollingRef.current.active = false;
    console.log(`[useJobStreaming] 🛑 Polling stopped (${reason}).`);
  }, []);

  useEffect(() => {
    isGeneratingRef.current = isGenerating;
    if (!isGenerating) {
      stopPolling("tiles-ready");
    }
  }, [isGenerating, stopPolling]);

  const startPolling = useCallback(() => {
    if (pollingRef.current.active) {
      console.log(
        "[useJobStreaming] ⚠️ Polling já está ativo. Ignorando startPolling."
      );
      return;
    }
    console.log("[useJobStreaming] 🔄 SSE fallback: starting polling loop...");
    console.log("[useJobStreaming] 📊 Parâmetros:", {
      jobId,
      guestId,
      isGenerating,
    });
    pollingRef.current.active = true;
    pollingRef.current.attempts = 0;
    pollingRef.current.startTime = Date.now(); // ⭐ NOVO: Registrar tempo de início

    const tick = async () => {
      if (!pollingRef.current.active) {
        console.log("[useJobStreaming] 🛑 Polling parado. Abortando tick.");
        return;
      }
      pollingRef.current.attempts += 1;
      console.log(
        `[useJobStreaming] 🔄 Polling tick #${pollingRef.current.attempts}...`
      );

      try {
        await revalidateWorkspace();
        console.log(
          `[useJobStreaming] ✅ Polling tick #${pollingRef.current.attempts} concluído.`
        );
      } catch (error) {
        console.error("[useJobStreaming] ⚠️ Polling error:", error);
      }

      if (!pollingRef.current.active) {
        console.log(
          "[useJobStreaming] 🛑 Polling parado após tick. Abortando."
        );
        return;
      }

      // ⭐ NOVO: Verificar timeout de segurança
      const elapsed = Date.now() - (pollingRef.current.startTime || Date.now());
      if (elapsed > POLLING_TIMEOUT_MS) {
        console.warn(
          `[useJobStreaming] ⚠️ Polling timeout atingido após ${Math.round(
            elapsed / 1000
          )}s. Parando polling.`
        );
        stopPolling("timeout");
        return;
      }

      if (!isGeneratingRef.current) {
        stopPolling("tiles-ready");
        return;
      }

      if (pollingRef.current.attempts >= MAX_POLLING_ATTEMPTS) {
        console.warn(
          `[useJobStreaming] ⚠️ Máximo de tentativas de polling atingido (${MAX_POLLING_ATTEMPTS}). Parando polling.`
        );
        stopPolling("max-attempts");
        return;
      }

      // ⭐ FASE 2: Usar intervalo adaptativo
      const adaptiveInterval = getAdaptiveInterval(pollingRef.current.attempts);
      pollingRef.current.timeoutId = setTimeout(tick, adaptiveInterval);
    };

    tick();
  }, [revalidateWorkspace, stopPolling]);

  useEffect(() => {
    return () => {
      stopPolling("unmount");
    };
  }, [stopPolling]);

  const streamUrl = useMemo(() => {
    if (!enableSSE) return null;
    if (!jobId || !guestId || !token) {
      console.warn(
        "[useJobStreaming] ❌ SSE indisponível: parâmetros faltando",
        {
          jobId,
          guestId,
          tokenPresente: Boolean(token),
        }
      );
      return null;
    }
    const url = `/api/streams/jobs/${jobId}?guest_id=${guestId}&token=${token}`;
    console.log("[useJobStreaming] 🔗 SSE streamUrl gerada:", url);
    return url;
  }, [enableSSE, guestId, jobId, token]);

  useEffect(() => {
    if (!streamUrl) return;

    const controller = new AbortController();

    (async () => {
      try {
        const response = await fetch(streamUrl, {
          method: "HEAD",
          signal: controller.signal,
        });
        console.log(
          `[useJobStreaming] 🧪 HEAD SSE status=${response.status} ok=${response.ok}`
        );
      } catch (error) {
        if (error?.name === "AbortError") return;
        console.error("[useJobStreaming] ❌ HEAD SSE falhou:", error);
      }
    })();

    return () => controller.abort();
  }, [streamUrl]);

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
    console.log(
      "[useJobStreaming] 🚨 SSE permanent error detectado. Ativando polling..."
    );
    try {
      if (typeof startPolling === "function") {
        console.log(
          "[useJobStreaming] ✅ startPolling é uma função. Chamando..."
        );
        startPolling();
      } else {
        console.error(
          "[useJobStreaming] ❌ startPolling não é uma função:",
          typeof startPolling
        );
      }
    } catch (error) {
      console.error("[useJobStreaming] ❌ Error starting polling:", error);
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
    if (!enableSSE || !jobId) return {};
    return {
      "job:status": (payload) => {
        if (payload?.progress) {
          setTileProgress(payload.progress);
          // ⭐ FASE 3: Se houver tiles falhos, o progress já inclui tilesFailed
        }
        if (
          payload?.status === "COMPLETED" ||
          payload?.status === "COMPLETED_WITH_FAILURES" ||
          payload?.status === "COMPLETED_WITH_WARNINGS"
        ) {
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
  }, [
    enableSSE,
    jobId,
    persistTileAndRefresh,
    revalidateWorkspace,
    onTilePersisted,
  ]);

  const sseOptions = useMemo(
    () => ({
      onPermanentError: handleSSEPermanentError,
      onReconnect: handleSSEReconnect,
    }),
    [handleSSEPermanentError, handleSSEReconnect]
  );

  useEffect(() => {
    if ((!enableSSE || !streamUrl) && !pollingRef.current.active) {
      startPolling();
    }
  }, [enableSSE, streamUrl, startPolling]);

  useSSEManager(
    enableSSE && streamUrl ? streamUrl : null,
    sseListeners,
    sseOptions
  );

  return {
    tileProgress,
  };
}
