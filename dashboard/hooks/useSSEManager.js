import { useEffect, useRef } from "react";

const MAX_RETRIES = 3;

export function useSSEManager(streamUrl, listeners = {}, options = {}) {
  const eventSourceRef = useRef(null);
  const retryRef = useRef({ attempts: 0, timeoutId: null });
  const listenersRef = useRef(listeners);
  const stoppedRef = useRef(false);

  useEffect(() => {
    listenersRef.current = listeners;
  }, [listeners]);

  useEffect(() => {
    if (!streamUrl) {
      return;
    }

    stoppedRef.current = false;

    const cleanup = async () => {
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

      const eventSource = new EventSource(streamUrl);
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        console.log("[useSSEManager] SSE connection opened.");
        retryRef.current.attempts = 0;
        if (retryRef.current.timeoutId) {
          clearTimeout(retryRef.current.timeoutId);
          retryRef.current.timeoutId = null;
        }
        options.onReconnect?.();
      };

      eventSource.onerror = (error) => {
        console.error("[useSSEManager] SSE error:", error);

        if (eventSource.readyState === EventSource.CLOSED) {
          console.debug("[useSSEManager] SSE closed by server.");
          options.onPermanentError?.(error);
          cleanup()
            .then(() => {})
            .catch(() => {});
          return;
        }

        eventSource.close();

        const attempts = retryRef.current.attempts + 1;
        retryRef.current.attempts = attempts;

        if (attempts > MAX_RETRIES) {
          console.warn(
            "[useSSEManager] Max retry attempts reached. Triggering fallback."
          );
          options.onPermanentError?.(error);
          cleanup()
            .then(() => {})
            .catch(() => {});
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
            currentHandler?.(parsedData);
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
      cleanup().catch(() => {});
    };
  }, [streamUrl, options]);

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
