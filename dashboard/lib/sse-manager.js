const MAX_BUFFER_SIZE = 50;

class SSEManager {
  constructor() {
    this.connections = new Map();
    this.buffer = new Map();
  }

  // O handler é a função onEvent(event) que a rota SSE nos passa
  add(key, handler) {
    if (!this.connections.has(key)) {
      this.connections.set(key, new Set());
    }
    this.connections.get(key).add(handler);
    // Log apenas quando conexão é criada (não repetitivo)
    if (this.connections.get(key).size === 1) {
      console.log(`[SSE Manager] ➕ Nova conexão: ${key}`);
    }

    // ⭐ CORREÇÃO: Aguardar um pequeno delay antes de reenviar buffer
    // Isso garante que a conexão SSE esteja totalmente estabelecida
    const bufferedEvents = this.buffer.get(key) || [];
    if (bufferedEvents.length > 0) {
      console.log(
        `[SSE Manager] 🔄 Reenviando ${bufferedEvents.length} eventos do buffer para: ${key}`
      );

      // Usar setTimeout para garantir que a conexão esteja pronta
      setTimeout(() => {
        bufferedEvents.forEach((event, index) => {
          try {
            console.log(
              `[SSE Manager] 📤 Reenviando evento ${index + 1}/${
                bufferedEvents.length
              }: ${event.type}`
            );
            // ⭐ CORREÇÃO: Chamar o handler (onEvent) em vez de controller.enqueue
            handler(event);
          } catch (err) {
            console.error(
              `[SSE Manager] ❌ Erro ao reenviar evento ${
                index + 1
              } do buffer:`,
              err
            );
          }
        });
        this.buffer.set(key, []); // Limpar buffer após envio
        console.log(`[SSE Manager] ✅ Buffer limpo para: ${key}`);
      }, 100); // 100ms de delay para garantir que a conexão esteja pronta
    } else {
      console.log(`[SSE Manager] ℹ️ Nenhum evento no buffer para: ${key}`);
    }
  }

  // O handler é a mesma referência de função passada para o add
  remove(key, handler) {
    const handlers = this.connections.get(key);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.connections.delete(key);
      }
    }
    console.log(
      `[SSE Manager] ➖ Conexão removida: ${key} | Restantes: ${
        handlers?.size || 0
      }`
    );
  }

  emit(key, event) {
    const handlers = this.connections.get(key);
    const hasConnection = handlers && handlers.size > 0;

    // Log eventos de result-completed sempre (para debug)
    const isResultCompleted = event.type === "job:result-completed";

    // Log apenas eventos críticos ou mudanças de estado (não todos os eventos)
    const isCriticalEvent =
      event.type === "job:status" &&
      (event.payload?.status === "COMPLETED" ||
        event.payload?.status === "FAILED" ||
        event.payload?.status === "QUEUED");

    if (isCriticalEvent || !hasConnection || isResultCompleted) {
      console.log(`[SSE Manager] 📤 ${event.type} para '${key}':`, {
        status: event.payload?.status,
        hasConnection,
        orderIndex: event.payload?.orderIndex,
        persisted: event.payload?.persisted,
      });
    }

    if (hasConnection) {
      handlers.forEach((handler) => {
        try {
          // ⭐ CORREÇÃO: Chamar o handler (onEvent)
          handler(event);
        } catch (e) {
          console.error(`[SSE Manager] ❌ Erro ao emitir para ${key}:`, e);
          this.remove(key, handler);
        }
      });
    } else {
      // Armazenar no buffer se não houver conexão
      if (!this.buffer.has(key)) {
        this.buffer.set(key, []);
      }
      const keyBuffer = this.buffer.get(key);
      keyBuffer.push(event);
      if (keyBuffer.length > MAX_BUFFER_SIZE) {
        keyBuffer.shift(); // Manter o buffer no tamanho máximo
      }
      // Log apenas quando buffer está ficando grande
      if (keyBuffer.length % 10 === 0 || keyBuffer.length === 1) {
        console.log(
          `[SSE Manager] 💾 Buffer: ${keyBuffer.length} eventos para '${key}'`
        );
      }
    }
  }
}

// Garantir singleton para o SSEManager, especialmente em ambiente de desenvolvimento com hot-reloading.
// Isso evita que o buffer de eventos seja perdido a cada recarga de módulo.
const g = globalThis;
if (!g.__DASH_SSE_MANAGER__) {
  g.__DASH_SSE_MANAGER__ = new SSEManager();
}

export const sseManager = g.__DASH_SSE_MANAGER__;
