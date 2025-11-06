# 🔄 Fluxo Completo: Home → Form → Enviar → Jobs → Admin → Mostrar Tiles

**Data**: 06/11/2025  
**Objetivo**: Documentar o fluxo completo desde a página inicial até a exibição dos tiles sendo gerados na página admin, incluindo todas as condicionais, arquivos, imports e atravessadores.

---

## 📋 Índice

1. [Visão Geral do Fluxo](#visão-geral-do-fluxo)
2. [Etapa 1: Home Page](#etapa-1-home-page)
3. [Etapa 2: Formulário e Submissão](#etapa-2-formulário-e-submissão)
4. [Etapa 3: Criação do Job](#etapa-3-criação-do-job)
5. [Etapa 4: Processamento em Background](#etapa-4-processamento-em-background)
6. [Etapa 5: Redirecionamento para Admin](#etapa-5-redirecionamento-para-admin)
7. [Etapa 6: Carregamento do Admin](#etapa-6-carregamento-do-admin)
8. [Etapa 7: Conexão SSE e Streaming](#etapa-7-conexão-sse-e-streaming)
9. [Etapa 8: Renderização dos Tiles](#etapa-8-renderização-dos-tiles)
10. [Checklist de Garantias](#checklist-de-garantias)
11. [Pontos de Falha e Condicionais Críticas](#pontos-de-falha-e-condicionais-críticas)

---

## 🎯 Visão Geral do Fluxo

```
┌─────────────────────────────────────────────────────────────────┐
│                         HOME PAGE (/)                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  app/page.js                                              │  │
│  │  └─> IAFormsContainer (themeId, initialTemplateId)        │  │
│  │      └─> IAFormsPresenterClassic/Dynamic                 │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                    [Usuário preenche form]
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    SUBMISSÃO DO FORMULÁRIO                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  IAFormsContainer.handleRun()                              │  │
│  │  └─> executeRunFlow(itemsPayload)                          │  │
│  │      └─> POST /api/prompt-jobs                            │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              CRIAÇÃO DO JOB E WORKSPACE                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  app/api/prompt-jobs/route.js (POST)                      │  │
│  │  ├─> Validação (Joi)                                     │  │
│  │  ├─> Pre-warm MongoDB                                    │  │
│  │  ├─> Gerar guestId, jobId, token                         │  │
│  │  ├─> Buscar tema (com fallbacks)                         │  │
│  │  ├─> createDynamicWorkspace()                            │  │
│  │  ├─> Salvar guest_workspaces                             │  │
│  │  ├─> createJob()                                         │  │
│  │  ├─> runJobInBackground() (fire-and-forget)             │  │
│  │  └─> Retorna {jobId, guestId, token}                    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              PROCESSAMENTO EM BACKGROUND                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  lib/jobs/runner.js                                       │  │
│  │  ├─> Delay 1s (aguardar SSE conectar)                    │  │
│  │  ├─> getJob(jobId)                                        │  │
│  │  ├─> Buscar workspace                                    │  │
│  │  ├─> Determinar entityKey                                 │  │
│  │  └─> queueJob() → deck-engine-adapter                     │  │
│  │      └─> deck-engine-runner-openai                        │  │
│  │          └─> Gera tiles + persistTileDirectly()           │  │
│  │              └─> Emite eventos SSE                       │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              REDIRECIONAMENTO PARA ADMIN                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  window.location.href = /admin?job_id=...&guest_id=...   │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN PAGE (/admin)                           │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  app/admin/page.jsx                                       │  │
│  │  └─> AdminDashboardContainer                              │  │
│  │      ├─> useSearchParams() (job_id, guest_id, token)     │  │
│  │      ├─> useGuestWorkspace() (SWR polling 2s)             │  │
│  │      ├─> useJobStreaming() (SSE + fallback polling)      │  │
│  │      └─> Renderiza SortableTilesGrid                      │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              CONEXÃO SSE E STREAMING                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  hooks/useJobStreaming                                    │  │
│  │  └─> useSSEManager(streamUrl, listeners)                 │  │
│  │      └─> GET /api/streams/jobs/[jobId]                   │  │
│  │          └─> SSE Manager (buffer + reenvio)              │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              RENDERIZAÇÃO DOS TILES                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  AdminDashboardContainer                                  │  │
│  │  ├─> selectedCompany.tiles (do workspace)                │  │
│  │  ├─> Eventos SSE atualizam progresso                      │  │
│  │  └─> SortableTilesGrid renderiza tiles                    │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📄 Etapa 1: Home Page

### Arquivo Principal

- **`dashboard/app/page.js`** (linhas 47-125)

### Fluxo de Renderização

```javascript
// app/page.js
export default function LandingPage() {
  const { isSignedIn, user, isLoaded } = useUser();
  const [heroView, setHeroView] = useState("dynamic");

  // Determina qual view do hero usar baseado em URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const view = params.get("hero") || "";
    setHeroView(view);
  }, []);

  return (
    <div>
      <LandingHeader />
      <main>
        {heroView === "dynamic" ? (
          <IAFormsContainer
            mode="landing"
            heroType={2}
            themeId="dynamic-default"
            initialTemplateId="tpl_dynamic_default"
            initialItems={Array.from({ length: 8 }, (_v, i) => ({
              orderIndex: i,
            }))}
          >
            {(p) => <IAFormsPresenterDynamic {...p} />}
          </IAFormsContainer>
        ) : null}
        {heroView === "" || heroView === null ? (
          <IAFormsContainer
            mode="landing"
            heroType={1}
            themeId="sales-assistant" // ⭐ CRÍTICO
            initialTemplateId="tpl_classic_default" // ⭐ CRÍTICO
            initialItems={Array.from({ length: 8 }, (_v, i) => ({
              orderIndex: i,
            }))}
          >
            {(p) => <IAFormsPresenterClassic {...p} />}
          </IAFormsContainer>
        ) : null}
      </main>
    </div>
  );
}
```

### Condicionais Críticas

1. **`heroView` determina qual formulário renderizar**

   - `heroView === "dynamic"` → `IAFormsPresenterDynamic`
   - `heroView === "" || null` → `IAFormsPresenterClassic` (default)

2. **Props obrigatórias para `IAFormsContainer`**:
   - ✅ `themeId`: "sales-assistant" ou "dynamic-default"
   - ✅ `initialTemplateId`: "tpl_classic_default" ou "tpl_dynamic_default"
   - ✅ `initialItems`: Array com 8 items com `orderIndex`

### Imports

```javascript
import IAFormsContainer from "@/components/landing/IAFormsContainer";
import IAFormsPresenterClassic from "@/components/landing/iaforms/IAFormsPresenterClassic";
import IAFormsPresenterDynamic from "@/components/landing/iaforms/IAFormsPresenterDynamic";
```

### Middleware

- **`dashboard/middleware.js`**: Rota `/` é pública (não requer autenticação)

---

## 📝 Etapa 2: Formulário e Submissão

### Arquivo Principal

- **`dashboard/components/landing/IAFormsContainer.jsx`**

### Fluxo de Submissão

```javascript
// IAFormsContainer.jsx
export default function IAFormsContainer({
  mode = "landing",
  themeId, // ⭐ OBRIGATÓRIO
  initialTemplateId, // ⭐ OBRIGATÓRIO
  initialItems,
}) {
  const [itemsBuilder, setItemsBuilder] = useState(null);

  async function handleRun() {
    // 1. Validar initialTemplateId
    if (!initialTemplateId) {
      console.error("❌ initialTemplateId não definido!");
      return; // ⚠️ BLOQUEIA SE FALTAR
    }

    // 2. Executar itemsBuilder para obter dados do formulário
    let itemsPayload = [];
    if (typeof itemsBuilder === "function") {
      const builderFn = itemsBuilder();
      if (typeof builderFn === "function") {
        itemsPayload = builderFn();
      }
    }

    // 3. Validar itemsPayload
    if (
      itemsPayload.length === 0 ||
      (itemsPayload.length > 0 &&
        Object.keys(itemsPayload[0] || {}).every((key) => key === "orderIndex"))
    ) {
      console.error("❌ Items payload está vazio ou inválido!");
      setRunning(false);
      return; // ⚠️ BLOQUEIA SE DADOS INVÁLIDOS
    }

    // 4. Continuar com executeRunFlow
    executeRunFlow(itemsPayload);
  }

  const executeRunFlow = useCallback(
    async (itemsPayload) => {
      // 1. Extrair primeiro item
      const firstItem = itemsPayload[0] || {};

      // 2. Normalizar company (pode ser objeto ou string)
      const companyName =
        typeof firstItem.company === "object"
          ? firstItem.company?.name || firstItem.company?.title || ""
          : firstItem.company || "";

      // 3. Construir contexto
      const context = {
        themeId: themeId, // ⭐ DEVE SER PASSADO
        target:
          firstItem.researchTarget ||
          companyName ||
          firstItem.name ||
          "Preview",
        targetWebsite:
          firstItem.researchWebsite || firstItem.companyWebsite || "",
        solution: firstItem.solution || "N/A",
      };

      // 4. POST para criar job
      const createRes = await fetch("/api/prompt-jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: initialTemplateId, // ⭐ DEVE SER PASSADO
          model: "o4-mini",
          context: context,
        }),
      });

      if (!createRes.ok) {
        // ⚠️ ERRO: Não criar job
        setRunning(false);
        return;
      }

      // 5. Extrair resposta
      const { jobId, guestId, token } = await createRes.json();

      // 6. Redirecionar
      const qp = new URLSearchParams();
      qp.set("job_id", jobId);
      qp.set("guest_id", guestId);
      if (token) {
        qp.set("token", token);
      }
      window.location.href = `/admin?${qp.toString()}`;
    },
    [initialTemplateId, themeId]
  );
}
```

### Condicionais Críticas

1. **`initialTemplateId` deve existir**

   - ❌ Se `undefined` → `handleRun()` retorna imediatamente
   - ✅ Deve ser "tpl_classic_default" ou "tpl_dynamic_default"

2. **`itemsBuilder` deve retornar dados válidos**

   - ❌ Se vazio ou só `orderIndex` → `handleRun()` retorna
   - ✅ Deve conter: `researchTarget`, `company`, `solution`, `researchWebsite`, `companyWebsite`

3. **`themeId` deve ser passado**

   - ❌ Se `undefined` → API pode usar fallback
   - ✅ Deve ser "sales-assistant" ou "dynamic-default"

4. **Resposta da API deve ser OK**
   - ❌ Se `!createRes.ok` → `setRunning(false)` e retorna
   - ✅ Deve retornar `{jobId, guestId, token}`

### Dependências

- `itemsBuilder` é setado pelo `IAFormsPresenterClassic/Dynamic` via `setItemsBuilder`
- `initialTemplateId` vem de `app/page.js`
- `themeId` vem de `app/page.js`

---

## 🏗️ Etapa 3: Criação do Job

### Arquivo Principal

- **`dashboard/app/api/prompt-jobs/route.js`** (POST)

### Fluxo de Criação

```javascript
// app/api/prompt-jobs/route.js
export async function POST(req) {
  // 1. VALIDAÇÃO (Joi)
  const body = await req.json();
  const { error, value } = requestBodySchema.validate(body);
  if (error) {
    return NextResponse.json(
      { error: "Invalid request body", details: error.details },
      { status: 400 }
    );
  }
  const { templateId, model, context } = value;

  // 2. PRE-WARM MONGODB
  await withMongoConnection(
    async ({ db: mongoDb }) => {
      await mongoDb.admin().ping();
    },
    { label: "create-job:prewarm", retries: 3 }
  );

  // 3. GERAR IDs E TOKEN
  const guestId = `guest_${uuidv4()}`;
  const jobId = `job_${Date.now().toString(36)}`;
  const accessToken = crypto.randomBytes(24).toString("hex");
  const accessTokenHash = crypto
    .createHash("sha256")
    .update(accessToken)
    .digest("hex");

  // 4. BUSCAR TEMA (com fallbacks)
  const themeId = context.themeId || "sales-assistant";
  let theme = await db.findOne("themes", { id: themeId });

  if (!theme) {
    theme = await db.findOne("themes", { id: "sales-assistant" });
  }

  if (!theme) {
    const { BASE_THEMES } = await import("@/lib/base-themes");
    theme = BASE_THEMES.sales;
  }

  if (!theme) {
    return NextResponse.json(
      { error: "Nenhum tema funcional encontrado." },
      { status: 500 }
    );
  }

  // 5. CRIAR WORKSPACE DINÂMICO
  const { workspaceData, dynamicData, themeSnapshot } =
    await createDynamicWorkspace(theme, context);

  const normalizedContext = buildNormalizedContext(context, dynamicData);

  // 6. SALVAR GUEST WORKSPACE
  const newWorkspace = {
    guest_id: guestId,
    themeId: themeSnapshot.id,
    themeSnapshot: themeSnapshot,
    dynamicData: dynamicData,
    workspace_data: workspaceData,
    context: normalizedContext,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.insertOne("guest_workspaces", newWorkspace);

  // 7. CRIAR JOB
  const totals = { items: themeSnapshot.tileTemplates?.length || 8 };
  await createJob({
    jobId,
    templateId,
    model,
    dataSource: { type: "context", data: normalizedContext },
    status: "QUEUED",
    totals,
    guestId,
    accessTokenHash,
  });

  // 8. DISPARAR BACKGROUND (fire-and-forget)
  const { runJobInBackground } = await import("@/lib/jobs/runner");
  runJobInBackground(jobId);

  // 9. RETORNAR IDs E TOKEN
  return NextResponse.json(
    { jobId, guestId, token: accessToken },
    { status: 201 }
  );
}
```

### Condicionais Críticas

1. **Validação do Body (Joi)**

   - ❌ Se inválido → `400 Bad Request`
   - ✅ Deve ter: `templateId` (string), `model` (opcional), `context` (objeto com `target`)

2. **Pre-warm MongoDB**

   - ❌ Se falhar após 3 retries → pode causar erro 500
   - ✅ Deve pingar MongoDB antes de continuar

3. **Busca do Tema (3 níveis de fallback)**

   - ❌ Se nenhum tema encontrado → `500 Internal Server Error`
   - ✅ Fallback 1: `context.themeId`
   - ✅ Fallback 2: "sales-assistant"
   - ✅ Fallback 3: `BASE_THEMES.sales`

4. **Criação do Workspace**

   - ❌ Se `createDynamicWorkspace` falhar → erro 500
   - ✅ Deve criar `workspaceData`, `dynamicData`, `themeSnapshot`

5. **Inserção no MongoDB**

   - ❌ Se `insertOne` falhar → erro 500
   - ✅ Deve salvar `guest_workspaces` com todos os dados

6. **Criação do Job**
   - ❌ Se `createJob` falhar → erro 500
   - ✅ Deve salvar job com status "QUEUED"

### Imports

```javascript
import { db, withMongoConnection } from "@/lib/db";
import { createJob } from "@/lib/db/prompt-jobs";
import { createDynamicWorkspace } from "@/lib/dynamic-workspace";
```

### Middleware

- **`dashboard/middleware.js`**: Rota `/api/prompt-jobs` é pública (não requer autenticação)

---

## ⚙️ Etapa 4: Processamento em Background

### Arquivo Principal

- **`dashboard/lib/jobs/runner.js`**

### Fluxo de Processamento

```javascript
// lib/jobs/runner.js
export function runJobInBackground(jobId) {
  (async () => {
    try {
      // 1. DELAY PARA SSE CONECTAR
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log("✅ Delay concluído, SSE deve estar conectado");

      // 2. BUSCAR JOB
      job = await getJob(jobId);
      if (!job) {
        throw new Error(`Job ${jobId} não encontrado`);
      }

      // 3. BUSCAR WORKSPACE
      const guestWorkspace = await db.findOne("guest_workspaces", {
        guest_id: job.guestId,
      });
      if (!guestWorkspace) {
        throw new Error(`Workspace para guest ${job.guestId} não encontrado`);
      }

      // 4. DETERMINAR ENTITY KEY
      let entityKey = "companies";
      const primaryEntity = guestWorkspace?.themeSnapshot?.entities?.find(
        (entity) => entity.isPrimary
      );
      if (primaryEntity?.id) {
        entityKey = `${primaryEntity.id}s`.replace("companys", "companies");
      }

      // 5. EXTRAIR COMPANY NAME
      const primaryEntityData = Array.isArray(
        guestWorkspace.workspace_data?.[entityKey]
      )
        ? guestWorkspace.workspace_data[entityKey][0]
        : null;
      const companyNameFromWorkspace = primaryEntityData?.name || null;

      // 6. PREPARAR ITEMS
      const items = job.dataSource?.data ? [job.dataSource.data] : [];

      // 7. ATUALIZAR JOB STATUS
      await updateJob(jobId, { status: "QUEUED", initialItems: items });

      // 8. ENFILEIRAR JOB
      await queueJob({
        guestId: job.guestId,
        jobId,
        templateId: job.templateId,
        model: job.model,
        items: items,
        scope: "home",
        entityKey,
        companyName:
          companyNameFromWorkspace ||
          job.dataSource?.data?.company?.name ||
          job.dataSource?.data?.target ||
          job.dataSource?.data?.researchTarget ||
          null,
      });
    } catch (error) {
      console.error(`❌ Erro ao executar job ${jobId}:`, error);
      await updateJob(jobId, { status: "FAILED", error: error.message });
    }
  })();
}
```

### Condicionais Críticas

1. **Job deve existir**

   - ❌ Se `!job` → throw Error
   - ✅ Deve estar salvo em `prompt_jobs`

2. **Workspace deve existir**

   - ❌ Se `!guestWorkspace` → throw Error
   - ✅ Deve estar salvo em `guest_workspaces` com `guest_id`

3. **Entity Key deve ser determinada**

   - ✅ Fallback: "companies"
   - ✅ Ou baseado em `themeSnapshot.entities` (primary)

4. **Company Name deve ser extraído**
   - ✅ Prioridade 1: `workspace_data[entityKey][0].name`
   - ✅ Prioridade 2: `job.dataSource.data.company.name`
   - ✅ Prioridade 3: `job.dataSource.data.target`
   - ✅ Prioridade 4: `job.dataSource.data.researchTarget`

### Próxima Etapa: `queueJob`

- **Arquivo**: `dashboard/lib/jobs/deck-engine-adapter.js`
- **Função**: `queueJob({ guestId, jobId, templateId, model, items, scope, entityKey, companyName })`
- **Responsabilidade**:
  - Chama `deck-engine-runner-openai`
  - Gera tiles via OpenAI
  - Persiste tiles diretamente no MongoDB (`persistTileDirectly`)
  - Emite eventos SSE (`emitJobEvent`)

---

## 🔄 Etapa 5: Redirecionamento para Admin

### Arquivo Principal

- **`dashboard/components/landing/IAFormsContainer.jsx`** (linha 240)

### Fluxo de Redirecionamento

```javascript
// IAFormsContainer.jsx - executeRunFlow
const { jobId, guestId, token } = await createRes.json();

const qp = new URLSearchParams();
qp.set("job_id", jobId);
qp.set("guest_id", guestId);
if (token) {
  qp.set("token", token);
}

window.location.href = `/admin?${qp.toString()}`;
```

### Condicionais Críticas

1. **Token é opcional**

   - ✅ Se `token` existe → adiciona na URL
   - ✅ Se não existe → URL sem token (ainda funciona se backend não exigir)

2. **URL gerada**
   - ✅ Formato: `/admin?job_id=job_xxx&guest_id=guest_xxx&token=xxx`

### Middleware

- **`dashboard/middleware.js`**: Rota `/admin` é pública (não requer autenticação)

---

## 📊 Etapa 6: Carregamento do Admin

### Arquivo Principal

- **`dashboard/app/admin/page.jsx`**

### Fluxo de Renderização

```javascript
// app/admin/page.jsx
export default function AdminDashboard() {
  return (
    <Suspense fallback={<AdminDashboardLoading />}>
      <AdminDashboardContainer />
    </Suspense>
  );
}
```

### Container Principal

- **`dashboard/containers/AdminDashboardContainer.jsx`**

### Fluxo de Inicialização

```javascript
// AdminDashboardContainer.jsx
export function AdminDashboardContainer() {
  const searchParams = useSearchParams();
  const jobIdFromUrl = searchParams.get("job_id");
  const guestIdFromUrl = searchParams.get("guest_id");
  const tokenFromUrl = searchParams.get("token");

  // 1. VALIDAÇÃO DE SESSÃO
  if (!jobIdFromUrl || !guestIdFromUrl) {
    return <div>Session Required</div>; // ⚠️ BLOQUEIA SE FALTAR
  }

  // 2. HOOK: CARREGAR WORKSPACE (SWR)
  const {
    data,
    error,
    isLoading,
    companies,
    contacts,
    workspaceName,
    revalidateWorkspace,
  } = useGuestWorkspace({
    guestId: guestIdFromUrl,
    jobId: jobIdFromUrl,
    token: tokenFromUrl,
  });

  // 3. HOOK: STREAMING DE JOBS (SSE + Polling)
  const { tileProgress } = useJobStreaming({
    jobId: jobIdFromUrl,
    guestId: guestIdFromUrl,
    token: tokenFromUrl,
    onTilePersisted: () => {},
    revalidateWorkspace,
    isGenerating,
  });

  // 4. SELEÇÃO DE COMPANY
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  useEffect(() => {
    if (!companies.length) {
      setSelectedCompanyId(null);
      return;
    }

    // Preferir company com tiles do job atual
    const preferred =
      companies.find((company) => {
        if (!jobIdFromUrl) return false;
        return (company.tiles || []).some(
          (tile) => tile.jobId === jobIdFromUrl
        );
      }) || companies[0];

    setSelectedCompanyId(preferred?.id || null);
  }, [companies, jobIdFromUrl]);

  // 5. RENDERIZAÇÃO
  if (isLoading && !data) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <AppLayout>
      {selectedCompany ? (
        <SortableTilesGrid
          tiles={selectedCompany.tiles || []}
          tilesToGenerate={tilesToGenerate}
          isGeneratingTiles={isGenerating}
        />
      ) : (
        <div>Select a company</div>
      )}
    </AppLayout>
  );
}
```

### Condicionais Críticas

1. **Validação de Sessão**

   - ❌ Se `!jobIdFromUrl || !guestIdFromUrl` → mostra "Session Required"
   - ✅ Ambos devem estar na URL

2. **Carregamento do Workspace**

   - ❌ Se `isLoading && !data` → mostra loading
   - ❌ Se `error` → mostra erro
   - ✅ Deve retornar `companies`, `contacts`, `workspaceName`

3. **Seleção de Company**

   - ✅ Prioridade 1: Company com tiles do `jobIdFromUrl`
   - ✅ Prioridade 2: Primeira company do array
   - ❌ Se `companies.length === 0` → `selectedCompanyId = null`

4. **Tiles para Renderizar**
   - ✅ `selectedCompany.tiles` → array de tiles
   - ✅ `tilesToGenerate` → total esperado (do template ou progresso)
   - ✅ `isGenerating` → `tiles_status === "pending" || "generating"`

### Hook: `useGuestWorkspace`

**Arquivo**: `dashboard/hooks/useGuestWorkspace.js`

```javascript
export function useGuestWorkspace({ guestId, jobId, token }) {
  const swrKey = useMemo(() => {
    if (jobId && guestId) {
      const params = {
        guest_id: guestId,
        job_id: jobId,
        _: Date.now().toString(),
      };
      if (token) {
        params.token = token;
      }
      return `/api/guest/workspace?${searchParams.toString()}`;
    }
    return null;
  }, [guestId, jobId, token]);

  const { data, error, isLoading, mutate } = useSWR(swrKey, fetcher, {
    refreshInterval: jobId ? 2000 : 0, // ⭐ POLLING A CADA 2s SE TEM JOB
    revalidateOnFocus: true,
  });

  return {
    data,
    error,
    isLoading,
    companies,
    contacts,
    workspaceName,
    revalidateWorkspace: mutate,
  };
}
```

**Condicionais**:

- ✅ Se `jobId && guestId` → cria SWR key com ambos
- ✅ Se `token` → adiciona na query
- ✅ `refreshInterval: 2000` → polling a cada 2s quando há job

### API: `/api/guest/workspace`

**Arquivo**: `dashboard/app/api/guest/workspace/route.js` (GET)

**Fluxo**:

1. Valida `jobId`, `guestId`, `token` (se `jobId` presente)
2. Busca `guest_workspaces` por `guest_id`
3. Se `jobId` presente → **filtra tiles por `jobId`**
4. Mescla `workspace_data` com `dynamicData`
5. Recalcula `tiles_status` e `tiles_to_generate`
6. Retorna dados mesclados

**Filtro de Tiles por JobId** (linhas 248-270):

```javascript
if (jobId) {
  const jobTiles = (wsEntity.tiles || []).filter((t) => {
    // Verificar campo jobId direto
    if (t.jobId === jobId) return true;
    // Verificar se o ID do tile contém o jobId
    if (t.id && typeof t.id === "string") {
      return t.id.includes(`_${jobId}_`) || t.id.startsWith(`tile_${jobId}_`);
    }
    return false;
  });
  wsEntity.tiles = jobTiles.length > 0 ? jobTiles : [];
}
```

---

## 📡 Etapa 7: Conexão SSE e Streaming

### Hook Principal

- **`dashboard/hooks/useJobStreaming.js`**

### Fluxo de Conexão SSE

```javascript
// useJobStreaming.js
export function useJobStreaming({
  jobId,
  guestId,
  token,
  revalidateWorkspace,
  isGenerating,
}) {
  const [tileProgress, setTileProgress] = useState(DEFAULT_PROGRESS);

  // 1. CONSTRUIR STREAM URL
  const streamUrl = useMemo(() => {
    if (!jobId || !guestId || !token) return null; // ⚠️ BLOQUEIA SE FALTAR
    return `/api/streams/jobs/${jobId}?guest_id=${guestId}&token=${token}`;
  }, [guestId, jobId, token]);

  // 2. LISTENERS SSE
  const sseListeners = useMemo(() => {
    if (!jobId) return {};
    return {
      "job:status": (payload) => {
        if (payload?.progress) {
          setTileProgress(payload.progress);
        }
        if (payload?.status === "COMPLETED") {
          revalidateWorkspace();
        }
      },
      "job:result-completed": (payload) => {
        persistTileAndRefresh(payload);
        if (onTilePersisted) {
          onTilePersisted(payload);
        }
      },
    };
  }, [jobId, persistTileAndRefresh, revalidateWorkspace]);

  // 3. OPÇÕES SSE (fallback polling)
  const sseOptions = useMemo(
    () => ({
      onPermanentError: handleSSEPermanentError, // → startPolling()
      onReconnect: handleSSEReconnect, // → stopPolling()
    }),
    [handleSSEPermanentError, handleSSEReconnect]
  );

  // 4. CONECTAR SSE
  useSSEManager(streamUrl, sseListeners, sseOptions);

  return { tileProgress };
}
```

### Hook: `useSSEManager`

**Arquivo**: `dashboard/hooks/useSSEManager.js`

**Fluxo**:

1. Valida `streamUrl` (não vazio, string válida)
2. Cria `EventSource(streamUrl)`
3. Configura `onopen`, `onerror`, `addEventListener` para eventos nomeados
4. Retry automático com backoff exponencial (max 3 tentativas)
5. Se falhar permanentemente → chama `onPermanentError` → ativa polling

**Condicionais**:

- ❌ Se `!streamUrl || streamUrl.trim() === ""` → não conecta
- ❌ Se `readyState === CLOSED` → tenta reconectar (max 3x)
- ✅ Se `readyState === OPEN` → conexão estabelecida

### API: `/api/streams/jobs/[jobId]`

**Arquivo**: `dashboard/app/api/streams/jobs/[jobId]/route.js` (GET)

**Fluxo**:

1. Valida `jobId`, `guestId`, `token`
2. Busca job no MongoDB
3. Valida `job.guestId === guestId` e hash do token
4. Cria `ReadableStream` para SSE
5. Adiciona handler ao `SSE Manager`
6. Envia status inicial do job
7. Keep-alive a cada 20s

**SSE Manager**:

- **Arquivo**: `dashboard/lib/sse-manager.js`
- **Responsabilidade**:
  - Gerencia conexões ativas por chave (`guest:${guestId}:job:${jobId}`)
  - Bufferiza eventos quando não há conexão
  - Reenvia buffer quando conexão é estabelecida (com delay de 100ms)

**Condicionais**:

- ❌ Se autenticação falhar → `401` ou `403`
- ❌ Se job não encontrado → `404`
- ✅ Se tudo OK → stream SSE ativo

---

## 🎨 Etapa 8: Renderização dos Tiles

### Componente Principal

- **`dashboard/containers/AdminDashboardContainer.jsx`**

### Fluxo de Renderização

```javascript
// AdminDashboardContainer.jsx
const selectedCompany = useMemo(() => {
  if (!selectedCompanyId) return null;
  return companies.find((company) => company.id === selectedCompanyId) || null;
}, [companies, selectedCompanyId]);

const tiles = useMemo(() => selectedCompany?.tiles || [], [selectedCompany]);

const tilesToGenerate = useMemo(() => {
  return (
    selectedCompany?.tiles_to_generate ||
    tileProgress.total ||
    tiles.length ||
    0
  );
}, [selectedCompany, tileProgress.total, tiles.length]);

const isGenerating = useMemo(() => {
  const status = selectedCompany?.tiles_status;
  return status === "pending" || status === "generating";
}, [selectedCompany]);

return (
  <AppLayout>
    {selectedCompany ? (
      <SortableTilesGrid
        tiles={tiles}
        tilesToGenerate={tilesToGenerate}
        isGeneratingTiles={isGenerating}
        onTileClick={handleTileClick}
        onDeleteTile={handleDeleteTile}
        onReorder={handleReorderTiles}
      />
    ) : (
      <div>Select a company</div>
    )}
  </AppLayout>
);
```

### Atualização dos Tiles

**Fonte 1: Workspace (SWR Polling)**

- `useGuestWorkspace` faz polling a cada 2s
- Atualiza `companies` → `selectedCompany` → `tiles`

**Fonte 2: SSE Events**

- `job:result-completed` → `persistTileAndRefresh()` → `revalidateWorkspace()`
- `job:status` → atualiza `tileProgress`

**Fonte 3: Fallback Polling**

- Se SSE falhar → `startPolling()` → `revalidateWorkspace()` a cada 4s

### Condicionais Críticas

1. **Company deve estar selecionada**

   - ❌ Se `!selectedCompany` → mostra "Select a company"
   - ✅ Deve ter `selectedCompanyId` válido

2. **Tiles devem ser carregados**

   - ✅ `selectedCompany.tiles` → array de tiles
   - ✅ Filtrados por `jobId` na API (se `jobId` presente)

3. **Status de Geração**

   - ✅ `tiles_status === "pending" || "generating"` → `isGenerating = true`
   - ✅ `tiles_status === "completed"` → `isGenerating = false`

4. **Total de Tiles**
   - ✅ Prioridade 1: `selectedCompany.tiles_to_generate`
   - ✅ Prioridade 2: `tileProgress.total`
   - ✅ Prioridade 3: `tiles.length`

---

## ✅ Checklist de Garantias

### Para o Fluxo Funcionar Corretamente

#### 1. Home Page

- [ ] `app/page.js` passa `themeId` correto ("sales-assistant" ou "dynamic-default")
- [ ] `app/page.js` passa `initialTemplateId` correto ("tpl_classic_default" ou "tpl_dynamic_default")
- [ ] `IAFormsContainer` recebe props válidas
- [ ] `IAFormsPresenterClassic/Dynamic` seta `itemsBuilder` corretamente

#### 2. Formulário

- [ ] `itemsBuilder` retorna array com dados válidos (não só `orderIndex`)
- [ ] Campos obrigatórios preenchidos: `researchTarget`, `company`, `solution`, `researchWebsite`, `companyWebsite`
- [ ] `initialTemplateId` não é `undefined`

#### 3. Criação do Job

- [ ] MongoDB está acessível (pre-warm funciona)
- [ ] Tema existe no banco ou fallback funciona
- [ ] `createDynamicWorkspace` cria workspace válido
- [ ] `guest_workspaces` é salvo com sucesso
- [ ] `prompt_jobs` é salvo com sucesso
- [ ] `runJobInBackground` é chamado (fire-and-forget)

#### 4. Background Processing

- [ ] Job existe no banco quando `runJobInBackground` executa
- [ ] Workspace existe no banco
- [ ] `entityKey` é determinada corretamente
- [ ] `companyName` é extraído corretamente
- [ ] `queueJob` é chamado com parâmetros corretos
- [ ] Tiles são gerados e persistidos (`persistTileDirectly`)
- [ ] Eventos SSE são emitidos (`emitJobEvent`)

#### 5. Redirecionamento

- [ ] `jobId`, `guestId`, `token` são retornados pela API
- [ ] URL é construída corretamente: `/admin?job_id=...&guest_id=...&token=...`
- [ ] `window.location.href` redireciona

#### 6. Admin Page

- [ ] `useSearchParams()` lê `job_id`, `guest_id`, `token` da URL
- [ ] Validação de sessão passa (`jobId && guestId`)
- [ ] `useGuestWorkspace` faz requisição para `/api/guest/workspace`
- [ ] API retorna workspace válido
- [ ] `companies` array não está vazio
- [ ] Company é selecionada automaticamente

#### 7. SSE Connection

- [ ] `streamUrl` é construída corretamente
- [ ] `useSSEManager` cria `EventSource`
- [ ] Autenticação na rota SSE passa
- [ ] SSE Manager adiciona handler
- [ ] Buffer de eventos é reenviado (se houver)
- [ ] Eventos `job:status` e `job:result-completed` chegam

#### 8. Renderização

- [ ] `selectedCompany` não é `null`
- [ ] `selectedCompany.tiles` é array (pode estar vazio inicialmente)
- [ ] `tilesToGenerate` é calculado corretamente
- [ ] `isGenerating` reflete status correto
- [ ] `SortableTilesGrid` renderiza tiles
- [ ] Tiles aparecem quando salvos no banco

---

## ⚠️ Pontos de Falha e Condicionais Críticas

### 1. Falta de `initialTemplateId`

**Onde**: `IAFormsContainer.handleRun()`  
**Sintoma**: `console.error("❌ initialTemplateId não definido!")`  
**Ação**: `handleRun()` retorna imediatamente  
**Solução**: Garantir que `app/page.js` sempre passe `initialTemplateId`

### 2. Items Payload Vazio

**Onde**: `IAFormsContainer.handleRun()`  
**Sintoma**: `console.error("❌ Items payload está vazio ou inválido!")`  
**Ação**: `handleRun()` retorna, `setRunning(false)`  
**Solução**: Garantir que `itemsBuilder` retorne dados válidos

### 3. Tema Não Encontrado

**Onde**: `app/api/prompt-jobs/route.js`  
**Sintoma**: `500 Internal Server Error`  
**Ação**: Retorna erro "Nenhum tema funcional encontrado"  
**Solução**: Garantir que tema existe no banco ou `BASE_THEMES` está disponível

### 4. MongoDB Indisponível

**Onde**: `app/api/prompt-jobs/route.js` (pre-warm)  
**Sintoma**: Timeout ou erro de conexão  
**Ação**: Pode causar erro 500 ou 503  
**Solução**: `withMongoConnection` com retries (3x)

### 5. Job Não Encontrado no Background

**Onde**: `lib/jobs/runner.js`  
**Sintoma**: `throw new Error("Job não encontrado")`  
**Ação**: Job fica com status "FAILED"  
**Solução**: Garantir que job é salvo antes de chamar `runJobInBackground`

### 6. Workspace Não Encontrado no Background

**Onde**: `lib/jobs/runner.js`  
**Sintoma**: `throw new Error("Workspace não encontrado")`  
**Ação**: Job fica com status "FAILED"  
**Solução**: Garantir que workspace é salvo antes de criar job

### 7. Falta de `jobId` ou `guestId` na URL

**Onde**: `AdminDashboardContainer`  
**Sintoma**: Mostra "Session Required"  
**Ação**: Não carrega workspace  
**Solução**: Garantir que redirecionamento inclui ambos na URL

### 8. SSE Não Conecta

**Onde**: `useSSEManager`  
**Sintoma**: `readyState === CLOSED`, eventos não chegam  
**Ação**: Retry automático (max 3x), depois ativa polling  
**Solução**: Verificar autenticação SSE, URL correta, servidor respondendo

### 9. Tiles Não Aparecem Após F5

**Onde**: `app/api/guest/workspace/route.js` (filtro)  
**Sintoma**: Tiles salvos não aparecem  
**Ação**: Filtro por `jobId` pode estar incorreto  
**Solução**: Verificar se tiles têm `jobId` ou ID contém `jobId`

### 10. Company Não Selecionada

**Onde**: `AdminDashboardContainer`  
**Sintoma**: Mostra "Select a company"  
**Ação**: `selectedCompanyId` fica `null`  
**Solução**: Verificar se `companies` array não está vazio e tem tiles do job

---

## 📚 Arquivos Envolvidos (Resumo)

### Frontend

- `app/page.js` - Home page
- `app/admin/page.jsx` - Admin page
- `components/landing/IAFormsContainer.jsx` - Container do formulário
- `components/landing/iaforms/IAFormsPresenterClassic.jsx` - Presenter clássico
- `components/landing/iaforms/IAFormsPresenterDynamic.jsx` - Presenter dinâmico
- `containers/AdminDashboardContainer.jsx` - Container do admin
- `hooks/useGuestWorkspace.js` - Hook para workspace (SWR)
- `hooks/useJobStreaming.js` - Hook para streaming (SSE + polling)
- `hooks/useSSEManager.js` - Hook para gerenciar SSE

### Backend

- `app/api/prompt-jobs/route.js` - Criação de jobs
- `app/api/guest/workspace/route.js` - Busca de workspace
- `app/api/streams/jobs/[jobId]/route.js` - SSE stream
- `lib/jobs/runner.js` - Processamento em background
- `lib/jobs/deck-engine-adapter.js` - Adapter para deck engine
- `lib/jobs/deck-engine-runner-openai.js` - Runner OpenAI
- `lib/jobs/events.js` - Emissão de eventos SSE
- `lib/sse-manager.js` - Gerenciador de conexões SSE
- `lib/dynamic-workspace.js` - Criação de workspace dinâmico
- `lib/db/prompt-jobs.js` - Operações de jobs no MongoDB

### Middleware

- `middleware.js` - Autenticação e rotas públicas

---

## 🔍 Debugging

### Logs Importantes

1. **Home → Form**:

   - `[IAFormsContainer] ✅ itemsBuilder executado com sucesso`
   - `[IAFormsContainer] 📋 Items gerados: X items`

2. **Form → API**:

   - `[IAFormsContainer v2.0] 🚀 Iniciando Fluxo 2.0...`
   - `[IAFormsContainer v2.0] 📋 Contexto construído: {...}`

3. **API → Job**:

   - `[Create Job Route v2.0] ✅ Payload validado`
   - `[Create Job Route v2.0] ✅ Workspace salvo`
   - `[Create Job Route v2.0] ✅ Job criado: job_xxx`

4. **Background**:

   - `[Runner] 🚀 Iniciando job job_xxx em background...`
   - `[Runner] ✅ Job encontrado`
   - `[DeckEngine] 💾 Persistindo tile tile_xxx diretamente`

5. **Admin**:

   - `[AdminDashboardContainer] ✅ Componente começou a renderizar`
   - `[useGuestWorkspace] GET /api/guest/workspace?...`

6. **SSE**:
   - `[useSSEManager] SSE connection opened`
   - `[SSE Manager] ➕ Nova conexão: guest:xxx:job:xxx`
   - `[SSE Manager] 📤 job:result-completed para 'guest:xxx:job:xxx'`

---

**Documento criado em**: 06/11/2025  
**Última atualização**: 06/11/2025
