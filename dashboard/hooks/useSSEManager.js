import { useEffect, useRef } from "react";

const MAX_RETRIES = 1; // ⭐ REDUZIDO: De 2 para 1 para ativar polling IMEDIATAMENTE
const RETRY_DELAY_BASE_MS = 500; // Base para backoff exponencial
const PERMANENT_ERROR_THRESHOLD_MS = 3000; // ⭐ REDUZIDO: 3s sem conexão = erro permanente (era 10s)

export function useSSEManager(streamUrl, listeners = {}, options = {}) {
  const eventSourceRef = useRef(null);
  const retryRef = useRef({
    attempts: 0,
    timeoutId: null,
    firstErrorTime: null, // ⭐ NOVO: Tempo do primeiro erro
  });
  const stoppedRef = useRef(false);
  const listenersRef = useRef(listeners || {});
  const optionsRef = useRef(options || {});

  // Sincronizar refs antes de qualquer uso
  useEffect(() => {
    if (listeners && typeof listeners === "object") {
      listenersRef.current = listeners;
    }
  }, [listeners]);

  useEffect(() => {
    if (options && typeof options === "object") {
      optionsRef.current = options;
    }
  }, [options]);

  useEffect(() => {
    // Validar streamUrl antes de tentar conectar
    if (
      !streamUrl ||
      typeof streamUrl !== "string" ||
      streamUrl.trim() === ""
    ) {
      return;
    }

    stoppedRef.current = false;

    const cleanup = () => {
      stoppedRef.current = true;
      if (retryRef.current.timeoutId) {
        clearTimeout(retryRef.current.timeoutId);
        retryRef.current.timeoutId = null;
      }
      if (eventSourceRef.current) {
        console.log("[useSSEManager] Closing SSE connection.");
        try {
          eventSourceRef.current.close();
        } catch {}
        eventSourceRef.current = null;
      }
    };

    const connect = () => {
      if (stoppedRef.current) return;

      let eventSource;
      try {
        console.log("[useSSEManager] 🔌 Criando EventSource...", streamUrl);
        eventSource = new EventSource(streamUrl);
      } catch (error) {
        console.error("[useSSEManager] Failed to create EventSource:", error);
        // Tentar novamente após delay
        const delay = Math.min(
          Math.pow(2, retryRef.current.attempts + 1) * 500,
          5000
        );
        retryRef.current.timeoutId = setTimeout(connect, delay);
        return;
      }

      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("[useSSEManager] SSE connection opened.");
        retryRef.current.attempts = 0;
        retryRef.current.firstErrorTime = null; // ⭐ NOVO: Resetar tempo do primeiro erro
        if (retryRef.current.timeoutId) {
          clearTimeout(retryRef.current.timeoutId);
          retryRef.current.timeoutId = null;
        }
        const currentOptions = optionsRef.current;
        if (typeof currentOptions?.onReconnect === "function") {
          currentOptions.onReconnect();
        }
      };

      eventSource.onerror = (error) => {
        const readyState = eventSource.readyState;

        // ⭐ NOVO: Registrar tempo do primeiro erro
        if (!retryRef.current.firstErrorTime) {
          retryRef.current.firstErrorTime = Date.now();
        }

        const timeSinceFirstError =
          Date.now() - (retryRef.current.firstErrorTime || Date.now());
        const isPermanentError =
          timeSinceFirstError > PERMANENT_ERROR_THRESHOLD_MS;

        console.error(
          `[useSSEManager] SSE error (readyState: ${readyState}, timeSinceFirstError: ${Math.round(
            timeSinceFirstError / 1000
          )}s):`,
          error
        );

        // ⭐ CRÍTICO: Se SSE está CLOSED (2) OU erro persiste há muito tempo, ativar polling IMEDIATAMENTE
        // readyState: 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
        // Se está CLOSED ou erro persiste > 3s, ativar polling
        if (readyState === EventSource.CLOSED || isPermanentError) {
          const reason =
            readyState === EventSource.CLOSED
              ? `SSE closed by server (readyState: ${readyState})`
              : `Erro permanente após ${Math.round(
                  timeSinceFirstError / 1000
                )}s`;
          console.warn(
            `[useSSEManager] ⚠️ ${reason}. Ativando fallback imediatamente.`
          );
          const currentOptions = optionsRef.current;
          if (typeof currentOptions?.onPermanentError === "function") {
            currentOptions.onPermanentError(error);
          }
          cleanup();
          return;
        }

        // ⭐ NOVO: Se readyState é 0 (CONNECTING) e já tentou várias vezes, ativar polling
        // Isso acontece quando SSE não consegue conectar
        if (readyState === EventSource.CONNECTING) {
          const attempts = retryRef.current.attempts + 1;
          retryRef.current.attempts = attempts;

          if (attempts > MAX_RETRIES) {
            console.warn(
              `[useSSEManager] ⚠️ SSE não conseguiu conectar após ${attempts} tentativas (readyState: ${readyState}). Ativando fallback.`
            );
            const currentOptions = optionsRef.current;
            if (typeof currentOptions?.onPermanentError === "function") {
              currentOptions.onPermanentError(error);
            }
            cleanup();
            return;
          }

          // Tentar reconectar após delay curto
          const delay = Math.min(
            Math.pow(2, attempts) * RETRY_DELAY_BASE_MS,
            1000 // Reduzido para 1s máximo quando CONNECTING
          );
          const jitter = Math.floor(Math.random() * 200);
          const waitFor = delay + jitter;
          console.debug(
            `[useSSEManager] Retrying SSE connection in ${waitFor}ms (attempt ${attempts}/${MAX_RETRIES}, readyState: ${readyState})`
          );
          retryRef.current.timeoutId = setTimeout(connect, waitFor);
          return;
        }

        // Se não está CLOSED nem CONNECTING, pode ser um erro temporário
        // Fechar e tentar reconectar
        eventSource.close();

        const attempts = retryRef.current.attempts + 1;
        retryRef.current.attempts = attempts;

        // ⭐ CRÍTICO: Reduzir MAX_RETRIES para ativar polling mais rápido
        if (attempts > MAX_RETRIES) {
          console.warn(
            "[useSSEManager] Max retry attempts reached. Triggering fallback."
          );
          const currentOptions = optionsRef.current;
          if (typeof currentOptions?.onPermanentError === "function") {
            currentOptions.onPermanentError(error);
          }
          cleanup();
          return;
        }

        // ⭐ REDUZIDO: Delay máximo reduzido para ativar polling mais rápido
        const delay = Math.min(
          Math.pow(2, attempts) * RETRY_DELAY_BASE_MS,
          2000 // Reduzido de 5000 para 2000ms
        );
        const jitter = Math.floor(Math.random() * 200);
        const waitFor = delay + jitter;
        console.debug(
          `[useSSEManager] Retrying SSE connection in ${waitFor}ms (attempt ${attempts}/${MAX_RETRIES})`
        );

        retryRef.current.timeoutId = setTimeout(connect, waitFor);
      };

      Object.entries(listenersRef.current).forEach(([eventName, handler]) => {
        if (typeof handler !== "function") return;
        eventSource.addEventListener(eventName, (event) => {
          try {
            const parsedData = JSON.parse(event.data || "{}");
            const currentHandler = listenersRef.current[eventName];
            if (typeof currentHandler === "function") {
              currentHandler(parsedData);
            }
          } catch (err) {
            console.error(
              `[useSSEManager] Error parsing SSE data for event ${eventName}:`,
              err
            );
          }
        });
      });
    };

    connect();

    return () => {
      cleanup();
    };
  }, [streamUrl]);

  const stopSSE = () => {
    if (retryRef.current.timeoutId) {
      clearTimeout(retryRef.current.timeoutId);
      retryRef.current.timeoutId = null;
    }
    if (eventSourceRef.current) {
      console.log("[useSSEManager] Manually closing SSE connection.");
      try {
        eventSourceRef.current.close();
      } catch {}
      eventSourceRef.current = null;
    }
    stoppedRef.current = true;
  };

  return { stopSSE };
}
