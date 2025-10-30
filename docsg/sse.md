# Plano: SSE Streaming + OpenAI Promise.all Otimizado

## Contexto

Substituir polling por Server-Sent Events (SSE) e otimizar geração de tiles usando Promise.all para processar múltiplos prompts em paralelo.

## Escopo

- **Home (Landing Page)**: 2 tiles com gpt-4o-mini
- **Admin (Dashboard Logado)**: 6 tiles com gpt-4-turbo-preview
- **Suporte Netlify**: SSE nativo conforme documentação oficial

## Arquitetura

### 1. SSE Manager (Singleton Pattern)

`dashboard/lib/sse-manager.js`

Gerenciador global de conexões SSE usando Map para performance.

```javascript
class SSEManager {
  constructor() {
    this.connections = new Map(); // guest_id -> controller
  }

  addConnection(guestId, controller) {
    this.connections.set(guestId, controller);
  }

  emit(guestId, eventType, data) {
    const controller = this.connections.get(guestId);
    if (!controller) return;

    const message = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
    controller.enqueue(new TextEncoder().encode(message));
  }

  removeConnection(guestId) {
    const controller = this.connections.get(guestId);
    if (controller) {
      try {
        controller.close();
      } catch {}
    }
    this.connections.delete(guestId);
  }

  hasConnection(guestId) {
    return this.connections.has(guestId);
  }
}

export const sseManager = new SSEManager();
```

### 2. SSE Endpoint (Netlify Compatible)

`dashboard/app/api/guest/tiles/stream/route.js`

Endpoint público que mantém stream aberto seguindo padrão Netlify.

```javascript
import { NextResponse } from "next/server";
import { sseManager } from "@/lib/sse-manager";

export const runtime = "edge"; // Edge Runtime para melhor performance

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const guestId = searchParams.get("guest_id");

  if (!guestId) {
    return NextResponse.json({ error: "guest_id required" }, { status: 400 });
  }

  const stream = new ReadableStream({
    start(controller) {
      // Registrar conexão
      sseManager.addConnection(guestId, controller);

      // Keep-alive a cada 30s
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": keep-alive\n\n"));
        } catch {
          clearInterval(keepAlive);
        }
      }, 30000);

      // Timeout de 2 minutos
      const timeout = setTimeout(() => {
        sseManager.removeConnection(guestId);
        clearInterval(keepAlive);
      }, 120000);

      // Cleanup ao fechar
      request.signal.addEventListener("abort", () => {
        clearInterval(keepAlive);
        clearTimeout(timeout);
        sseManager.removeConnection(guestId);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Nginx compatibility
    },
  });
}
```

### 3. OpenAI Batch Functions

`dashboard/lib/ai-tile-generator-optimized.js`

Adicionar funções batch otimizadas com error handling robusto.

```javascript
/**
 * Gera 2 tiles da Home em paralelo (gpt-4o-mini)
 */
export async function generateHomeTilesBatch(tiles, context) {
  if (tiles.length !== 2) {
    throw new Error("Home batch expects exactly 2 tiles");
  }

  const promises = tiles.map(async (tile) => {
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: buildSystemPrompt(context) },
          { role: "user", content: tile.prompt },
        ],
        temperature: 0.3,
        max_tokens: 300,
      });

      return {
        ...tile,
        answer: completion.choices[0].message.content,
        metrics: {
          model: "gpt-4o-mini",
          tokens: completion.usage,
        },
      };
    } catch (error) {
      console.error(`Error generating tile ${tile.id}:`, error);
      return null;
    }
  });

  const results = await Promise.all(promises);
  return results.filter(Boolean); // Remove nulls
}

/**
 * Gera 6 tiles do Admin em paralelo (gpt-4-turbo-preview)
 */
export async function generateAdminTilesBatch(tiles, context) {
  if (tiles.length !== 6) {
    throw new Error("Admin batch expects exactly 6 tiles");
  }

  // Rate limiting: max 4 simultâneos
  const batchSize = 4;
  const allResults = [];

  for (let i = 0; i < tiles.length; i += batchSize) {
    const batch = tiles.slice(i, i + batchSize);

    const promises = batch.map(async (tile) => {
      try {
        const completion = await openai.chat.completions.create({
          model: "gpt-4-turbo-preview",
          messages: [
            { role: "system", content: buildSystemPrompt(context) },
            { role: "user", content: tile.prompt },
          ],
          temperature: 0.5,
          max_tokens: 500,
        });

        return {
          ...tile,
          answer: completion.choices[0].message.content,
          metrics: {
            model: "gpt-4-turbo-preview",
            tokens: completion.usage,
          },
        };
      } catch (error) {
        console.error(`Error generating tile ${tile.id}:`, error);
        return null;
      }
    });

    const batchResults = await Promise.all(promises);
    allResults.push(...batchResults.filter(Boolean));

    // Delay entre batches para rate limiting
    if (i + batchSize < tiles.length) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  return allResults;
}
```

