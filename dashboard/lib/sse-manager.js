class SSEManager {
  constructor() {
    this.connections = new Map(); // key -> controller
    this.eventBuffer = new Map(); // key -> Array<{ eventType, data, timestamp }>
    this.bufferSize = 50; // máximo de eventos por key
  }

  add(key, controller) {
    this.connections.set(key, controller);
    console.debug(
      "[SSE Manager] ➕ Conexão adicionada:",
      key,
      "total conexões:",
      this.connections.size
    );

    // Reenviar eventos do buffer quando conexão é estabelecida
    const buffered = this.eventBuffer.get(key) || [];
    if (buffered.length > 0) {
      console.debug(
        "[SSE Manager] 🔄 Reenviando",
        buffered.length,
        "eventos do buffer para key:",
        key
      );
      const encoder = new TextEncoder();
      buffered.forEach(({ eventType, data }) => {
        try {
          const message = `event: ${eventType}\ndata: ${JSON.stringify(
            data
          )}\n\n`;
          controller.enqueue(encoder.encode(message));
        } catch (err) {
          console.error(
            "[SSE Manager] ❌ Erro ao reenviar evento do buffer:",
            err
          );
        }
      });
      this.eventBuffer.delete(key); // Limpar após reenvio
    }
  }

  emit(key, eventType, data) {
    console.debug("[SSE Manager] 📤 Tentando emitir:", {
      key,
      eventType,
      hasConnection: this.connections.has(key),
    });

    // Sempre adicionar ao buffer (para replay em caso de reconexão)
    if (!this.eventBuffer.has(key)) {
      this.eventBuffer.set(key, []);
    }
    const buffer = this.eventBuffer.get(key);
    buffer.push({ eventType, data, timestamp: Date.now() });

    // Limitar tamanho do buffer
    if (buffer.length > this.bufferSize) {
      buffer.shift(); // Remove o mais antigo
    }

    // Se há conexão ativa, enviar imediatamente também
    const controller = this.connections.get(key);
    if (controller) {
      const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
      try {
        controller.enqueue(new TextEncoder().encode(message));
        console.debug("[SSE Manager] ✅ Evento emitido com sucesso:", {
          key,
          eventType,
        });
      } catch (err) {
        console.error("[SSE Manager] ❌ Erro ao enqueue:", err, {
          key,
          eventType,
        });
      }
    } else {
      console.debug(
        "[SSE Manager] 💾 Evento armazenado no buffer (sem conexão ainda):",
        { key, eventType, bufferSize: buffer.length }
      );
    }
  }

  remove(key) {
    const controller = this.connections.get(key);
    if (controller) {
      try {
        controller.close();
      } catch {}
    }
    this.connections.delete(key);
  }

  has(key) {
    return this.connections.has(key);
  }
}

// Garantir singleton entre rotas/node workers em dev
const g = globalThis;
if (!g.__dash_sse_manager__) {
  g.__dash_sse_manager__ = new SSEManager();
}
export const sseManager = g.__dash_sse_manager__;
