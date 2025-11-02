import { useEffect, useRef, useState } from "react";

export function useSSE(streamUrl, listeners = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef(null);
  const retryRef = useRef({ attempts: 0, timeoutId: null });
  // ⭐ CRÍTICO: Usar useRef para listeners estáveis (evita reconexões)
  const listenersRef = useRef(listeners);

  // Atualizar ref quando listeners mudarem (sem causar reconexão)
  useEffect(() => {
    listenersRef.current = listeners;
  }, [listeners]);

  useEffect(() => {
    if (!streamUrl) {
      console.debug("[useSSE] ⏭️  Sem streamUrl, pulando conexão");
      return;
    }

    console.debug("[useSSE] 🚀 Iniciando conexão SSE:", streamUrl);
    console.debug(
      "[useSSE] 📋 Listeners registrados:",
      Object.keys(listenersRef.current)
    );

    function connect() {
      const es = new EventSource(streamUrl);
      eventSourceRef.current = es;

      es.onopen = () => {
        console.debug("[useSSE] ✅ Conectado ao SSE:", streamUrl);
        setIsConnected(true);
        if (retryRef.current.timeoutId) {
          clearTimeout(retryRef.current.timeoutId);
          retryRef.current.timeoutId = null;
        }
        retryRef.current.attempts = 0;
      };
      es.onmessage = (e) => {
        console.debug(
          "[useSSE] 📨 Mensagem recebida (sem event type):",
          e.data?.substring?.(0, 100)
        );
      };
      es.onerror = (err) => {
        // ⭐ CORREÇÃO: Não reconectar se a conexão foi fechada intencionalmente (readyState = 2)
        if (es.readyState === EventSource.CLOSED) {
          console.debug(
            "[useSSE] 🔌 Conexão fechada pelo servidor, não reconectando"
          );
          setIsConnected(false);
          return;
        }

        // ⭐ CORREÇÃO: Limitar tentativas de reconexão (máx 3 tentativas)
        const attempts = Math.min(retryRef.current.attempts + 1, 3);
        retryRef.current.attempts = attempts;

        if (attempts >= 3) {
          console.warn(
            "[useSSE] ❌ Máximo de tentativas alcançado, parando reconexão",
            streamUrl
          );
          setIsConnected(false);
          try {
            es.close();
          } catch {}
          return;
        }

        console.debug(
          "[useSSE] ⚠️ Erro no SSE (tentativa",
          attempts,
          "de 3):",
          streamUrl
        );
        setIsConnected(false);
        try {
          es.close();
        } catch {}

        // backoff exponencial com jitter
        const base = Math.pow(2, attempts) * 500; // 500, 1000, 2000
        const jitter = Math.floor(Math.random() * 200);
        console.debug(
          "[useSSE] 🔄 Tentando reconectar em:",
          base + jitter,
          "ms"
        );
        retryRef.current.timeoutId = setTimeout(connect, base + jitter);
      };

      // ⭐ CRÍTICO: Usar listenersRef.current em vez de listeners direto
      Object.entries(listenersRef.current).forEach(([eventName, handler]) => {
        if (typeof handler !== "function") return;
        console.debug(
          `[useSSE] 📌 Registrando listener para evento: "${eventName}"`
        );
        es.addEventListener(eventName, (e) => {
          console.debug(
            `[useSSE] 📥 Evento "${eventName}" recebido:`,
            e.data?.substring?.(0, 200)
          );
          try {
            const data = JSON.parse(e.data || "{}");
            console.debug(
              `[useSSE] ✅ Chamando handler de "${eventName}" com dados:`,
              data
            );
            // ⭐ CRÍTICO: Usar listenersRef.current para sempre ter os listeners mais recentes
            const currentHandler = listenersRef.current[eventName];
            if (currentHandler && typeof currentHandler === "function") {
              currentHandler(data);
            }
          } catch (parseErr) {
            console.error(
              `[useSSE] ❌ Erro ao parsear JSON do evento "${eventName}":`,
              parseErr,
              "data:",
              e.data
            );
          }
        });
      });
    }

    connect();

    return () => {
      console.debug("[useSSE] 🧹 Cleanup: fechando SSE:", streamUrl);
      if (retryRef.current.timeoutId) {
        clearTimeout(retryRef.current.timeoutId);
        retryRef.current.timeoutId = null;
      }
      try {
        eventSourceRef.current?.close?.();
      } catch {}
      setIsConnected(false);
    };
  }, [streamUrl]); // ⭐ CRÍTICO: Remover listeners da dependência

  return { isConnected };
}
