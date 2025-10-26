# Lógica de Geração de Tiles - Documentação Técnica

## Arquitetura Geral

### 1. Modelos de AI

**Modelo Atual:** gpt-4o-mini (OpenAI)
**Versão SDK:** openai@6.6.0
**Alternativas Consideradas:**

- gpt-4o (2x mais rápido que turbo, mais caro)
- gpt-4-turbo-preview (DEPRECATED - muito lento)

### 2. Estratégia de Geração

#### Fase 1: Tiles Críticos (1-3)

- **Método:** Sequencial
- **Modelo:** gpt-4o-mini
- **maxTokens:** 300
- **temperature:** 0.3
- **Streaming:** DESABILITADO (quebra UI)
- **Tempo esperado:** 5-8s por tile

#### Fase 2: Tiles Secundários (4+)

- **Método:** Paralelo (lotes de 4)
- **Modelo:** gpt-4o-mini
- **maxTokens:** 500
- **temperature:** 0.5
- **Streaming:** DESABILITADO
- **Tempo esperado:** 10-15s por lote

### 3. Sistema de Locks

#### Lock Otimista

```javascript
if (company.generation_in_progress) {
  const elapsed = Date.now() - new Date(company.generation_started_at);

  // Regra 1: Se < 10min, bloquear
  if (elapsed < 600000) {
    return 409; // Conflict
  }

  // Regra 2: Se > 10min, considerar travado
  console.warn("Lock expired, allowing retry");
}
```

#### Lock ID

- Cada geração tem um UUID único
- Previne race conditions
- Limpo ao completar ou falhar

### 4. Métricas e Observabilidade

#### Métricas Coletadas

- **queue_wait_ms:** Tempo esperando na fila
- **api_call_ms:** Tempo total da chamada OpenAI
- **ttft_ms:** Time To First Token
- **streaming_ms:** Tempo de streaming (se usado)
- **db_save_ms:** Tempo para salvar no MongoDB

#### Identificação de Gargalos

```javascript
const bottleneck = Object.entries(metrics.breakdown).sort(
  ([, a], [, b]) => b - a
)[0];

// Exemplo: ["api_call_ms", 7200]
```

### 5. Otimizador de Prompts

#### Perfis de Otimização

**CRITICAL_FAST:**

- Usado para tiles 1-3
- maxTokens: 300
- temperature: 0.3
- System prompt minimalista

**STANDARD:**

- Usado para tiles 4-6
- maxTokens: 500
- temperature: 0.5
- System prompt balanceado

**DETAILED:**

- Usado para tiles complexos (email scripts, etc)
- maxTokens: 700
- temperature: 0.6
- System prompt completo

#### Classificação Automática

```javascript
// Regra 1: Posição
if (position <= 3) → CRITICAL_FAST

// Regra 2: Keywords
if (title.includes('write', 'email', 'script')) → DETAILED

// Regra 3: Default
else → STANDARD
```

### 6. Fluxo Completo

```
1. User adiciona company
   ↓
2. POST /api/guest/generate-tiles
   ↓
3. Verificar lock (se existe, bloquear)
   ↓
4. Setar lock com lockId
   ↓
5. Otimizar tiles (classificar perfis)
   ↓
6. Gerar tiles críticos (1-3) sequencialmente
   ├─ Tile 1 (5-8s)
   ├─ Tile 2 (5-8s)
   └─ Tile 3 (5-8s)
   ↓
7. Gerar tiles secundários (4+) em paralelo
   └─ Lote [4,5,6,7] (10-15s total)
   ↓
8. Salvar cada tile no DB imediatamente
   ↓
9. Limpar lock ao completar
   ↓
10. Polling no frontend detecta novos tiles
    ↓
11. UI atualiza com badges de performance
```

### 7. Cache e TTL

**Atualmente:** NÃO implementado

**Razão:** Tiles são específicos por company

**Futuro:** Considerar cache de prompts similares

### 8. Streaming

**Status:** DESABILITADO

**Razão:** UI não atualiza progressivamente, fica no loading

**Problema:** onStream callback não conectado ao frontend

**Solução Futura:** Implementar WebSocket ou SSE

### 9. Rate Limits

**OpenAI API:**

- Tier 1: 500 RPM (requests per minute)
- Tier 2: 5000 RPM

**Nossa estratégia:**

- Lotes de 4 tiles paralelos
- Delay de 1s entre lotes
- Nunca excede 240 tiles/min (dentro do limite)

### 10. Netlify Server Functions

**Status:** NÃO USADO

**Alternativa:** Next.js API Routes (Edge Runtime)

**Razão:** Edge Runtime é mais rápido e nativo do Next.js

### 11. Tratamento de Erros

#### Timeout Individual

```javascript
const timeoutPromise = new Promise((_, reject) =>
  setTimeout(() => reject(new Error("Timeout")), 120000)
);

await Promise.race([openai.chat.completions.create(params), timeoutPromise]);
```

#### Retry em Caso de Falha

- Não implementado automaticamente
- User pode clicar "Force Retry" se lock expirou

