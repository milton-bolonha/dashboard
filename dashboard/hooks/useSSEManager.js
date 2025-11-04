import { useEffect, useRef } from "react";

export function useSSEManager(streamUrl, listeners) {
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (!streamUrl) {
      return;
    }

    const eventSource = new EventSource(streamUrl);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("[useSSEManager] SSE connection opened.");
    };

    eventSource.onerror = (error) => {
      console.error("[useSSEManager] SSE error:", error);
      eventSource.close();
    };

    // FIX: Attach specific event listeners instead of using a generic onmessage
    Object.keys(listeners).forEach((eventName) => {
      eventSource.addEventListener(eventName, (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          const handler = listeners[eventName];
          if (handler) {
            // The backend sends the data directly, not nested under a 'data' property
            // in the event stream for named events.
            handler(parsedData);
          }
        } catch (error) {
          console.error(
            `[useSSEManager] Error parsing SSE data for event ${eventName}:`,
            error
          );
        }
      });
    });

    return () => {
      if (eventSourceRef.current) {
        console.log("[useSSEManager] Closing SSE connection.");
        eventSourceRef.current.close();
      }
    };
  }, [streamUrl, listeners]);

  const stopSSE = () => {
    if (eventSourceRef.current) {
      console.log("[useSSEManager] Manually closing SSE connection.");
      eventSourceRef.current.close();
    }
  };

  return { stopSSE };
}
