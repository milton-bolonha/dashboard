import { useEffect, useRef } from "react";

const MAX_RETRIES = 3;

export function useSSEManager(streamUrl, listeners = {}, options = {}) {
  const eventSourceRef = useRef(null);
  const retryRef = useRef({ attempts: 0, timeoutId: null });
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
        console.error(
          `[useSSEManager] SSE error (readyState: ${readyState}):`,
          error
        );

        // ⭐ CORREÇÃO: EventSource.CONNECTING = 0, OPEN = 1, CLOSED = 2
        // Se está CLOSED, pode ser que o servidor fechou a conexão
        // Mas também pode ser um erro temporário de rede
        if (readyState === EventSource.CLOSED) {
          console.debug(
            "[useSSEManager] SSE closed by server or network error."
          );

          // Tentar reconectar apenas se não excedeu o limite de tentativas
          const attempts = retryRef.current.attempts + 1;
          retryRef.current.attempts = attempts;

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

          // Tentar reconectar após delay
          const delay = Math.min(Math.pow(2, attempts) * 500, 5000);
          const jitter = Math.floor(Math.random() * 200);
          const waitFor = delay + jitter;
          console.debug(
            `[useSSEManager] Retrying SSE connection in ${waitFor}ms (attempt ${attempts}/${MAX_RETRIES})`
          );

          retryRef.current.timeoutId = setTimeout(connect, waitFor);
          return;
        }

        // Se não está CLOSED, pode ser um erro temporário
        // Fechar e tentar reconectar
        eventSource.close();

        const attempts = retryRef.current.attempts + 1;
        retryRef.current.attempts = attempts;

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

        const delay = Math.min(Math.pow(2, attempts) * 500, 5000);
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
