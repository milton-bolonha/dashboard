# Análise: Demora na Geração de Tiles

**Data**: 2025-11-21  
**Status**: 🔴 PROBLEMA IDENTIFICADO

---

## Problema

Os tiles estão demorando muito para aparecer e quando aparecem, vêm todos de uma vez em vez de progressivamente.

## Causa Raiz

### 1. Processamento em Lotes Sequenciais

**Arquivo**: `src/app/api/generate/route.ts` (linha 335)

```typescript
for (let start = 0; start < prompts.length; start += TILE_BATCH_SIZE) {
  const end = Math.min(start + TILE_BATCH_SIZE, prompts.length);
  const batch = prompts.slice(start, end);

  const batchResults = await Promise.all(
    batch.map(async (item, offset) => {
      // Gera tiles do lote
    })
  );
}
```

**Problema**: 
- `TILE_BATCH_SIZE = 2` (default)
- Para 8 tiles: Lote 1 (2 tiles) → espera → Lote 2 (2 tiles) → espera → Lote 3 (2 tiles) → espera → Lote 4 (2 tiles)
- **Tempo total**: ~15-20 segundos (sequencial)

### 2. Sem Streaming no Frontend

**Arquivo**: `src/containers/home/HomeContainer.tsx` (linha 98)

```typescript
const targetUrl = "/api/generate"; // ❌ Batch mode
```

**Problema**:
- Usa `/api/generate` (batch) em vez de `/api/generate/stream` (streaming)
- Frontend só recebe tiles quando **todos** estão prontos
- Não há feedback progressivo

### 3. Polling Só Começa Depois do Redirect

**Arquivo**: `src/containers/admin/AdminContainer.tsx`

```typescript
// Polling inicia quando AdminContainer monta
// Mas geração já está em andamento no background
```

**Problema**:
- User é redirecionado para `/admin` imediatamente
- Polling começa, mas workspace ainda não tem tiles
- Fica esperando até todos os tiles estarem prontos

---

## Comparação: Batch vs Streaming

### Batch Mode (Atual)

```
User Submit
    ↓
Redirect /admin (0s)
    ↓
Backend processa:
  Lote 1: [Tile 1, Tile 2] → 4s
  Lote 2: [Tile 3, Tile 4] → 4s
  Lote 3: [Tile 5, Tile 6] → 4s
  Lote 4: [Tile 7, Tile 8] → 4s
    ↓
Workspace salvo (16s)
    ↓
Polling detecta tiles (17s)
    ↓
UI renderiza TODOS de uma vez (17s)
```

**Tempo total**: ~17 segundos  
**Experiência**: ❌ Espera longa, sem feedback

### Streaming Mode (Proposto)

```
User Submit
    ↓
Redirect /admin (0s)
    ↓
Backend inicia stream:
  Tile 1 pronto → envia (2s)
  Tile 2 pronto → envia (2.5s)
  Tile 3 pronto → envia (3s)
  Tile 4 pronto → envia (4s)
  ...
  Tile 8 pronto → envia (8s)
    ↓
Frontend recebe tiles progressivamente
    ↓
UI renderiza UM POR UM conforme chegam
```

**Tempo total**: ~8 segundos (paralelo)  
**Experiência**: ✅ Feedback imediato, progressivo

---

## Soluções

### Solução 1: Aumentar Concorrência (Rápido)

**Mudança**: Aumentar `TILE_BATCH_SIZE` ou usar processamento totalmente paralelo

**Arquivo**: `src/app/api/generate/route.ts`

```typescript
// ANTES (sequencial em lotes de 2)
const TILE_BATCH_SIZE = 2;
for (let start = 0; start < prompts.length; start += TILE_BATCH_SIZE) {
  // ...
}

// DEPOIS (paralelo total)
const CONCURRENT_TILES = 8; // ou usar Semaphore como no streaming
const tilePromises = prompts.map(async (item, orderIndex) => {
  // Gera tile
});
const tiles = await Promise.all(tilePromises);
```

**Vantagens**:
- ✅ Fácil de implementar
- ✅ Reduz tempo total de ~17s para ~5s