### 12. Condicional Logic Summary

#### Quando gerar tiles automaticamente?

```javascript
if (tiles_status === "pending" && !generatingTiles) {
  // Disparar geração automática
}
```

#### Quando parar polling?

```javascript
if (tiles_status === "completed") {
  // Parar polling imediatamente
}

if (pollCount >= 15) {
  // Parar por segurança (30s)
}

if (consecutiveErrors >= 3) {
  // Parar por múltiplos erros
}
```

#### Quando permitir retry?

```javascript
if (generation_in_progress && elapsed > 600000) {
  // Permitir retry após 10 minutos
}
```

## Performance Esperada

### Antes das Otimizações

- Tile 1: ~30-60s
- Tile 2: ~419s (7 minutos!) 🔴
- Tile 3: ~8s
- **Total:** 7+ minutos

### Depois das Otimizações

- Tiles 1-3: ~6s cada = 18s
- Tiles 4-6: ~12s (lote de 3 em paralelo)
- **Total:** ~40-50s ✅

**Melhoria:** 8-10x mais rápido

## Problema: Tiles Não Atualizam Sem Refresh

### Diagnóstico

O problema acontece na linha 546-554 de `trial/page.jsx`. O código tem **lógica duplicada e conflitante**:

```javascript
// PROBLEMA: Estas duas atualizações competem entre si
if (selectedCompany) {
  // Atualizar selectedCompany com dados mais recentes
  const updatedCompany = data.workspace?.companies?.find(
    (c) => c.name === selectedCompany.name
  );
  if (updatedCompany) {
    setSelectedCompany(updatedCompany); // ← Atualização 1
  }
}
```

Mas ANTES (linha 508), já fazemos:

```javascript
setSelectedCompany(currentCompany); // ← Atualização 2 (dentro do if de tiles detectados)
```

### Causa Raiz

1. **Race condition**: Duas chamadas setSelectedCompany no mesmo render
2. **Lógica condicional**: Segunda atualização (linha 546) pode sobrescrever a primeira
3. **Referência obsoleta**: selectedCompany usado na comparação pode estar desatualizado
4. **LoadingTile não remove**: O componente SortableTilesGrid mostra LoadingTiles mas não os remove quando tiles chegam

### Solução

**Arquivo: `dashboard/app/trial/page.jsx`**

Consolidar lógica de atualização e usar useEffect para garantir ordem:

```javascript
// ANTES (loadGuestWorkspace - linhas 546-559)
else if (selectedCompany) {
  const updatedCompany = data.workspace?.companies?.find(
    (c) => c.name === selectedCompany.name
  );
  if (updatedCompany) {
    console.log("🔄 Atualizando selectedCompany com dados mais recentes");
    setSelectedCompany(updatedCompany);
  }
}

// DEPOIS - REMOVER ESTE BLOCO (já atualiza na linha 508)
// A atualização já acontece no bloco "Se tiles foram adicionados"
```

**Adicionar useEffect para forçar atualização:**

```javascript
// NOVO: Garantir que selectedCompany sempre tem dados frescos
useEffect(() => {
  if (workspace?.workspace?.companies && selectedCompany) {
    const freshCompany = workspace.workspace.companies.find(
      (c) => c.name === selectedCompany.name
    );

    // Só atualizar se realmente mudou
    if (
      freshCompany &&
      JSON.stringify(freshCompany.tiles) !==
        JSON.stringify(selectedCompany.tiles)
    ) {
      console.log(
        "🔄 Forçando atualização de selectedCompany com tiles frescos"
      );
      setSelectedCompany(freshCompany);
    }
  }
}, [workspace]); // Reage a mudanças no workspace
```

**Arquivo: `dashboard/components/ui/SortableTilesGrid.jsx`**

Melhorar cálculo de LoadingTiles:

```javascript
// ANTES (linha 85-89)
{
  isGeneratingTiles &&
    !isGeneratingCustomTile &&
    Array.from({
      length: Math.max(0, tilesToGenerate - tiles.length),
    }).map((_, i) => <LoadingTile key={`loading-${i}`} index={i} />);
}

// DEPOIS
{
  isGeneratingTiles &&
    !isGeneratingCustomTile &&
    (() => {
      const loadingCount = Math.max(0, tilesToGenerate - tiles.length);
      console.log(
        `🔄 Renderizando ${loadingCount} LoadingTiles (${tiles.length}/${tilesToGenerate})`
      );

      return Array.from({ length: loadingCount }).map((_, i) => (
        <LoadingTile key={`loading-${tiles.length + i}`} index={i} />
      ));
    })();
}
```

## Testes Necessários

1. Gerar 6 tiles e verificar tempo total < 1min
2. Verificar badges mostram breakdown correto
3. Tentar gerar duplicado (deve retornar 409)
4. Simular timeout e verificar lock expira
5. Verificar logs estruturados no console
6. **NOVO:** Verificar que LoadingTiles desaparecem quando tiles reais chegam (sem refresh)
7. **NOVO:** Verificar que tiles aparecem progressivamente (1 por 1) sem refresh
