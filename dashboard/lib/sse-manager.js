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
    console.log(
      `[SSE Manager] ➕ Conexão adicionada: ${key} | Total: ${
        this.connections.get(key).size
      }`
    );

    // Reenviar eventos do buffer se houver algum
    const bufferedEvents = this.buffer.get(key) || [];
    if (bufferedEvents.length > 0) {
      console.log(
        `[SSE Manager] 🔄 Reenviando ${bufferedEvents.length} eventos do buffer para: ${key}`
      );
      bufferedEvents.forEach((event) => {
        try {
          // ⭐ CORREÇÃO: Chamar o handler (onEvent) em vez de controller.enqueue
          handler(event);
        } catch (err) {
          console.error(
            "[SSE Manager] ❌ Erro ao reenviar evento do buffer:",
            err
          );
        }
      });
      this.buffer.set(key, []); // Limpar buffer após envio
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

    console.log(`[SSE Manager] 📤 Emitindo para '${key}':`, {
      type: event.type,
      hasConnection,
    });

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
      console.log(
        `[SSE Manager] 💾 Evento bufferizado para '${key}' (Buffer: ${keyBuffer.length})`
      );
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