**Desvantagens**:
- ❌ Ainda não mostra tiles progressivamente
- ❌ Pode sobrecarregar OpenAI API

### Solução 2: Implementar Streaming (Recomendado)

**Mudança**: Usar `/api/generate/stream` com Server-Sent Events (SSE)

#### 2.1. Frontend - Mudar Endpoint

**Arquivo**: `src/containers/home/HomeContainer.tsx`

```typescript
// ANTES
const targetUrl = "/api/generate";

// DEPOIS
const targetUrl = "/api/generate/stream";

// Conectar ao stream
const eventSource = new EventSource(targetUrl);

eventSource.addEventListener('tile_generated', (event) => {
  const { tile, tileIndex, completedTiles, totalTiles } = JSON.parse(event.data);
  
  // Adicionar tile ao workspace progressivamente
  updateWorkspaceWithNewTile(tile);
});

eventSource.addEventListener('completed', (event) => {
  const { sessionId, workspace } = JSON.parse(event.data);
  saveCachedWorkspace(sessionId, workspace);
  eventSource.close();
});
```

#### 2.2. Backend - Já Implementado!

**Arquivo**: `src/app/api/generate/stream/route.ts`

O streaming **já está implementado** e funcional:

```typescript
// Linha 369-430
const semaphore = new Semaphore(CONCURRENT_TILES); // 3 tiles simultâneos

const tilePromises = prompts.map(async (item, orderIndex) => {
  await semaphore.acquire();
  
  try {
    const generation = await generateTileContent({ ... });
    const tile = composeTileFromGeneration(generation, { ... });
    
    generatedTiles[orderIndex] = tile;
    
    // Enviar tile imediatamente quando pronto
    controller.enqueue(
      encoder.encode(`data: ${JSON.stringify({
        type: 'tile_generated',
        tile,
        tileIndex: orderIndex,
        completedTiles: ++completedTiles,
        totalTiles: prompts.length,
      })}\n\n`)
    );
    
    return tile;
  } finally {
    semaphore.release();
  }
});

await Promise.all(tilePromises);
```

**Vantagens**:
- ✅ Tiles aparecem um por um
- ✅ Feedback imediato
- ✅ Melhor UX
- ✅ Já implementado no backend!

**Desvantagens**:
- ⚠️ Requer mudanças no frontend
- ⚠️ Mais complexo de debugar

### Solução 3: Híbrida (Melhor dos Dois Mundos)

**Estratégia**: Usar streaming + polling como fallback

1. **Tentar streaming primeiro**
2. **Se falhar**, usar polling tradicional
3. **Mostrar progress bar** durante geração

---

## Recomendação

### Curto Prazo (Hoje)
✅ **Solução 1**: Aumentar concorrência no batch mode
- Mudar para processamento paralelo total
- Reduz tempo de 17s → 5s
- Sem mudanças no frontend

### Médio Prazo (Próxima Sprint)
✅ **Solução 2**: Implementar streaming completo
- Melhor UX com tiles progressivos
- Usar SSE já implementado no backend
- Adicionar progress bar

### Longo Prazo
✅ **Solução 3**: Híbrida com fallback
- Streaming como primary
- Polling como fallback
- Retry automático

---

## Próximos Passos

1. ✅ Corrigir erros de `tile.id undefined`
2. 🔄 Implementar processamento paralelo no batch mode
3. 🔄 Adicionar streaming no frontend
4. 🔄 Adicionar progress bar
5. 🔄 Testes de performance

---

## Métricas Atuais vs Esperadas

| Métrica | Atual (Batch) | Com Paralelo | Com Streaming |
|---------|---------------|--------------|---------------|
| Tempo total | ~17s | ~5s | ~8s |
| Primeiro tile | 17s | 5s | **2s** ✨ |
| Feedback | Nenhum | Nenhum | Progressivo ✨ |
| UX Score | 3/10 | 6/10 | **9/10** ✨ |

---

## Referências

- [Server-Sent Events (MDN)](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [OpenAI Streaming](https://platform.openai.com/docs/api-reference/streaming)
- [SWR Mutation](https://swr.vercel.app/docs/mutation)
