# 🔄 Fluxo de Criação de Tiles: Netlify → MongoDB → OpenAI → Frontend

**Data**: 06/11/2025  
**Foco**: Orquestração de serviços, fluxo de dados e timing da criação de tiles

---

## 📋 Índice

1. [Visão Geral da Orquestração](#visão-geral-da-orquestração)
2. [Diagrama de Sequência Completo](#diagrama-de-sequência-completo)
3. [Etapa 1: Disparo do Formulário](#etapa-1-disparo-do-formulário)
4. [Etapa 2: API de Criação de Job](#etapa-2-api-de-criação-de-job)
5. [Etapa 3: Background Runner](#etapa-3-background-runner)
6. [Etapa 4: Deck Engine Adapter](#etapa-4-deck-engine-adapter)
7. [Etapa 5: Runner OpenAI](#etapa-5-runner-openai)
8. [Etapa 6: Provider OpenAI](#etapa-6-provider-openai)
9. [Etapa 7: Persistência no MongoDB](#etapa-7-persistência-no-mongodb)
10. [Etapa 8: SSE Manager](#etapa-8-sse-manager)
11. [Etapa 9: Frontend - Recepção e Renderização](#etapa-9-frontend---recepção-e-renderização)
12. [Timeline Detalhado](#timeline-detalhado)
13. [Fluxo de Dados - Estruturas](#fluxo-de-dados---estruturas)

---

## 🎯 Visão Geral da Orquestração

> **Atualização (nov/2025)**: A geração padrão continua sendo `individual` (um prompt por tile).
> O modo `batch` pode ser ativado via `DECK_ENGINE_GENERATION_MODE=batch` com concorrência
> configurável (`DECK_ENGINE_BATCH_CONCURRENCY`, default 3), acelerando a etapa “Runner OpenAI”
> descrita abaixo sem alterar a persistência ou os eventos SSE.

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ORQUESTRAÇÃO DE SERVIÇOS                         │
└─────────────────────────────────────────────────────────────────────┘

Frontend (Browser)
    │
    │ POST /api/prompt-jobs
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  API Route: /api/prompt-jobs (POST)                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Valida payload (Joi)                                  │  │
│  │ 2. Pre-warm MongoDB                                       │  │
│  │ 3. Gera IDs (guestId, jobId, token)                      │  │
│  │ 4. Busca tema (com fallbacks)                            │  │
│  │ 5. createDynamicWorkspace() → workspaceData               │  │
│  │ 6. Salva guest_workspaces (MongoDB)                       │  │
│  │ 7. createJob() → prompt_jobs (MongoDB)                   │  │
│  │ 8. runJobInBackground() [FIRE-AND-FORGET]                 │  │
│  │ 9. Retorna {jobId, guestId, token}                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
    │
    │ [Request termina aqui - 201 Created]
    │
    │ runJobInBackground() [ASSÍNCRONO]
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Background Runner: lib/jobs/runner.js                          │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Delay 1s (aguardar SSE conectar)                     │  │
│  │ 2. getJob(jobId) → MongoDB                               │  │
│  │ 3. Busca guest_workspaces → MongoDB                      │  │
│  │ 4. Determina entityKey (companies, books, etc.)           │  │
│  │ 5. Extrai companyName do workspace                       │  │
│  │ 6. queueJob() → deck-engine-adapter                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
    │
    │ queueJob({ guestId, jobId, templateId, model, items, ... })
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Deck Engine Adapter: lib/jobs/deck-engine-adapter.js           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Resolve entityKey e companyName                        │  │
│  │ 2. Define persistTileDirectly() [closure]                │  │
│  │ 3. Delay 500ms (aguardar SSE)                            │  │
│  │ 4. Emite job:status QUEUED                                │  │
│  │ 5. getDeckEngineRunner() → runner                         │  │
│  │ 6. runner.runJob({ onStatus, onChunk, onResult, ... })   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
    │
    │ runner.runJob() [LOOP PARA CADA TILE]
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Runner OpenAI: lib/jobs/deck-engine-runner-openai.js           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Para cada tile (0..7):                                    │  │
│  │ 1. Busca template.tiles[orderIndex]                      │  │
│  │ 2. processPromptVariables() → prompt final                │  │
│  │ 3. Loop de tentativas (max 3x)                            │  │
│  │    ├─> generateCompletion() → OpenAI (Responses API)    │  │
│  │    ├─> Recebe single response (sem streaming)           │  │
│  │    ├─> Valida resposta (refusal patterns)               │  │
│  │    └─> Se inválido → retry com backoff                  │  │
│  │ 4. onResult() → adapter (quando completo)                │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
    │
    │ generateCompletion({ model, prompt })
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  OpenAI Provider: lib/ai/provider.js                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Se modelo começa com gpt-5 → openai.responses.create │  │
│  │    (input, reasoning, text, max_output_tokens)           │  │
│  │ 2. Caso contrário → openai.chat.completions.create      │  │
│  │ 3. Normaliza output_text / message.content para string  │  │
│  │ 4. Retorna objeto { content, usage, totalDurationMs }    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
    │
    │ [Chunks retornam para runner]
    │
    │ onResult() callback
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Deck Engine Adapter (onResult callback)                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Constrói tileDoc { id, title, content, ... }          │  │
│  │ 2. persistTileDirectly(tileDoc) → MongoDB                │  │
│  │ 3. appendResult() → prompt_results (MongoDB)             │  │
│  │ 4. emitJobEvent(job:result-completed) → SSE Manager       │  │
│  │ 5. emitStatus(RUNNING) → SSE Manager                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
    │
    │ persistTileDirectly()
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  MongoDB: guest_workspaces                                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. $pull { tiles: { id: tileDoc.id } }                   │  │
│  │ 2. $push { tiles: tileDoc }                               │  │
│  │ 3. $inc { usage.total_tiles_generated: 1 }                │  │
│  │ 4. $set { updatedAt: new Date() }                         │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
    │
    │ emitJobEvent()
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  SSE Manager: lib/sse-manager.js                                │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Verifica conexões ativas (key = guest:xxx:job:xxx)    │  │
│  │ 2. Se há conexão → handler(event) [envia imediatamente]  │  │
│  │ 3. Se não há → buffer.push(event) [armazena]             │  │
│  │ 4. Quando conexão estabelece → reenvia buffer (100ms)   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
    │
    │ handler(event) → SSE Route
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  SSE Route: /api/streams/jobs/[jobId]                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. Valida autenticação (jobId, guestId, token)           │  │
│  │ 2. Cria ReadableStream                                    │  │
│  │ 3. onEvent = (event) => sendEvent(type, payload)         │  │
│  │ 4. sseManager.add(key, onEvent)                           │  │
│  │ 5. Envia status inicial do job                           │  │
│  │ 6. Keep-alive a cada 20s                                  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
    │
    │ EventSource (browser)
    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Frontend: useJobStreaming → useSSEManager                       │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 1. EventSource.addEventListener("job:result-completed")  │  │
│  │ 2. persistTileAndRefresh() → revalidateWorkspace()       │  │
│  │ 3. SWR refetch → GET /api/guest/workspace                │  │
│  │ 4. Atualiza selectedCompany.tiles                         │  │
│  │ 5. SortableTilesGrid re-renderiza                        │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Diagrama de Sequência Completo

```
Frontend          API Route        Runner         Adapter         Runner OpenAI    OpenAI Provider    MongoDB         SSE Manager      SSE Route      Frontend SSE
   │                  │               │              │                  │                  │              │                  │                │                │
   │ POST /api/       │               │              │                  │                  │              │                  │                │                │
   │ prompt-jobs      │               │              │                  │                  │              │                  │                │                │
   ├─────────────────>│               │              │                  │                  │              │                  │                │                │
   │                  │ [Validação]   │              │                  │                  │              │                  │                │                │
   │                  │ [Pre-warm]    │              │                  │                  │              │                  │                │                │
   │                  │ [Cria workspace]             │                  │                  │              │                  │                │                │
   │                  │ [Salva MongoDB]               │                  │                  │              │                  │                │                │
   │                  │ [Cria job]    │              │                  │                  │              │                  │                │                │
   │                  │ runJobInBackground()         │                  │                  │              │                  │                │                │
   │                  ├──────────────>│              │                  │                  │              │                  │                │                │
   │                  │ [201 Created] │              │                  │                  │              │                  │                │                │
   │<─────────────────┤               │              │                  │                  │              │                  │                │                │
   │                  │               │ [Delay 1s]    │                  │                  │              │                  │                │                │
   │                  │               │ [getJob]      │                  │                  │              │                  │                │                │
   │                  │               ├───────────────┐                  │                  │              │                  │                │                │
   │                  │               │               │                  │                  │              │                  │                │                │
   │                  │               │<───────────────┤                  │                  │              │                  │                │                │
   │                  │               │ [queueJob]     │                  │                  │              │                  │                │                │
   │                  │               ├──────────────>│                  │                  │              │                  │                │                │
   │                  │               │               │ [Delay 500ms]     │                  │              │                  │                │                │
   │                  │               │               │ [emit QUEUED]     │                  │              │                  │                │                │
   │                  │               │               ├──────────────────────────────────────────────────────────────────────────────────────────────────────>│
   │                  │               │               │                  │                  │              │                  │                │                │
   │                  │               │               │ [getRunner]       │                  │              │                  │                │                │
   │                  │               │               ├─────────────────>│                  │              │                  │                │                │
   │                  │               │               │ [runJob]         │                  │              │                  │                │                │
   │                  │               │               ├─────────────────>│                  │              │                  │                │                │
   │                  │               │               │                  │ [Loop tile 0..7]  │              │                  │                │                │
   │                  │               │               │                  │ [generateStream] │              │                  │                │                │
   │                  │               │               │                  ├─────────────────>│              │                  │                │                │
   │                  │               │               │                  │                  │ [openai API] │                  │                │                │
   │                  │               │               │                  │                  ├──────────────┐                  │                │                │
   │                  │               │               │                  │                  │              │                  │                │                │
   │                  │               │               │                  │                  │<──────────────┤                  │                │                │
   │                  │               │               │                  │ [Chunk 1]        │              │                  │                │                │
   │                  │               │               │                  │<──────────────────┤              │                  │                │                │
   │                  │               │               │ [onChunk]         │                  │              │                  │                │                │
   │                  │               │               │<──────────────────┤                  │              │                  │                │                │
   │                  │               │               │ [emit chunk]      │                  │              │                  │                │                │
   │                  │               │               ├──────────────────────────────────────────────────────────────────────────────────────────────────────>│
   │                  │               │               │                  │ [Chunk 2...N]    │              │                  │                │                │
   │                  │               │               │                  │<──────────────────┤              │                  │                │                │
   │                  │               │               │ [onChunk...]      │                  │              │                  │                │                │
   │                  │               │               │<──────────────────┤                  │              │                  │                │                │
   │                  │               │               │                  │ [Stream completo] │              │                  │                │                │
   │                  │               │               │                  │ [onResult]        │              │                  │                │                │
   │                  │               │               │<──────────────────┤                  │              │                  │                │                │
   │                  │               │               │ [persistTile]     │                  │              │                  │                │                │
   │                  │               │               │                  │                  │              │                  │                │                │
   │                  │               │               │ [MongoDB $push]   │                  │              │                  │                │                │
   │                  │               │               ├─────────────────────────────────────>│              │                  │                │                │
   │                  │               │               │                  │                  │              │<─────────────────┤                │                │
   │                  │               │               │                  │                  │              │                  │                │                │
   │                  │               │               │ [emit result-completed]              │              │                  │                │                │
   │                  │               │               ├──────────────────────────────────────────────────────────────────────────────────────────────────────>│
   │                  │               │               │                  │                  │              │                  │                │                │
   │                  │               │               │                  │                  │              │                  │ [handler(event)]│                │
   │                  │               │               │                  │                  │              │                  │<────────────────┤                │
   │                  │               │               │                  │                  │              │                  │ [sendEvent]     │                │
   │                  │               │               │                  │                  │              │                  ├────────────────>│                │
   │                  │               │               │                  │                  │              │                  │                │ [EventSource]  │                │
   │                  │               │               │                  │                  │              │                  │                │<───────────────┤
   │                  │               │               │                  │                  │              │                  │                │                │
   │                  │               │               │                  │                  │              │                  │                │ [job:result-completed]│
   │                  │               │               │                  │                  │              │                  │                │<───────────────┤
   │                  │               │               │                  │                  │              │                  │                │                │
   │                  │               │               │                  │                  │              │                  │                │ [persistTileAndRefresh]│
   │                  │               │               │                  │                  │              │                  │                │ [revalidateWorkspace]│
   │                  │               │               │                  │                  │              │                  │                ├─────────────────┐│
   │                  │               │               │                  │                  │              │                  │                │                 ││
   │                  │               │               │                  │                  │              │                  │                │<─────────────────┤│
   │                  │               │               │                  │                  │              │                  │                │ [GET workspace] ││
   │                  │               │               │                  │                  │              │                  │                │                 ││
   │                  │               │               │                  │                  │              │                  │                │ [Atualiza tiles]││
   │                  │               │               │                  │                  │              │                  │                │ [Re-render]     ││
   │                  │               │               │                  │                  │              │                  │                │<─────────────────┤│
```

---

## 🚀 Etapa 1: Disparo do Formulário

### Serviço: Frontend (Browser)

**Arquivo**: `dashboard/components/landing/IAFormsContainer.jsx`

**Ação**:

```javascript
// executeRunFlow(itemsPayload)
const context = {
  themeId: themeId,
  target: firstItem.researchTarget || companyName,
  targetWebsite: firstItem.researchWebsite || firstItem.companyWebsite,
  solution: firstItem.solution || "N/A",
};

const createRes = await fetch("/api/prompt-jobs", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    templateId: initialTemplateId,
    model: "gpt-5-mini",
    context: context,
  }),
});
```

**Payload Enviado**:

```json
{
  "templateId": "tpl_classic_default",
  "model": "gpt-5-mini",
  "context": {
    "themeId": "sales-assistant",
    "target": "Netlify",
    "targetWebsite": "https://netlify.com",
    "solution": "Mentorship Career Program"
  }
}
```

**Timing**: T0 (início do fluxo)

---

## 🏗️ Etapa 2: API de Criação de Job

### Serviço: Next.js API Route

**Arquivo**: `dashboard/app/api/prompt-jobs/route.js` (POST)

**Orquestração**:

1. **Validação** (T0 + ~10ms)

   - Joi schema validation
   - Extrai `{ templateId, model, context }`

2. **Pre-warm MongoDB** (T0 + ~50ms)

   ```javascript
   await withMongoConnection(
     async ({ db: mongoDb }) => {
       await mongoDb.admin().ping();
     },
     { retries: 3 }
   );
   ```

   - **Objetivo**: Garantir conexão MongoDB antes de operações críticas
   - **Retries**: 3 tentativas com backoff

3. **Geração de IDs** (T0 + ~60ms)

   ```javascript
   const guestId = `guest_${uuidv4()}`;
   const jobId = `job_${Date.now().toString(36)}`;
   const accessToken = crypto.randomBytes(24).toString("hex");
   const accessTokenHash = crypto
     .createHash("sha256")
     .update(accessToken)
     .digest("hex");
   ```

   - **Orquestração**: Cria identificadores únicos para isolamento

4. **Busca de Tema** (T0 + ~100ms)

   ```javascript
   let theme = await db.findOne("themes", { id: themeId });
   if (!theme) {
     theme = await db.findOne("themes", { id: "sales-assistant" });
   }
   if (!theme) {
     const { BASE_THEMES } = await import("@/lib/base-themes");
     theme = BASE_THEMES.sales;
   }
   ```

   - **Orquestração**: 3 níveis de fallback para garantir tema válido
   - **Comunicação**: MongoDB → API Route

5. **Criação de Workspace Dinâmico** (T0 + ~200ms)

   ```javascript
   const { workspaceData, dynamicData, themeSnapshot } =
     await createDynamicWorkspace(theme, context);
   ```

   - **Orquestração**: `createDynamicWorkspace` monta estrutura completa
   - **Retorna**:
     - `workspaceData`: Estrutura do workspace (companies, contacts, etc.)
     - `dynamicData`: Dados dinâmicos baseados no tema
     - `themeSnapshot`: Snapshot do tema para referência

6. **Normalização de Contexto** (T0 + ~250ms)

   ```javascript
   const normalizedContext = buildNormalizedContext(context, dynamicData);
   ```

   - **Orquestração**: Garante campos consistentes
   - **Resultado**: Contexto enriquecido com `company.name`, `company.website`, etc.

7. **Salvar Guest Workspace** (T0 + ~300ms)

   ```javascript
   await db.insertOne("guest_workspaces", {
     guest_id: guestId,
     themeId: themeSnapshot.id,
     themeSnapshot: themeSnapshot,
     dynamicData: dynamicData,
     workspace_data: workspaceData,
     context: normalizedContext,
     createdAt: new Date(),
     updatedAt: new Date(),
   });
   ```

   - **Comunicação**: API Route → MongoDB
   - **Estrutura Salva**: Workspace completo com company criada

8. **Criar Job** (T0 + ~350ms)

   ```javascript
   await createJob({
     jobId,
     templateId,
     model,
     dataSource: { type: "context", data: normalizedContext },
     status: "QUEUED",
     totals: { items: themeSnapshot.tileTemplates?.length || 8 },
     guestId,
     accessTokenHash,
   });
   ```

   - **Comunicação**: API Route → MongoDB (`prompt_jobs` collection)
   - **Estrutura Salva**: Job com contexto completo

9. **Disparar Background** (T0 + ~400ms)

   ```javascript
   const { runJobInBackground } = await import("@/lib/jobs/runner");
   runJobInBackground(jobId); // ⭐ FIRE-AND-FORGET
   ```

   - **Orquestração**: Importa runner e dispara assincronamente
   - **Comunicação**: API Route → Runner (não bloqueia resposta)

10. **Retornar Resposta** (T0 + ~450ms)
    ```javascript
    return NextResponse.json(
      { jobId, guestId, token: accessToken },
      { status: 201 }
    );
    ```
    - **Comunicação**: API Route → Frontend
    - **Request termina aqui** (background continua)

**Timing Total**: ~450ms até resposta HTTP

---

## ⚙️ Etapa 3: Background Runner

### Serviço: Node.js Background Process

**Arquivo**: `dashboard/lib/jobs/runner.js`

**Orquestração**:

1. **Delay Inicial** (T0 + ~1450ms)

   ```javascript
   await new Promise((resolve) => setTimeout(resolve, 1000));
   ```

   - **Objetivo**: Garantir que SSE conecte antes dos eventos
   - **Timing**: 1 segundo após job ser criado

2. **Buscar Job** (T0 + ~1500ms)

   ```javascript
   job = await getJob(jobId);
   ```

   - **Comunicação**: Runner → MongoDB (`prompt_jobs`)
   - **Estrutura Lida**: Job completo com `dataSource`, `templateId`, `model`, etc.

3. **Buscar Workspace** (T0 + ~1550ms)

   ```javascript
   const guestWorkspace = await db.findOne("guest_workspaces", {
     guest_id: job.guestId,
   });
   ```

   - **Comunicação**: Runner → MongoDB (`guest_workspaces`)
   - **Estrutura Lida**: Workspace completo com `themeSnapshot`, `workspace_data`, etc.

4. **Determinar Entity Key** (T0 + ~1600ms)

   ```javascript
   let entityKey = "companies";
   const primaryEntity = guestWorkspace?.themeSnapshot?.entities?.find(
     (entity) => entity.isPrimary
   );
   if (primaryEntity?.id) {
     entityKey = `${primaryEntity.id}s`.replace("companys", "companies");
   }
   ```

   - **Orquestração**: Identifica entidade primária do tema
   - **Resultado**: "companies", "books", "projects", etc.

5. **Extrair Company Name** (T0 + ~1650ms)

   ```javascript
   const primaryEntityData = Array.isArray(
     guestWorkspace.workspace_data?.[entityKey]
   )
     ? guestWorkspace.workspace_data[entityKey][0]
     : null;
   const companyNameFromWorkspace = primaryEntityData?.name || null;
   ```

   - **Orquestração**: Extrai nome da company do workspace
   - **Fallback**: `job.dataSource.data.target` ou `researchTarget`

6. **Preparar Items** (T0 + ~1700ms)

   ```javascript
   const items = job.dataSource?.data ? [job.dataSource.data] : [];
   ```

   - **Orquestração**: Converte contexto em array de items
   - **Estrutura**: `[{ target, targetWebsite, solution, company: {...}, ... }]`

7. **Chamar queueJob** (T0 + ~1750ms)
   ```javascript
   await queueJob({
     guestId: job.guestId,
     jobId,
     templateId: job.templateId,
     model: job.model,
     items: items,
     scope: "home",
     entityKey,
     companyName: companyNameFromWorkspace || ...,
   });
   ```
   - **Comunicação**: Runner → Deck Engine Adapter
   - **Payload**: Todos os parâmetros necessários para processamento

**Timing Total**: ~1750ms até chamar adapter

---

## 🎬 Etapa 4: Deck Engine Adapter

### Serviço: Job Orchestrator

**Arquivo**: `dashboard/lib/jobs/deck-engine-adapter.js`

**Orquestração**:

1. **Resolver Entity Key e Company Name** (T0 + ~1800ms)

   ```javascript
   const resolvedEntityKey = entityKey || "companies";
   const resolvedCompanyName =
     companyName ||
     items[0]?.company?.name ||
     items[0]?.target ||
     items[0]?.researchTarget;
   ```

   - **Orquestração**: Garante valores válidos com fallbacks

2. **Definir persistTileDirectly** (T0 + ~1850ms)

   ```javascript
   const persistTileDirectly = async (tileDoc) => {
     // Closure captura: guestId, resolvedCompanyName, resolvedEntityKey
     const companyQueryField = `workspace_data.${resolvedEntityKey}.name`;
     const tilesField = `workspace_data.${resolvedEntityKey}.$.tiles`;

     // Remove versões antigas
     await db.updateOne(
       "guest_workspaces",
       {
         guest_id: guestId,
         [companyQueryField]: resolvedCompanyName,
       },
       {
         $pull: { [tilesField]: { id: tileDoc.id } },
       }
     );

     // Adiciona novo tile
     await db.updateOne(
       "guest_workspaces",
       {
         guest_id: guestId,
         [companyQueryField]: resolvedCompanyName,
       },
       {
         $push: { [tilesField]: tileDoc },
         $inc: { "usage.total_tiles_generated": 1 },
         $set: { updatedAt: new Date() },
       }
     );
   };
   ```

   - **Orquestração**: Função closure que persiste tiles no MongoDB
   - **Comunicação**: Adapter → MongoDB (quando chamada)

3. **Delay para SSE** (T0 + ~1900ms)

   ```javascript
   await new Promise((resolve) => setTimeout(resolve, 500));
   ```

   - **Objetivo**: Garantir que SSE esteja conectado antes de eventos

4. **Emitir Status QUEUED** (T0 + ~2400ms)

   ```javascript
   emitStatus("QUEUED", { current: 0, total, remaining: total });
   ```

   - **Comunicação**: Adapter → SSE Manager → SSE Route → Frontend
   - **Evento**: `job:status` com `status: "QUEUED"`

5. **Emitir Status RUNNING** (T0 + ~2450ms)

   ```javascript
   emitStatus("RUNNING");
   ```

   - **Comunicação**: Adapter → SSE Manager → SSE Route → Frontend
   - **Evento**: `job:status` com `status: "RUNNING"`

6. **Obter Runner** (T0 + ~2500ms)

   ```javascript
   const runner = getDeckEngineRunner();
   ```

   - **Orquestração**: Busca runner registrado (deck-engine-runner-openai)

7. **Chamar runner.runJob** (T0 + ~2550ms)
   ```javascript
   await runner.runJob({
     jobId,
     templateId,
     model,
     items,
     scope,
     onStatus: (payload) => emitJobEvent({ type: "job:status", ... }),
     onChunk: (payload) => emitJobEvent({ type: "job:result-chunk", ... }),
     onResult: async (payload) => {
       // ⭐ CRÍTICO: Aqui acontece a persistência
       const tileDoc = { id: `tile_${jobId}_${payload.orderIndex}`, ... };
       const persisted = await persistTileDirectly(tileDoc);
       emitJobEvent({ type: "job:result-completed", payload: { ...payload, persisted } });
     },
     onError: (payload) => emitJobEvent({ type: "job:error", ... }),
     onCompleted: (payload) => emitJobEvent({ type: "job:status", status: "COMPLETED" }),
   });
   ```
   - **Orquestração**: Passa callbacks para runner processar
   - **Comunicação**: Adapter → Runner OpenAI

**Timing Total**: ~2550ms até iniciar processamento de tiles

---

## 🤖 Etapa 5: Runner OpenAI

### Serviço: Tile Generator

**Arquivo**: `dashboard/lib/jobs/deck-engine-runner-openai.js`

**Orquestração** (para cada tile 0..7):

1. **Mapear Template ID** (T0 + ~2600ms para tile 0)

   ```javascript
   let actualTemplateId = templateId;
   if (
     templateId === "tpl_classic_default" ||
     templateId === "tpl_dynamic_default"
   ) {
     actualTemplateId = "template_1";
   }
   ```

   - **Orquestração**: Normaliza template ID

2. **Buscar Template** (T0 + ~2650ms)

   ```javascript
   const template = getGuestTemplate(actualTemplateId);
   ```

   - **Comunicação**: Runner → Template Registry
   - **Estrutura**: Template com `tiles[]` array (8 tiles)

3. **Determinar Total** (T0 + ~2700ms)

   ```javascript
   const total = Math.max(itemsCount, templateTilesCount);
   ```

   - **Orquestração**: Usa maior valor (items ou template tiles)

4. **Construir Contexto** (T0 + ~2750ms)

   ```javascript
   const context = {
     company: { name: item.target, website: item.targetWebsite },
     solution: item.solution,
     researchTarget: item.target,
     researchWebsite: item.targetWebsite,
     // ... mais campos
   };
   ```

   - **Orquestração**: Monta contexto completo para prompts

5. **Loop para Cada Tile** (T0 + ~2800ms para tile 0)

   ```javascript
   for (let i = 0; i < total; i++) {
     const tile = template.tiles[orderIndex];
     const prompt = processPromptVariables(tile.prompt, context);
     // ...
   }
   ```

   - **Orquestração**: Processa cada tile sequencialmente

6. **Loop de Tentativas** (T0 + ~2850ms para tile 0, tentativa 1)

   ```javascript
   while (attempt < TILE_MAX_ATTEMPTS) {
     // max 3 tentativas
     try {
       // Gerar completion
     } catch (error) {
       // Retry com backoff
     }
   }
   ```

   - **Orquestração**: Retry automático com backoff exponencial

7. **Chamar OpenAI Provider** (T0 + ~2900ms para tile 0)

   ```javascript
   const result = await generateCompletion({
     model,
     prompt,
   })) {
     accumulatedResult += chunk;
     // ...
   }
   ```

   - **Comunicação**: Runner → OpenAI Provider
   - **Streaming**: Chunks chegam incrementalmente

8. **Validar Resposta** (após stream completo)

   ```javascript
   const trimmedResult = accumulatedResult.trim();
   const looksLikeRefusal = TILE_REFUSAL_PATTERNS.some((regex) =>
     regex.test(trimmedResult)
   );
   const invalidResponse = !trimmedResult || looksLikeRefusal;
   ```

   - **Orquestração**: Verifica se resposta é válida
   - **Se inválido**: Retry com backoff

9. **Chamar onResult** (quando tile completo)
   ```javascript
   await onResult?.({
     jobId,
     itemId: `${jobId}_${orderIndex}`,
     orderIndex,
     title: tile?.title,
     result: finalResult,
     metrics: { model, attempts, fallback, lastError },
   });
   ```
   - **Comunicação**: Runner → Adapter (callback)
   - **Payload**: Tile completo com métricas

**Timing por Tile**: ~5-15 segundos (depende da OpenAI)

---

## 🌐 Etapa 6: Provider OpenAI

### Serviço: OpenAI API Client

**Arquivo**: `dashboard/lib/ai/provider.js`

**Orquestração**:

1. **Criar Requisição** (T0 + ~2900ms para tile 0)

   ```javascript
   const completion = await openai.chat.completions.create({
     model: "gpt-5-mini",
     messages: [
       { role: "system", content: "You are a helpful AI assistant..." },
       { role: "user", content: prompt },
     ],
     stream: true, // ⭐ STREAMING HABILITADO
     max_completion_tokens: 1000,
   });
   ```

   - **Comunicação**: Provider → OpenAI API (HTTPS)
   - **Payload**: Prompt completo processado

2. **Receber Primeiro Chunk** (T0 + ~3900ms - TTFT ~1s)

   ```javascript
   for await (const chunk of completion) {
     const content = chunk.choices[0]?.delta?.content || "";
     if (content && !firstTokenTime) {
       firstTokenTime = Date.now();
       // TTFT = Time To First Token
     }
     if (content) {
       yield content;  // ⭐ GENERATOR: retorna chunk imediatamente
     }
   }
   ```

   - **Comunicação**: OpenAI API → Provider (streaming)
   - **Timing**: TTFT ~1-2 segundos (pode variar)

3. **Yield Chunks** (T0 + ~3900ms até ~8000ms)

   - **Comunicação**: Provider → Runner (via generator)
   - **Frequência**: Chunks chegam incrementalmente
   - **Tamanho**: ~1-50 tokens por chunk

4. **Stream Completo** (T0 + ~8000ms para tile 0)
   - **Comunicação**: OpenAI API → Provider (stream end)
   - **Resultado**: Todos os chunks foram recebidos

**Timing por Tile**:

- TTFT: ~1-2s
- Stream completo: ~5-10s (depende do tamanho da resposta)

---

## 💾 Etapa 7: Persistência no MongoDB

### Serviço: MongoDB Database

**Arquivo**: `dashboard/lib/jobs/deck-engine-adapter.js` (função `persistTileDirectly`)

**Orquestração** (chamada dentro de `onResult` callback):

1. **Remover Versões Antigas** (T0 + ~8100ms para tile 0)

   ```javascript
   await db.updateOne(
     "guest_workspaces",
     {
       guest_id: guestId,
       [`workspace_data.${entityKey}.name`]: companyName,
     },
     {
       $pull: {
         [`workspace_data.${entityKey}.$.tiles`]: { id: tileDoc.id },
       },
     }
   );
   ```

   - **Comunicação**: Adapter → MongoDB
   - **Operação**: Remove tile com mesmo ID (se existir)
   - **Estrutura MongoDB**:
     ```javascript
     {
       guest_id: "guest_xxx",
       workspace_data: {
         companies: [{
           name: "Netlify",
           tiles: [
             { id: "tile_job_xxx_0", title: "...", content: "...", ... },
             // ...
           ]
         }]
       }
     }
     ```

2. **Adicionar Novo Tile** (T0 + ~8150ms para tile 0)

   ```javascript
   await db.updateOne(
     "guest_workspaces",
     {
       guest_id: guestId,
       [`workspace_data.${entityKey}.name`]: companyName,
     },
     {
       $push: {
         [`workspace_data.${entityKey}.$.tiles`]: tileDoc,
       },
       $inc: { "usage.total_tiles_generated": 1 },
       $set: { updatedAt: new Date() },
     }
   );
   ```

   - **Comunicação**: Adapter → MongoDB
   - **Operação**: Adiciona tile ao array `tiles[]`
   - **Estrutura tileDoc**:
     ```javascript
     {
       id: "tile_job_xxx_0",
       title: "What They Do",
       content: "Netlify is a web development platform...",
       answer: "Netlify is a web development platform...",
       excerpt: "Netlify is a web development platform...",
       orderIndex: 0,
       metrics: { model: "gpt-5-mini", attempts: 1, fallback: false },
       createdAt: "2025-11-06T09:05:25.155Z",
       jobId: "job_xxx",
     }
     ```

3. **Verificar Sucesso** (T0 + ~8200ms para tile 0)
   ```javascript
   const modified = result?.modifiedCount || 0;
   if (modified === 0) {
     // ⚠️ Tile não foi salvo (company não encontrada?)
     return false;
   }
   return true;
   ```
   - **Orquestração**: Valida se operação foi bem-sucedida
   - **Se falhar**: Log de warning, mas continua processamento

**Timing por Tile**: ~100-200ms (operação MongoDB)

---

## 📡 Etapa 8: SSE Manager

### Serviço: Event Distribution System

**Arquivo**: `dashboard/lib/sse-manager.js`

**Orquestração**:

1. **Emitir Evento** (T0 + ~8250ms para tile 0)

   ```javascript
   // Em deck-engine-adapter.js
   emitJobEvent({
     guestId,
     jobId,
     type: "job:result-completed",
     payload: { ...payload, persisted: true, tile: tileDoc },
     token,
   });
   ```

   - **Comunicação**: Adapter → SSE Manager

2. **SSE Manager Recebe** (T0 + ~8260ms)

   ```javascript
   // Em events.js
   const key = `guest:${guestId}:job:${jobId}`;
   const event = { type: "job:result-completed", payload };
   sseManager.emit(key, event);
   ```

   - **Orquestração**: Cria chave única para canal SSE

3. **Verificar Conexões** (T0 + ~8270ms)

   ```javascript
   const handlers = this.connections.get(key);
   const hasConnection = handlers && handlers.size > 0;
   ```

   - **Orquestração**: Verifica se há conexão SSE ativa

4. **Cenário A: Há Conexão** (T0 + ~8280ms)

   ```javascript
   if (hasConnection) {
     handlers.forEach((handler) => {
       handler(event); // ⭐ ENVIA IMEDIATAMENTE
     });
   }
   ```

   - **Comunicação**: SSE Manager → SSE Route (handler)
   - **Timing**: Imediato (~10ms)

5. **Cenário B: Não Há Conexão** (bufferiza)

   ```javascript
   else {
     const keyBuffer = this.buffer.get(key) || [];
     keyBuffer.push(event);
     if (keyBuffer.length > MAX_BUFFER_SIZE) {
       keyBuffer.shift();  // Remove mais antigo
     }
   }
   ```

   - **Orquestração**: Armazena evento no buffer
   - **Tamanho Máximo**: 50 eventos por chave

6. **Quando Conexão Estabelece** (T0 + ~5000ms - quando frontend conecta)
   ```javascript
   // Em sse-manager.js add()
   setTimeout(() => {
     bufferedEvents.forEach((event) => {
       handler(event); // ⭐ REENVIA BUFFER
     });
     this.buffer.set(key, []);
   }, 100);
   ```
   - **Orquestração**: Reenvia todos os eventos bufferizados
   - **Delay**: 100ms para garantir conexão estável

**Timing**:

- **Com conexão**: ~10ms até frontend receber
- **Sem conexão**: Evento fica no buffer até conexão estabelecer

---

## 🌐 Etapa 9: SSE Route

### Serviço: Next.js API Route (SSE Stream)

**Arquivo**: `dashboard/app/api/streams/jobs/[jobId]/route.js` (GET)

**Orquestração**:

1. **Validação de Autenticação** (quando frontend conecta)

   ```javascript
   job = await getJob(jobId);
   if (job.guestId !== guestId) return 403;
   if (job.accessTokenHash !== tokenHash) return 403;
   ```

   - **Comunicação**: SSE Route → MongoDB
   - **Orquestração**: Valida acesso ao job

2. **Criar ReadableStream** (T0 + ~5000ms - quando frontend conecta)

   ```javascript
   const stream = new ReadableStream({
     start(controller) {
       const encoder = new TextEncoder();
       const sendEvent = (type, payload) => {
         controller.enqueue(
           encoder.encode(
             `event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`
           )
         );
       };

       const onEvent = (event) => {
         sendEvent(event.type, event.payload);
       };

       sseManager.add(key, onEvent);
     },
   });
   ```

   - **Orquestração**: Cria stream SSE e registra handler no SSE Manager
   - **Comunicação**: SSE Route → SSE Manager

3. **Enviar Status Inicial** (T0 + ~5010ms)

   ```javascript
   sendEvent("job:status", {
     jobId,
     status: job.status || "QUEUED",
     progress: { current: 0, total: 8, remaining: 8 },
   });
   ```

   - **Comunicação**: SSE Route → Frontend (via EventSource)
   - **Formato SSE**:
     ```
     event: job:status
     data: {"jobId":"job_xxx","status":"QUEUED","progress":{"current":0,"total":8,"remaining":8}}
     ```

4. **Keep-Alive** (a cada 20s)

   ```javascript
   const keepAlive = setInterval(() => {
     controller.enqueue(encoder.encode(": keep-alive\n\n"));
   }, 20000);
   ```

   - **Orquestração**: Mantém conexão viva (Netlify timeout 60s)

5. **Receber Eventos do SSE Manager** (T0 + ~8280ms para tile 0)
   ```javascript
   // Handler chamado pelo SSE Manager
   onEvent({ type: "job:result-completed", payload: {...} });
   // → sendEvent("job:result-completed", payload)
   // → controller.enqueue(encoder.encode(...))
   ```
   - **Comunicação**: SSE Manager → SSE Route (handler)
   - **Comunicação**: SSE Route → Frontend (via stream)

**Timing**:

- **Conexão estabelecida**: ~5000ms (quando frontend carrega admin)
- **Eventos enviados**: Imediato quando chegam do SSE Manager

---

## 🖥️ Etapa 10: Frontend - Recepção e Renderização

### Serviço: Browser (React)

**Arquivo**: `dashboard/hooks/useJobStreaming.js` + `dashboard/containers/AdminDashboardContainer.jsx`

**Orquestração**:

1. **Conexão SSE** (T0 + ~5000ms - quando admin carrega)

   ```javascript
   // useSSEManager.js
   const eventSource = new EventSource(streamUrl);
   eventSource.addEventListener("job:result-completed", (event) => {
     const parsedData = JSON.parse(event.data);
     handler(parsedData);
   });
   ```

   - **Comunicação**: Browser → SSE Route (EventSource)
   - **Timing**: Quando `useJobStreaming` monta

2. **Receber Evento** (T0 + ~8290ms para tile 0)

   ```javascript
   // useJobStreaming.js
   "job:result-completed": (payload) => {
     persistTileAndRefresh(payload);
   }
   ```

   - **Comunicação**: SSE Route → Browser (EventSource event)
   - **Payload Recebido**:
     ```javascript
     {
       jobId: "job_xxx",
       itemId: "job_xxx_0",
       orderIndex: 0,
       title: "What They Do",
       result: "Netlify is a web development platform...",
       persisted: true,
       tile: { id: "tile_job_xxx_0", ... },
       metrics: { model: "gpt-5-mini", attempts: 1 },
     }
     ```

3. **Revalidar Workspace** (T0 + ~8300ms)

   ```javascript
   // useJobStreaming.js
   const persistTileAndRefresh = async (payload) => {
     if (payload?.persisted) {
       revalidateWorkspace(); // ⭐ SWR refetch
     }
   };
   ```

   - **Comunicação**: Browser → API (`GET /api/guest/workspace?job_id=...`)
   - **Orquestração**: SWR faz refetch automático

4. **API Retorna Workspace Atualizado** (T0 + ~8350ms)

   ```javascript
   // app/api/guest/workspace/route.js
   // Filtra tiles por jobId
   const jobTiles = wsEntity.tiles.filter(
     (t) => t.jobId === jobId || t.id.includes(`_${jobId}_`)
   );
   ```

   - **Comunicação**: API → Browser (JSON response)
   - **Estrutura Retornada**:
     ```javascript
     {
       companies: [
         {
           name: "Netlify",
           tiles: [
             {
               id: "tile_job_xxx_0",
               title: "What They Do",
               content: "...",
               jobId: "job_xxx",
             },
             // ... mais tiles
           ],
           tiles_status: "generating",
           tiles_to_generate: 8,
         },
       ];
     }
     ```

5. **Atualizar Estado React** (T0 + ~8400ms)

   ```javascript
   // AdminDashboardContainer.jsx
   const { companies } = useGuestWorkspace({ guestId, jobId, token });
   const selectedCompany = companies.find((c) => c.id === selectedCompanyId);
   const tiles = selectedCompany?.tiles || [];
   ```

   - **Orquestração**: SWR atualiza `companies` → `selectedCompany` → `tiles`
   - **Re-render**: React detecta mudança e re-renderiza

6. **Renderizar Tile** (T0 + ~8450ms)
   ```javascript
   // SortableTilesGrid.jsx
   <TileCard
     id={tile.id}
     title={tile.title}
     content={tile.content}
     // ...
   />
   ```
   - **Orquestração**: React renderiza tile na UI
   - **Timing**: Imediato após estado atualizar

**Timing Total desde OpenAI completar**:

- OpenAI completa: T0 + ~8000ms
- MongoDB salva: T0 + ~8200ms
- SSE Manager emite: T0 + ~8280ms
- Frontend recebe: T0 + ~8290ms
- Workspace refetch: T0 + ~8350ms
- Renderização: T0 + ~8450ms

**Total**: ~450ms desde persistência até renderização

---

## ⏱️ Timeline Detalhado

### Timeline Completo (Tile 0 como exemplo)

```
T0 + 0ms      │ Frontend: POST /api/prompt-jobs
              │
T0 + 450ms    │ API Route: Retorna {jobId, guestId, token}
              │ [Request HTTP termina]
              │
T0 + 1450ms   │ Runner: Delay 1s concluído
              │
T0 + 1750ms   │ Runner: queueJob() chamado
              │
T0 + 2400ms   │ Adapter: Emite job:status QUEUED
              │
T0 + 2550ms   │ Adapter: runner.runJob() iniciado
              │
T0 + 2900ms   │ Runner OpenAI: generateCompletion() chamado
              │
T0 + 3900ms   │ OpenAI Provider: Primeiro chunk recebido (TTFT ~1s)
              │
T0 + 4000ms   │ OpenAI Provider: Chunks streaming (incremental)
              │
T0 + 8000ms   │ OpenAI Provider: Stream completo
              │
T0 + 8100ms   │ Runner: onResult() callback chamado
              │
T0 + 8150ms   │ Adapter: persistTileDirectly() → MongoDB $push
              │
T0 + 8200ms   │ MongoDB: Tile salvo (modifiedCount: 1)
              │
T0 + 8250ms   │ Adapter: emitJobEvent(job:result-completed)
              │
T0 + 8280ms   │ SSE Manager: Emite para conexão ativa
              │
T0 + 8290ms   │ SSE Route: Envia evento via stream
              │
T0 + 8300ms   │ Frontend: EventSource recebe evento
              │
T0 + 8310ms   │ Frontend: persistTileAndRefresh() → revalidateWorkspace()
              │
T0 + 8350ms   │ API: GET /api/guest/workspace retorna tiles atualizados
              │
T0 + 8400ms   │ Frontend: SWR atualiza companies → selectedCompany → tiles
              │
T0 + 8450ms   │ Frontend: React re-renderiza SortableTilesGrid
              │
T0 + 8500ms   │ Frontend: Tile visível na UI ✅
```

### Timeline para Todos os 8 Tiles

```
Tile 0:  T0 + 2900ms → T0 + 8500ms  (5.6s)
Tile 1:  T0 + 12000ms → T0 + 17600ms (5.6s)
Tile 2:  T0 + 21000ms → T0 + 26700ms (5.7s)
Tile 3:  T0 + 30000ms → T0 + 35800ms (5.8s)
Tile 4:  T0 + 39000ms → T0 + 44900ms (5.9s)
Tile 5:  T0 + 48000ms → T0 + 54000ms (6.0s)
Tile 6:  T0 + 57000ms → T0 + 63100ms (6.1s)
Tile 7:  T0 + 66000ms → T0 + 72200ms (6.2s)

Total: ~72 segundos para todos os 8 tiles
```

**Nota**: Tiles são processados sequencialmente (não em paralelo)

---

## 🔄 Fluxo de Dados - Estruturas

### 1. Payload Inicial (Frontend → API)

```javascript
{
  templateId: "tpl_classic_default",
  model: "gpt-5-mini",
  context: {
    themeId: "sales-assistant",
    target: "Netlify",
    targetWebsite: "https://netlify.com",
    solution: "Mentorship Career Program"
  }
}
```

### 2. Workspace Criado (API → MongoDB)

```javascript
{
  guest_id: "guest_xxx",
  themeId: "sales-assistant",
  themeSnapshot: { id: "sales-assistant", entities: [...], tileTemplates: [...] },
  dynamicData: {
    companies: [{ name: "Netlify", website: "https://netlify.com" }]
  },
  workspace_data: {
    companies: [{
      name: "Netlify",
      website: "https://netlify.com",
      tiles: [],  // ⭐ VAZIO INICIALMENTE
      tiles_status: "pending",
      tiles_to_generate: 8
    }]
  },
  context: {
    company: { name: "Netlify", website: "https://netlify.com" },
    target: "Netlify",
    targetWebsite: "https://netlify.com",
    solution: "Mentorship Career Program",
    // ... mais campos normalizados
  }
}
```

### 3. Job Criado (API → MongoDB)

```javascript
{
  jobId: "job_xxx",
  templateId: "tpl_classic_default",
  model: "gpt-5-mini",
  status: "QUEUED",
  totals: { items: 8 },
  guestId: "guest_xxx",
  accessTokenHash: "sha256_hash_xxx",
  dataSource: {
    type: "context",
    data: {
      company: { name: "Netlify", website: "https://netlify.com" },
      target: "Netlify",
      // ... contexto completo
    }
  },
  progress: { current: 0, total: 8, remaining: 8 }
}
```

### 4. Payload para Runner (Runner → Adapter)

```javascript
{
  guestId: "guest_xxx",
  jobId: "job_xxx",
  templateId: "tpl_classic_default",
  model: "gpt-5-mini",
  items: [{
    target: "Netlify",
    targetWebsite: "https://netlify.com",
    solution: "Mentorship Career Program",
    company: { name: "Netlify", website: "https://netlify.com" },
    // ... contexto completo
  }],
  scope: "home",
  entityKey: "companies",
  companyName: "Netlify"
}
```

### 5. Prompt Processado (Runner → OpenAI)

```javascript
// Template tile.prompt original:
"Research {company.name}. Provide information about what they do, their main products or services, and their business model.";

// Após processPromptVariables():
"Research Netlify. Provide information about what they do, their main products or services, and their business model.";
```

### 6. Chunks da OpenAI (OpenAI → Provider → Runner)

```javascript
// Chunk 1
"Netlify";

// Chunk 2
" is";

// Chunk 3
" a web";

// ... (incremental)

// Chunk N
"platform for modern web development.";
```

### 7. Tile Document (Adapter → MongoDB)

```javascript
{
  id: "tile_job_xxx_0",
  title: "What They Do",
  content: "Netlify is a web development platform...",
  answer: "Netlify is a web development platform...",
  excerpt: "Netlify is a web development platform...",
  orderIndex: 0,
  metrics: {
    model: "gpt-5-mini",
    attempts: 1,
    fallback: false,
    lastError: undefined
  },
  createdAt: "2025-11-06T09:05:25.155Z",
  jobId: "job_xxx"
}
```

### 8. Evento SSE (Adapter → SSE Manager → Frontend)

```javascript
{
  type: "job:result-completed",
  payload: {
    jobId: "job_xxx",
    itemId: "job_xxx_0",
    orderIndex: 0,
    title: "What They Do",
    result: "Netlify is a web development platform...",
    persisted: true,
    entityKey: "companies",
    tile: {
      id: "tile_job_xxx_0",
      title: "What They Do",
      content: "Netlify is a web development platform...",
      // ... tile completo
    },
    metrics: {
      model: "gpt-5-mini",
      attempts: 1,
      fallback: false
    }
  }
}
```

### 9. Workspace Retornado (API → Frontend)

```javascript
{
  companies: [
    {
      id: "companie_xxx",
      name: "Netlify",
      website: "https://netlify.com",
      tiles: [
        {
          id: "tile_job_xxx_0",
          title: "What They Do",
          content: "Netlify is a web development platform...",
          orderIndex: 0,
          jobId: "job_xxx",
          // ... mais campos
        },
        // ... mais tiles conforme são gerados
      ],
      tiles_status: "generating", // ou "completed" quando todos prontos
      tiles_to_generate: 8,
    },
  ];
}
```

---

## 🔗 Comunicação Entre Serviços

### Mapa de Comunicação

```
┌─────────────┐
│  Frontend   │
└──────┬──────┘
       │ HTTP POST
       ▼
┌─────────────┐      ┌──────────────┐
│ API Route   │─────>│   MongoDB    │
│ /prompt-jobs│      │ (workspaces) │
└──────┬──────┘      └──────────────┘
       │ Fire-and-forget
       ▼
┌─────────────┐      ┌──────────────┐
│   Runner    │─────>│   MongoDB    │
│  (background)│      │  (prompt_jobs)│
└──────┬──────┘      └──────────────┘
       │ queueJob()
       ▼
┌─────────────┐
│   Adapter   │
└──────┬──────┘
       │ runner.runJob()
       ▼
┌─────────────┐      ┌──────────────┐
│Runner OpenAI│─────>│ OpenAI API  │
│             │      │  (streaming)│
└──────┬──────┘      └──────────────┘
       │ onResult()
       ▼
┌─────────────┐      ┌──────────────┐
│   Adapter   │─────>│   MongoDB    │
│ (persistTile)│      │ (guest_workspaces)│
└──────┬──────┘      └──────────────┘
       │ emitJobEvent()
       ▼
┌─────────────┐
│ SSE Manager │
└──────┬──────┘
       │ handler(event)
       ▼
┌─────────────┐      ┌──────────────┐
│  SSE Route  │─────>│   Frontend   │
│  (stream)   │      │ (EventSource)│
└─────────────┘      └──────────────┘
       │
       │ revalidateWorkspace()
       ▼
┌─────────────┐      ┌──────────────┐
│   Frontend  │─────>│ API Route    │
│   (SWR)     │      │ /guest/      │
└─────────────┘      │ workspace    │
                     └──────┬───────┘
                            │
                            ▼
                     ┌──────────────┐
                     │   MongoDB    │
                     │ (guest_      │
                     │  workspaces) │
                     └──────────────┘
```

---

## 🎯 Orquestração - Quem Monta o Quê

### 1. API Route (`/api/prompt-jobs`)

**Monta**:

- ✅ `guestId` (UUID)
- ✅ `jobId` (timestamp-based)
- ✅ `accessToken` (crypto random)
- ✅ `workspaceData` (via `createDynamicWorkspace`)
- ✅ `dynamicData` (via `createDynamicWorkspace`)
- ✅ `normalizedContext` (via `buildNormalizedContext`)

**Salva**:

- ✅ `guest_workspaces` (MongoDB)
- ✅ `prompt_jobs` (MongoDB)

**Dispara**:

- ✅ `runJobInBackground()` (fire-and-forget)

### 2. Background Runner

**Monta**:

- ✅ `entityKey` (baseado em `themeSnapshot.entities`)
- ✅ `companyName` (extraído do workspace ou job)
- ✅ `items` array (do `job.dataSource.data`)

**Comunica**:

- ✅ Runner → MongoDB (busca job e workspace)
- ✅ Runner → Adapter (`queueJob()`)

### 3. Deck Engine Adapter

**Monta**:

- ✅ `resolvedEntityKey` (com fallbacks)
- ✅ `resolvedCompanyName` (com fallbacks)
- ✅ `persistTileDirectly` closure (captura contexto)
- ✅ `tileDoc` (quando tile completo)
  - `id`: `tile_${jobId}_${orderIndex}`
  - `title`: do template ou payload
  - `content`: resultado da OpenAI
  - `metrics`: tentativas, fallback, etc.

**Comunica**:

- ✅ Adapter → Runner (`runner.runJob()`)
- ✅ Adapter → MongoDB (`persistTileDirectly()`)
- ✅ Adapter → SSE Manager (`emitJobEvent()`)

### 4. Runner OpenAI

**Monta**:

- ✅ `context` (do item + template)
- ✅ `prompt` (via `processPromptVariables`)
- ✅ `finalResult` (acumula chunks)
- ✅ `metrics` (tentativas, fallback, erros)

**Comunica**:

- ✅ Runner → OpenAI Provider (`generateCompletion()`)
- ✅ Runner → Adapter (callbacks: `onChunk`, `onResult`, `onError`)

### 5. OpenAI Provider

**Monta**:

- ✅ Requisição HTTP para OpenAI API
- ✅ Chunks incrementais (via generator)

**Comunica**:

- ✅ Provider → OpenAI API (HTTPS streaming)
- ✅ Provider → Runner (yield chunks)

### 6. SSE Manager

**Monta**:

- ✅ `key` (canal único: `guest:${guestId}:job:${jobId}`)
- ✅ `event` (tipo + payload)

**Comunica**:

- ✅ SSE Manager → SSE Route (se há conexão)
- ✅ SSE Manager → Buffer (se não há conexão)

### 7. SSE Route

**Monta**:

- ✅ `ReadableStream` (SSE format)
- ✅ `onEvent` handler (formata eventos)

**Comunica**:

- ✅ SSE Route → Frontend (via EventSource stream)

---

## 📊 Fluxo de Dados - Transformações

### Transformação 1: Context → Workspace

```
Input (context):
{
  target: "Netlify",
  targetWebsite: "https://netlify.com",
  solution: "Mentorship Career Program"
}

↓ createDynamicWorkspace()

Output (workspace_data):
{
  companies: [{
    name: "Netlify",
    website: "https://netlify.com",
    tiles: [],
    tiles_status: "pending"
  }]
}
```

### Transformação 2: Template Prompt → Prompt Final

```
Input (template.tiles[0].prompt):
"Research {company.name}. Provide information about what they do..."

↓ processPromptVariables(prompt, context)

Output (prompt final):
"Research Netlify. Provide information about what they do..."
```

### Transformação 3: OpenAI Chunks → Resultado Final

```
Input (chunks incrementais):
"Netlify" + " is" + " a web" + " development" + " platform" + ...

↓ Accumulate chunks

Output (finalResult):
"Netlify is a web development platform for modern web development..."
```

### Transformação 4: Resultado → Tile Document

```
Input (onResult payload):
{
  orderIndex: 0,
  title: "What They Do",
  result: "Netlify is a web development platform...",
  metrics: { model: "gpt-5-mini", attempts: 1 }
}

↓ Constrói tileDoc

Output (tileDoc):
{
  id: "tile_job_xxx_0",
  title: "What They Do",
  content: "Netlify is a web development platform...",
  answer: "Netlify is a web development platform...",
  excerpt: "Netlify is a web development platform...",
  orderIndex: 0,
  metrics: { model: "gpt-5-mini", attempts: 1, fallback: false },
  createdAt: "2025-11-06T09:05:25.155Z",
  jobId: "job_xxx"
}
```

### Transformação 5: Tile Document → MongoDB Update

```
Input (tileDoc):
{
  id: "tile_job_xxx_0",
  title: "What They Do",
  content: "...",
  ...
}

↓ persistTileDirectly()

Output (MongoDB update):
{
  $pull: { "workspace_data.companies.$.tiles": { id: "tile_job_xxx_0" } },
  $push: { "workspace_data.companies.$.tiles": tileDoc },
  $inc: { "usage.total_tiles_generated": 1 },
  $set: { updatedAt: new Date() }
}
```

### Transformação 6: Tile Document → SSE Event

```
Input (tileDoc + payload):
{
  tileDoc: { id: "tile_job_xxx_0", ... },
  payload: { orderIndex: 0, result: "...", metrics: {...} }
}

↓ emitJobEvent()

Output (SSE event):
{
  type: "job:result-completed",
  payload: {
    ...payload,
    persisted: true,
    tile: tileDoc,
    entityKey: "companies"
  }
}
```

### Transformação 7: SSE Event → Frontend Event

```
Input (SSE Manager event):
{
  type: "job:result-completed",
  payload: { ... }
}

↓ SSE Route sendEvent()

Output (SSE format):
event: job:result-completed
data: {"jobId":"job_xxx","orderIndex":0,"title":"What They Do",...}

↓ EventSource (browser)

Output (JavaScript event):
{
  type: "job:result-completed",
  data: { jobId: "job_xxx", orderIndex: 0, ... }
}
```

### Transformação 8: MongoDB Workspace → Frontend State

```
Input (MongoDB document):
{
  workspace_data: {
    companies: [{
      name: "Netlify",
      tiles: [
        { id: "tile_job_xxx_0", title: "What They Do", ... },
        ...
      ]
    }]
  }
}

↓ API /guest/workspace (filtra por jobId)

Output (API response):
{
  companies: [{
    name: "Netlify",
    tiles: [
      { id: "tile_job_xxx_0", title: "What They Do", jobId: "job_xxx", ... },
      // ... apenas tiles do job atual
    ],
    tiles_status: "generating",
    tiles_to_generate: 8
  }]
}

↓ SWR + React

Output (React state):
selectedCompany.tiles = [
  { id: "tile_job_xxx_0", title: "What They Do", ... },
  ...
]
```

---

## 🔄 SSE - O Que Está Fazendo

### Função do SSE Manager

**Responsabilidade**: Distribuir eventos para conexões SSE ativas

**Fluxo**:

1. **Recebe Evento** (`emitJobEvent()`)

   ```javascript
   const key = `guest:${guestId}:job:${jobId}`;
   const event = { type: "job:result-completed", payload: {...} };
   sseManager.emit(key, event);
   ```

2. **Verifica Conexões**

   ```javascript
   const handlers = this.connections.get(key);
   const hasConnection = handlers && handlers.size > 0;
   ```

3. **Se Há Conexão**:

   - Chama `handler(event)` imediatamente
   - Handler é a função `onEvent` da SSE Route
   - Evento é enviado via `ReadableStream` para frontend

4. **Se Não Há Conexão**:
   - Armazena no buffer (`this.buffer.get(key).push(event)`)
   - Buffer máximo: 50 eventos
   - Quando conexão estabelece, reenvia todos (com delay de 100ms)

### Eventos Emitidos

1. **`job:status`**

   - **Quando**: Mudança de status do job
   - **Payload**: `{ jobId, status, progress: { current, total, remaining } }`
   - **Frequência**: A cada mudança de status (QUEUED, RUNNING, COMPLETED)

2. **`job:result-completed`**

   - **Quando**: Tile completo e persistido
   - **Payload**: `{ jobId, orderIndex, title, result, persisted, tile, metrics }`
   - **Frequência**: Uma vez por tile (8 vezes para 8 tiles)

3. **`job:result-chunk`**

   - **Quando**: Chunk recebido da OpenAI (streaming)
   - **Payload**: `{ jobId, orderIndex, chunk, ix }`
   - **Frequência**: Múltiplos por tile (depende do tamanho da resposta)

4. **`job:error`**
   - **Quando**: Erro ao processar tile
   - **Payload**: `{ jobId, orderIndex, error: { message } }`
   - **Frequência**: Quando ocorre erro (pode ser múltiplos)

### Buffer de Eventos

**Quando Usado**:

- Eventos emitidos antes da conexão SSE estabelecer
- Conexão SSE cai e eventos são emitidos durante queda

**Como Funciona**:

```javascript
// Evento emitido sem conexão
sseManager.emit(key, event);
// → buffer.push(event)

// Conexão estabelece depois
sseManager.add(key, handler);
// → setTimeout(() => {
//     bufferedEvents.forEach(event => handler(event));
//   }, 100);
```

**Tamanho Máximo**: 50 eventos por chave (FIFO)

---

## 🏃 Runners - Como Funcionam

### Runner OpenAI

**Arquivo**: `dashboard/lib/jobs/deck-engine-runner-openai.js`

**Responsabilidade**: Processar cada tile sequencialmente

**Fluxo por Tile**:

1. **Preparação**

   - Busca template via `getGuestTemplate(actualTemplateId)`
   - Mapeia `orderIndex` para `template.tiles[orderIndex]`
   - Processa variáveis do prompt via `processPromptVariables(tile.prompt, context)`
   - Constrói contexto completo com `company`, `solution`, `researchTarget`, etc.

2. **Loop de Tentativas** (máximo 3x)

   ```javascript
   let attempt = 0;
   while (attempt < TILE_MAX_ATTEMPTS) {
     try {
       // Gerar completion
       const completion = await generateCompletion({
         model,
         prompt,
       })) {
         accumulatedResult += chunk;
         onChunk?.({ jobId, orderIndex, chunk, ix: chunkIndex++ });
       }

       // Validar resposta
       const trimmedResult = accumulatedResult.trim();
       const looksLikeRefusal = TILE_REFUSAL_PATTERNS.some((regex) =>
         regex.test(trimmedResult)
       );

       if (!trimmedResult || looksLikeRefusal) {
         throw new Error("Invalid or refused response");
       }

       // Sucesso - sair do loop
       break;
     } catch (error) {
       attempt++;
       metrics.lastError = error.message;

       if (attempt < TILE_MAX_ATTEMPTS) {
         // Backoff exponencial: 2s, 4s, 8s
         await new Promise((resolve) =>
           setTimeout(resolve, 2000 * Math.pow(2, attempt - 1))
         );
       }
     }
   }
   ```

3. **Fallback se Todas Tentativas Falharem**

   ```javascript
   if (!accumulatedResult || attempt >= TILE_MAX_ATTEMPTS) {
     finalResult = `⚠️ No AI output was generated for this insight after ${attempt} attempts. Please try again later.`;
     metrics.fallback = true;
   }
   ```

4. **Chamar Callbacks**
   - `onChunk()`: Para cada chunk recebido (streaming em tempo real)
   - `onResult()`: Quando tile completo (com resultado final e métricas)
   - `onError()`: Se todas tentativas falharem

**Métricas Coletadas**:

- `model`: Modelo usado (ex: "gpt-5-mini")
- `attempts`: Número de tentativas (1-3)
- `fallback`: Se usou fallback (boolean)
- `lastError`: Último erro ocorrido (se houver)
- `duration`: Tempo total de processamento

**Timing**:

- **Por tentativa**: ~5-10 segundos (depende da OpenAI)
- **Com retry**: Até 3x tentativas = ~15-30 segundos máximo
- **Total por tile**: ~5-30 segundos (depende de sucesso/falhas)

---

## 📊 Resumo da Orquestração

### Quem Faz O Quê - Resumo Executivo

| Serviço             | Responsabilidade                                        | Comunica Com                         |
| ------------------- | ------------------------------------------------------- | ------------------------------------ |
| **Frontend**        | Dispara form, conecta SSE, renderiza tiles              | API Route, SSE Route                 |
| **API Route**       | Valida, cria workspace/job, dispara background          | MongoDB, Runner                      |
| **Runner**          | Busca job/workspace, determina entityKey, chama adapter | MongoDB, Adapter                     |
| **Adapter**         | Orquestra runner, persiste tiles, emite eventos SSE     | Runner, MongoDB, SSE Manager         |
| **Runner OpenAI**   | Processa prompts, chama OpenAI, valida respostas        | OpenAI Provider, Adapter (callbacks) |
| **OpenAI Provider** | Faz requisições HTTP streaming para OpenAI API          | OpenAI API (HTTPS)                   |
| **MongoDB**         | Armazena workspaces, jobs, tiles                        | Todos os serviços backend            |
| **SSE Manager**     | Distribui eventos para conexões ativas, bufferiza       | SSE Route, Adapter                   |
| **SSE Route**       | Cria stream SSE, valida autenticação, envia eventos     | Frontend (EventSource)               |

### Fluxo de Dados - Resumo

```
1. Frontend → API Route
   Payload: { templateId, model, context }

2. API Route → MongoDB
   Salva: guest_workspaces, prompt_jobs

3. API Route → Runner (fire-and-forget)
   Dispara: runJobInBackground(jobId)

4. Runner → MongoDB
   Busca: job, guest_workspaces

5. Runner → Adapter
   Chama: queueJob({ guestId, jobId, templateId, ... })

6. Adapter → Runner OpenAI
   Chama: runner.runJob({ onStatus, onChunk, onResult, ... })

7. Runner OpenAI → OpenAI Provider
   Chama: generateCompletion({ model, prompt })

8. OpenAI Provider → OpenAI API
   Requisição: HTTPS streaming

9. OpenAI API → OpenAI Provider
   Resposta: Chunks incrementais (streaming)

10. OpenAI Provider → Runner OpenAI
    Yield: Chunks via generator

11. Runner OpenAI → Adapter
    Callback: onResult({ orderIndex, result, metrics })

12. Adapter → MongoDB
    Salva: persistTileDirectly(tileDoc) → $push tiles

13. Adapter → SSE Manager
    Emite: emitJobEvent({ type: "job:result-completed", ... })

14. SSE Manager → SSE Route
    Handler: handler(event) → sendEvent(type, payload)

15. SSE Route → Frontend
    Stream: event: job:result-completed\ndata: {...}\n\n

16. Frontend → API Route
    Refetch: GET /api/guest/workspace?job_id=...

17. API Route → MongoDB
    Busca: guest_workspaces (filtra por jobId)

18. API Route → Frontend
    Resposta: { companies: [{ tiles: [...] }] }

19. Frontend → React
    Atualiza: selectedCompany.tiles → re-render
```

### Pontos Críticos de Timing

1. **T0 + 450ms**: Request HTTP termina (job criado)
2. **T0 + 1450ms**: Runner inicia (delay 1s para SSE conectar)
3. **T0 + 2550ms**: Processamento de tiles inicia
4. **T0 + 2900ms**: Primeira chamada OpenAI (tile 0)
5. **T0 + 3900ms**: Primeiro chunk recebido (TTFT ~1s)
6. **T0 + 8000ms**: Tile 0 completo (stream completo)
7. **T0 + 8200ms**: Tile 0 persistido no MongoDB
8. **T0 + 8290ms**: Frontend recebe evento SSE
9. **T0 + 8450ms**: Tile 0 renderizado na UI

**Gap entre persistência e renderização**: ~250ms

### Garantias do Sistema

1. **Persistência Backend-First**: Tiles são salvos no MongoDB antes de emitir evento SSE
2. **Buffer de Eventos**: Eventos são bufferizados se SSE não estiver conectado
3. **Retry Automático**: Runner OpenAI tenta até 3x com backoff exponencial
4. **Fallback Resiliente**: Se todas tentativas falharem, tile recebe mensagem de fallback
5. **Isolamento por Job**: Todos os tiles são filtrados por `jobId` para evitar mistura
6. **Autenticação**: SSE Route valida `jobId`, `guestId` e `token` antes de permitir conexão
7. **SWR Revalidation**: Frontend revalida workspace após cada tile completo

---

## 🔍 Debugging - Logs Importantes

### Logs por Etapa

#### 1. API Route (`/api/prompt-jobs`)

```
✅ Workspace salvo para guestId: guest_xxx
✅ Job criado: job_xxx
🚀 Disparando Netlify Background Function para job job_xxx...
```

#### 2. Runner (`lib/jobs/runner.js`)

```
🚀 Iniciando job job_xxx em background...
⏱️ Timestamp: 2025-11-06T09:05:25.155Z
🔄 Mapeando templateId...
```

#### 3. Adapter (`lib/jobs/deck-engine-adapter.js`)

```
📤 Emitindo job:status QUEUED
📤 Emitindo job:status RUNNING
🚀 Tile 0/8: "What They Do"
```

#### 4. Runner OpenAI (`lib/jobs/deck-engine-runner-openai.js`)

```
🔄 Tentativa 1/3 para tile 0
📡 Chamando OpenAI API (model: gpt-5-mini)
✅ Resposta recebida (tentativa 1)
```

#### 5. Persistência (`persistTileDirectly`)

```
💾 Persistindo tile tile_job_xxx_0
✅ Tile salvo (modifiedCount: 1)
```

#### 6. SSE Manager (`lib/sse-manager.js`)

```
📤 job:result-completed para 'guest:xxx:job:xxx': { hasConnection: true }
```

#### 7. Frontend (`useJobStreaming`)

```
📥 Recebido evento job:result-completed
🔄 Revalidando workspace...
✅ Workspace atualizado
```

### Logs de Erro Comuns

#### Erro: Tile não persistido

```
⚠️ Empresa "X" não encontrada no workspace
modifiedCount: 0
```

**Causa**: `companyName` não corresponde ao nome salvo no workspace
**Solução**: Verificar `entityKey` e `companyName` no runner

#### Erro: SSE não conectado

```
📤 job:result-completed para 'guest:xxx:job:xxx': { hasConnection: undefined }
💾 Buffer: 1 eventos para 'guest:xxx:job:xxx'
```

**Causa**: Frontend ainda não conectou ao SSE
**Solução**: Normal - eventos serão reenviados quando conexão estabelecer

#### Erro: OpenAI recusou

```
🔄 Tentativa 2/3 para tile 0
⚠️ Resposta parece ser recusa (refusal pattern detectado)
```

**Causa**: OpenAI retornou resposta que parece recusa
**Solução**: Retry automático com backoff

---

## 📝 Conclusão

Este documento mapeia completamente o fluxo de criação de tiles desde o disparo do formulário até a renderização no frontend, incluindo:

1. **Orquestração de Serviços**: Quem monta o quê e quando
2. **Fluxo de Dados**: Como os dados são transformados em cada etapa
3. **Comunicação**: Quem fala com quem e como
4. **Timing**: Quando cada coisa acontece
5. **SSE**: Como funciona o sistema de eventos em tempo real
6. **Runners**: Como os tiles são processados sequencialmente
7. **Persistência**: Como os tiles são salvos no MongoDB
8. **Renderização**: Como o frontend recebe e exibe os tiles

**Principais Descobertas**:

- Tiles são persistidos no backend antes de emitir evento SSE (backend-first)
- Sistema usa buffer de eventos para garantir entrega mesmo se SSE não estiver conectado
- Runner OpenAI tem retry automático com backoff exponencial (até 3 tentativas)
- Gap entre persistência e renderização é ~250ms (muito rápido)
- Total de ~72 segundos para processar 8 tiles sequencialmente

**Garantias**:

- ✅ Nenhum tile depende do frontend para ser salvo
- ✅ Eventos são bufferizados se SSE não estiver conectado
- ✅ Sistema é resiliente a falhas temporárias (retry automático)
- ✅ Isolamento por job evita mistura de tiles de diferentes pesquisas

---

**Documento criado em**: 06/11/2025  
**Última atualização**: 06/11/2025  
**Status**: ✅ Completo