### 4. Integração na API Workspace

`dashboard/app/api/guest/workspace/route.js`

Modificar o POST para usar batches e emitir SSE.

```javascript
// Dentro do async IIFE de geração em background

// Separar tiles por fase
const homeTiles = selectedTemplate.tiles.slice(0, 2);
const adminTiles = selectedTemplate.tiles.slice(2, 8);

// Fase 1: Home tiles (gpt-4o-mini)
const homeResults = await generateHomeTilesBatch(homeTiles, promptContext);

for (const tile of homeResults) {
  // Salvar no DB
  await db.updateOne(
    "guest_workspaces",
    { guest_id: guestId },
    { $push: { [`workspace_data.${entityKey}.0.tiles`]: tile } }
  );

  // Emitir SSE
  sseManager.emit(guestId, "tile_completed", {
    tile,
    phase: "home",
    progress: { current: homeResults.indexOf(tile) + 1, total: 8 },
  });
}

// Fase 2: Admin tiles (gpt-4-turbo-preview)
const adminResults = await generateAdminTilesBatch(adminTiles, promptContext);

for (const tile of adminResults) {
  // Salvar no DB
  await db.updateOne(
    "guest_workspaces",
    { guest_id: guestId },
    { $push: { [`workspace_data.${entityKey}.0.tiles`]: tile } }
  );

  // Emitir SSE
  sseManager.emit(guestId, "tile_completed", {
    tile,
    phase: "admin",
    progress: { current: 2 + adminResults.indexOf(tile) + 1, total: 8 },
  });
}

// Emitir completion
sseManager.emit(guestId, "generation_complete", {
  totalTiles: homeResults.length + adminResults.length,
});
```

### 5. Frontend Hook

`dashboard/hooks/useSSE.js`

Hook React com cleanup automático e reconnect.

```javascript
import { useEffect, useRef, useState } from "react";

export function useSSE(guestId, onTileUpdate) {
  const [isConnected, setIsConnected] = useState(false);
  const eventSourceRef = useRef(null);

  useEffect(() => {
    if (!guestId) return;

    const url = `/api/guest/tiles/stream?guest_id=${guestId}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log("SSE connected");
      setIsConnected(true);
    };

    eventSource.addEventListener("tile_completed", (e) => {
      const data = JSON.parse(e.data);
      onTileUpdate?.(data);
    });

    eventSource.addEventListener("generation_complete", (e) => {
      console.log("Generation complete");
      eventSource.close();
      setIsConnected(false);
    });

    eventSource.onerror = (error) => {
      console.error("SSE error:", error);
      setIsConnected(false);
      eventSource.close();
    };

    // Cleanup
    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [guestId, onTileUpdate]);

  return { isConnected };
}
```

### 6. Atualizar Home e Admin

`dashboard/app/page.js` (Home) e `dashboard/app/admin/page.jsx` (Admin)

Usar hook SSE ao invés de polling.

```javascript
// Remover setInterval de polling
// Adicionar:
const { isConnected } = useSSE(guestId, (data) => {
  // Atualizar tiles no estado
  setTiles((prev) => [...prev, data.tile]);
});
```

### 7. Middleware Update

`dashboard/middleware.js`

```javascript
const isPublicRoute = createRouteMatcher([
  // ... rotas existentes
  "/api/guest/tiles/stream",
]);
```

## Performance Esperada

### Antes (Polling):

- 8 tiles sequenciais: ~25-35s
- Polling delay: até 1.5s
- Total: ~26-37s

### Depois (SSE + Promise.all):

- 2 tiles home paralelo: ~5-8s
- 6 tiles admin paralelo (batches de 4): ~12-18s
- SSE updates: instantâneos
- Total: ~17-26s (30% mais rápido)

## Segurança

1. Rate limiting: 10 conexões SSE por IP
2. Timeout: 2 minutos por conexão
3. Validação: guest_id obrigatório
4. Cleanup: Remover conexões órfãs automaticamente

## Compatibilidade Netlify

Baseado na documentação oficial do Netlify, o streaming SSE é totalmente suportado:

- Edge Runtime recomendado
- Content-Type: text/event-stream
- ReadableStream nativo
- Keep-alive necessário

## Melhores Práticas JS

1. Use const/let ao invés de var
2. Async/await ao invés de .then()
3. Template literals ao invés de concatenação
4. Optional chaining (?.)
5. Nullish coalescing (??)
6. Error boundaries em try/catch
7. Cleanup em useEffect
8. Map/Set para performance
