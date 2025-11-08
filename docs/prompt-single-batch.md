# 🚀 Feature Plan: Prompt Engineering & Automation Pipeline

Este documento detalha a arquitetura e implementação de um novo sistema nativo no DashMaster.PRO para criar, gerenciar e executar prompts de IA, tanto individualmente quanto em lote, com suporte a streaming de respostas e integração com fontes de dados dinâmicas.

## 1. Visão Geral

O objetivo é transformar o DashMaster.PRO em uma ferramenta poderosa para automação de conteúdo e tarefas via IA. O sistema permitirá que administradores criem "Pipelines de Prompts", que consistem em:

1.  **Templates de Prompt**: Modelos de texto reutilizáveis com variáveis.
2.  **Fontes de Dados (Data Sources)**: Coleções de dados que preenchem as variáveis do prompt.
3.  **Jobs de Execução**: Processos que combinam templates e dados para gerar resultados de forma assíncrona.
4.  **Logs e Resultados**: Monitoramento em tempo real e armazenamento dos resultados.

Isso será implementado como um conjunto de novos **Addons** e **ContentTypes**, integrando-se perfeitamente à arquitetura existente.

## 2. Novos Conceitos e Componentes

### ContentTypes Nativos

1.  **Prompt Template (`prompt-template`)**:

    - **Estratégia**: `collection`
    - **Finalidade**: Armazenar e gerenciar os modelos de prompt. Cada item é um prompt reutilizável.
    - **Addons**:
      - `title` (`textInput`): Nome do template (ex: "Gerador de Descrição de Produto").
      - `template` (`promptTemplate`): O corpo do prompt com variáveis no formato `{{nome_da_variavel}}`.
      - `model` (`selectInput`): Seleção do modelo de IA a ser usado (ex: GPT-4, Claude 3). (Configurável).

2.  **Prompt Job (`prompt-job`)**:
    - **Estratégia**: `collection`
    - **Finalidade**: Configurar e executar uma tarefa de processamento de prompts. Cada item é um "job".
    - **Addons**:
      - `jobTitle` (`textInput`): Nome do job (ex: "Gerar descrições para coleção de verão").
      - `promptTemplate` (`relation`): Um campo de relacionamento para selecionar um item do ContentType `prompt-template`.
      - `dataSource` (`dataSourceSelector`): Um novo addon para selecionar a fonte de dados.
      - `jobRunner` (`promptRunner`): O componente de UI para iniciar, pausar e cancelar o job.
      - `jobStatus` (`statusDisplay`): Um campo read-only que exibe o status (`PENDING`, `RUNNING`, `COMPLETED`, `FAILED`, `CANCELLED`).
      - `jobLogs` (`logDisplay`): Uma área para exibir logs de execução em tempo real.
      - `jobResults` (`resultsDisplay`): Um componente para visualizar os resultados gerados.

### Novos Addons

Para suportar os ContentTypes acima, criaremos os seguintes addons:

1.  **`promptTemplate`**:

    - **Tipo**: Campo de texto (`textarea`).
    - **Funcionalidade**: Um editor de texto com syntax highlighting para variáveis `{{...}}`. Poderia incluir um validador que verifica se as variáveis no template correspondem às chaves da fonte de dados selecionada.

2.  **`relation`**:

    - **Tipo**: Campo de seleção.
    - **Funcionalidade**: Permite selecionar um item de outro `ContentType` dentro do mesmo workspace.
    - **Config**: `{"targetContentType": "prompt-template"}`.

3.  **`dataSourceSelector`**:

    - **Tipo**: Componente customizado.
    - **Funcionalidade**: UI para selecionar a fonte de dados. Opções iniciais:
      - **Collection**: Selecionar um `ContentType` existente (ex: "Produtos") para usar seus itens como dados. Um mapeador de campos permitirá associar os `addons` do `ContentType` de origem às variáveis do prompt (ex: `{{nome_produto}}` -> `title`).
      - **CSV Upload**: Upload de um arquivo CSV. O cabeçalho do CSV será usado para mapear as variáveis.
      - **Entrada Manual**: Uma tabela simples para inserir dados manualmente.

4.  **`promptRunner`**:

    - **Tipo**: Componente de UI interativo.
    - **Funcionalidade**: Botões de "Run", "Pause", "Cancel" que se comunicam com a API de jobs.

5.  **`statusDisplay`**, **`logDisplay`**, **`resultsDisplay`**:
    - **Tipo**: Componentes de UI read-only.
    - **Funcionalidade**: Exibem dados recebidos em tempo real via WebSockets. O `resultsDisplay` terá opções para visualizar como tabela e exportar para CSV/JSON.

### Reuso do Dashboard (estado atual)

Para acelerar a entrega e manter consistência visual/comportamental, vamos reaproveitar componentes e libs existentes no `dashboard`:

1. `dashboard/components/landing/DynamicHeroSection.jsx` (base para UI dinâmica com tags e themes)
2. `dashboard/components/landing/HeroSection.jsx` (referência de estrutura e props herdadas)
3. `dashboard/lib/base-themes.js` (temas/pré-definições que viram configurações de UI)
4. Sistema de "tags" do Dynamic Hero (as tags são os inputs/elements dos forms)
5. Infra de WS/SSE já presente na branch `feat/websocket-sse-manager-endpoint` (canal de tempo real)

Com isso, os novos addons e telas herdarão o mesmo vocabulário: as "tags" representam inputs/elementos e os "themes" são pré-definições de layout/estilo e também de formas (estruturas de formulários).

#### IAForms (cópia do DynamicHero)

- **Base**: Copiar `dashboard/components/landing/DynamicHeroSection.jsx` como `IAForms` e adaptar a metáfora de tags→inputs.
- **Tags**: Continuam sendo os elementos de formulário (text, select, textarea, file, etc.).
- **Themes**: Funcionam como pré-definições de forma (layout/estilo + mapeamentos sugeridos para variáveis).
- **Mapeamento**: `IAForms` expõe um mapeador entre tags/fields e variáveis do `promptTemplate` com validação de variáveis `{{...}}`.
- **Runner**: Inclui botões Run/Pause/Cancel integrados aos endpoints de job e listeners WS/SSE.

## 3. Arquitetura e Fluxo de Dados

A execução dos jobs será assíncrona para não travar a UI e não estourar timeouts de requisições HTTP.

### Diretrizes de Rendering (Server-First)

- Usar Server Components e Server Actions sempre que possível para `IAForms` e telas de Job.
- Envolver componentes não cacheados com `React.Suspense` (fallbacks leves) para melhorar a experiência durante streams.
- SSE/WS alimenta componentes client-side (listeners) que atualizam `statusDisplay`, `logDisplay`, `resultsDisplay` em tempo real.

### Backend

1.  **API Endpoints**:

    - `POST /api/prompt-jobs/{jobId}/run`: Inicia um job. Enfileira via `deckEngine` e retorna imediatamente um status `QUEUED`.
    - `POST /api/prompt-jobs/{jobId}/cancel`: Tenta cancelar um job em andamento (solicitação ao runner do `deckEngine`).

2.  **Orquestração com deckEngine**:

    - Usaremos o `deckEngine/` já existente para orquestração e execução dos jobs em background (producers, runners, lifecycle hooks e controle de estados).
    - O `deckEngine` gerencia `QUEUED` → `RUNNING` → `COMPLETED`/`FAILED`/`CANCELLED`, emitindo eventos para o canal de tempo real.
    - Opcionalmente, adaptadores para filas externas (ex.: BullMQ/Redis) podem ser adicionados futuramente por trás de uma interface do `deckEngine`.

3.  **Canal de Tempo Real (WS/SSE)**:

    - Reutilizaremos o gerenciador WS/SSE existente na branch `feat/websocket-sse-manager-endpoint`.
    - O `deckEngine` emitirá `status`, `log`, `result-chunk` e `result-completed` no canal `job:{jobId}`.
    - O frontend assina `job:{jobId}` via WS ou SSE, conforme disponibilidade do ambiente.

4.  **Contratos de Eventos (compatível com SSE/WS)**:

    - `job:status` → `{ jobId, status: "QUEUED"|"RUNNING"|"PAUSED"|"COMPLETED"|"FAILED"|"CANCELLED", progress?: { current, total } }`
    - `job:log` → `{ jobId, level: "info"|"warn"|"error", message, ts }`
    - `job:result-chunk` → `{ jobId, itemId, chunk, ix }`
    - `job:result-completed` → `{ jobId, itemId, result, metrics?: { model, tokens, ms } }`
    - `job:error` → `{ jobId, itemId?, error }`

    Observação: No SSE, cada evento é emitido via `event: <nome>`, `data: <json>`. No WS, o payload mantém a mesma estrutura.

5.  **Database (MongoDB)**:
    - O `ContentType` `prompt-job` armazenará a configuração do job.
    - Criaremos uma nova coleção, `prompt_results`, para armazenar os resultados de cada item processado. Cada documento conteria `jobId`, `sourceItemId`, `status`, `result`, `error`. Isso evita que os documentos do `prompt-job` fiquem muito grandes.

### Fluxo de Execução

1.  O usuário configura o `Prompt Job` usando o `IAForms` (tags como inputs/elements, `themes` como pré-definições de forma) e escolhe o `promptTemplate`.
2.  Ao clicar em "Run" no `promptRunner`, o frontend chama `POST /api/prompt-jobs/{jobId}/run`.
3.  A API valida o job e o envia ao `deckEngine` (estado `QUEUED`).
4.  O frontend assina `job:{jobId}` via WS/SSE e exibe status/logs/resultados em tempo real.
5.  O `deckEngine` inicia o processamento (`RUNNING`), emite evento de status e instancia o runner.
6.  O runner lê a fonte de dados (collection, CSV ou manual) e monta o contexto de variáveis.
7.  Para cada item:
    a. Substitui variáveis do `promptTemplate` conforme mapeamento definido no `IAForms`.
    b. Envia o prompt ao provedor de IA (com streaming quando disponível).
    c. Emite `result-chunk` no canal `job:{jobId}` durante o stream.
    d. Persiste o resultado completo em `prompt_results` e emite `result-completed`.
8.  O frontend atualiza `statusDisplay`, `logDisplay` e `resultsDisplay` conforme eventos.
9.  Ao concluir, o `deckEngine` marca `COMPLETED` (ou `FAILED`/`CANCELLED`) e emite o evento final.

### Distribuição de Geração (Home vs Admin) e Ordenação

- Home (Landing): processa metade dos prompts usando o modelo "o4-mini" via execução em batch (OpenAI Batch/Promise.all controlado). Recebe stream item a item e atualiza tiles incrementalmente via SSE.
- Admin: processa a outra metade, possivelmente com modelo superior (ex.: gpt-4-turbo-preview), mantendo o mesmo canal de eventos.
- Ordenação: a ordem de renderização e persistência segue a ordem do template de prompt (primeiro no template → primeiro na fila do batch). O payload inclui `orderIndex` para cada item, e os grids usam este índice para posicionamento determinístico.

### Ciclo de Vida dos Tiles (State Machine)

- Estados por item: `PENDING` → `QUEUED` → `RUNNING` → `COMPLETED` | `FAILED` | `CANCELLED`
- Ações: `pause` (transita `RUNNING`→`PAUSED`), `resume` (`PAUSED`→`RUNNING`), `cancel` (encerra corrente e marca `CANCELLED`).
- Emissão de eventos: a cada transição, o `deckEngine` publica `job:status` com `progress` agregado e, por item, `job:result-*`.

## 4. Implementação (Passo a Passo)

1.  **Schema**: Atualizar os schemas no MongoDB para incluir os novos `ContentTypes` e `Addons`.
2.  **Backend**:
    - Integrar o `deckEngine` como orquestrador (producers/runners, controle de estados e emissão de eventos).
    - Implementar/ajustar os endpoints (`/run`, `/cancel`) para conversar com o `deckEngine`.
    - Conectar os eventos do `deckEngine` ao canal WS/SSE existente (`job:{jobId}`).
3.  **Frontend**:
    - Criar o componente `IAForms` como cópia evoluída de `DynamicHeroSection.jsx`, usando "tags" como inputs/elements e `themes` como pré-definições de forma (layout + mapeamentos padrão).
    - Criar os novos componentes React para addons em `dashboard/components/ui/` e integrá-los no `FieldRenderer.jsx`.
    - Implementar cliente WS/SSE para assinar `job:{jobId}` e alimentar `statusDisplay`, `logDisplay`, `resultsDisplay` em tempo real.
    - No `dataSourceSelector`, criar UI de mapeamento entre chaves dos dados e variáveis do `promptTemplate` (com validação de variáveis `{{...}}`).
    - Envolver componentes não cacheados em `React.Suspense` com fallbacks simples (skeletons). Priorizar Server Components/Actions.
4.  **Integração com IA**: Criar um serviço/lib para se comunicar com as APIs de IA, com suporte a streaming. As chaves de API seriam armazenadas de forma segura (ex: secrets do workspace).

5.  **Single vs Batch**:

    - Single Prompt: `POST /api/prompt/run` com `{ templateId, variables }` → cria um `prompt-job` efêmero com `total=1`, processa via `deckEngine` e transmite via `job:{jobId}`.
    - Batch Prompt: `POST /api/prompt-jobs/{jobId}/run` com `dataSource` mapeado no `IAForms`.
    - Cancel/Pause/Resume: `POST /api/prompt-jobs/{jobId}/cancel|pause|resume`.

6.  **Redistribuição Home/Admin**:

    - Home: dispara criação de job parcial com metade dos prompts (modelo "o4-mini", batch controlado e rate-limited). Endpoint: `POST /api/guest/generate-home-batch`.
    - Admin: dispara o restante da coleção. Endpoint: `POST /api/guest/generate-admin-batch`.
    - Ambos preservam `orderIndex` herdado do template, retornado/emitido em cada resultado e usado pela UI para posicionamento.

7.  **Revisão e Expansão de APIs (CRUDs)**:

    - Templates: `GET/POST/PUT/DELETE /api/prompt-templates`
    - Jobs: `GET/POST /api/prompt-jobs`, `GET /api/prompt-jobs/{jobId}`, `POST /api/prompt-jobs/{jobId}/run|cancel|pause|resume`
    - Results: `GET /api/prompt-jobs/{jobId}/results` (paginações por cursor), `DELETE /api/prompt-jobs/{jobId}/results/{itemId}`
    - Logs: `GET /api/prompt-jobs/{jobId}/logs`
    - Export: `GET /api/prompt-jobs/{jobId}/export?format=csv|json&fields=...`
    - Tiles (Home/Admin): `GET/POST/PUT/DELETE /api/tiles` com campo `orderIndex`, `status` e `jobId` opcional

8.  **IAForms Server-Driven**:
    - `IAForms` renderizado como Server Component, submetendo via Server Actions para criar/atualizar `prompt-job` e `dataSource`.
    - A orquestração (deckEngine) permanece no backend; o front só emite intenção (run/pause/cancel) e ouve eventos.

## 5. Exportação e Logs

- O componente `resultsDisplay` terá um botão para "Exportar como CSV/JSON". Isso fará uma requisição a uma nova API (`GET /api/prompt-jobs/{jobId}/export?format=csv`) que buscará os resultados da coleção `prompt_results` e gerará o arquivo.
- Os logs serão persistidos no documento do `Prompt Job` (ou em uma coleção separada se forem muito volumosos) para auditoria futura.

### Export API (detalhes)

- `GET /api/prompt-jobs/{jobId}/export?format=csv|json`
  - Query extra: `fields=jobId,itemId,status,model,tokens` para filtrar colunas.
  - Stream de resposta habilitado (SSE opcional `event: export-progress`).
- `GET /api/prompt-jobs/{jobId}/results?cursor=...&limit=...` para paginação server-side.

### Schemas e Índices (MongoDB)

- `prompt_jobs`:
  - `{ _id, jobId, templateId, model, dataSource, status, createdAt, updatedAt, totals: { items, completed, failed }, options, ownerId }`
  - Índices: `{ jobId: 1 } (unique)`, `{ status: 1, createdAt: -1 }`, `{ ownerId: 1, createdAt: -1 }`
- `prompt_results`:
  - `{ _id, jobId, itemId, status, result, error, metrics: { model, tokens, ms }, createdAt }`
  - Índices: `{ jobId: 1, itemId: 1 } (unique)`, `{ jobId: 1, createdAt: -1 }`
- `prompt_logs` (opcional): `{ jobId, level, message, ts }` com índice `{ jobId: 1, ts: -1 }`

### Integração Next.js e SSE

- Runtime: priorizar `edge` onde houver SSE (`app/api/.../route.js`).
- Manager SSE: `dashboard/lib/sse-manager.js` (singleton) com keep-alive e cleanup, conforme plano de `sse.md`.
- Hook: `dashboard/hooks/useSSE.js` para consumo no cliente; `IAForms`, `AdminDashboard` e `Landing` passam a ouvir `job:{jobId}`.
- Middleware: garantir rota pública para stream (`/api/guest/tiles/stream` e futuros streams de jobs).

### Ajustes Planejados de UI (Admin e Notes)

- Admin Header (BG Settings): ao clicar no botão do header, abrir um diálogo inline com:
  - ColorPicker para background
  - Checkbox para Dark Mode
  - Persistência (Server Action) imediata após confirmar.
- Notes: remover outline/border ao focar/selecionar (usar `outline: none; box-shadow: none;` no estilo do componente). Apenas planejamento; implementação será feita nos componentes `ui/` relacionados.

### Segurança e Limites

- Rate limiting de conexões SSE (ex.: 10/IP) e timeout (2 minutos) conforme `sse.md`.
- Autorização por `jobId` e `ownerId` em endpoints `/api/prompt-jobs/*`.
- Sanitização/validação de variáveis de template e limites de tokens por plano.

### Papéis de Acesso e Billing

- Papéis iniciais:

  - Visitor: acesso público; sem edição; pode iniciar IAForms em modo guest (Home) para preview.
  - Guest User: identidade efêmera/limitada; canal WS/SSE isolado; sem edição do dashboard.
  - User Pago (logado): desbloqueia recursos mediante pagamento; usa o Dashboard (versão paga do Admin). Sem editar elementos restritos se o plano não permitir.
  - Admin/Owner/SuperAdmin: conforme o sistema atual.

- Regras de UI:

  - Dashboard é a versão paga do Admin: sem plano → esconder ações de edição do dashboard.
  - IAForms guest envia dados externos com segurança e isolamento; UI idêntica ao Admin, mudando apenas permissões e escopo.

- Billing via Stripe (será implementado aos poucos, não temos os produtos configurados, por isso precisamos resolver internamente simulando o cenário):
  - Fase 1 (manual): checkout resolvido externamente; endpoint interno marca plano/limites; `Access Engine` libera features.
  - Fase 2 (Stripe Checkout + Webhook): confirmação automática atualiza plano/limites e remove modo manual.

## 6. Monetização

Este recurso é um candidato perfeito para um **addon premium**.

- **Plano Básico**: Acesso a 1 ou 2 tipos de `dataSource`, execução de jobs com até 10 itens.
- **Plano Profissional**: Acesso a todas as `dataSources`, jobs com milhares de itens, maior prioridade na fila de processamento.
- **Pay-as-you-go**: Cobrança por número de prompts executados.

A lógica de acesso será controlada pelo `Access Engine` existente, verificando o plano do usuário antes de permitir a criação de `Prompt Jobs` ou a execução deles.

---

## Anexo A — Contratos de Eventos e Interfaces Minimais

### A.1 Contratos de Eventos (SSE/WS)

```ts
// Canal: job:{jobId}
type JobStatus =
  | "QUEUED"
  | "RUNNING"
  | "PAUSED"
  | "COMPLETED"
  | "FAILED"
  | "CANCELLED";

type JobStatusEvent = {
  jobId: string;
  status: JobStatus;
  progress?: { current: number; total: number };
};

type JobLogEvent = {
  jobId: string;
  level: "info" | "warn" | "error";
  message: string;
  ts: string; // ISO
};

type JobResultChunkEvent = {
  jobId: string;
  itemId: string;
  orderIndex: number; // garante ordenação determinística no grid
  chunk: string;
  ix: number; // índice do chunk
};

type JobResultCompletedEvent = {
  jobId: string;
  itemId: string;
  orderIndex: number;
  result: string; // texto completo
  metrics?: { model: string; tokens?: any; ms?: number };
};

type JobErrorEvent = {
  jobId: string;
  itemId?: string;
  error: { code?: string; message: string };
};
```

Observação: em SSE, usar `event: job:status` etc. Em WS, o payload é idêntico.

### A.2 Interface IAForms (Server-Driven)

```ts
// IAFormsContainer (Server Component)
type IAFormsContainerProps = {
  mode: "landing" | "admin";
  heroType: 1 | 2 | 3; // 1=Classic (tema fixo), 2=Dynamic (tema selecionável), 3=futuro
  // heroType 1 (Classic): tema fixo vindo da config do app/workspace; sem seletor de tema
  // heroType 2 (Dynamic): o usuário escolhe o tema antes do formulário; aplicação dinâmica
  themeId?: string; // usado quando heroType=1 (fixo) ou quando já houver um tema pré-selecionado
  initialTemplateId?: string;
};

// Render prop para Presenter
type IAFormsPresenterProps = {
  tags: Array<{
    id: string;
    label: string;
    type: "text" | "textarea" | "select" | "file" | "number";
    value?: any;
    options?: Array<{ value: string; label: string }>;
    orderIndex: number;
  }>;
  theme: any; // snapshot do theme aplicado
  onChangeTag: (id: string, value: any) => void;
  onRun: () => Promise<void>; // dispara Server Action que chama deckEngine
  onPause: () => Promise<void>;
  onResume: () => Promise<void>;
  onCancel: () => Promise<void>;
  jobId?: string; // definido após Run
};

// Server Actions esperadas (pseudoassinaturas)
declare function createOrUpdateJobAction(payload: {
  templateId: string;
  model: string;
  dataSource?: any;
  half?: "home" | "admin"; // redistribuição
}): Promise<{ jobId: string }>;

declare function controlJobAction(
  jobId: string,
  action: "pause" | "resume" | "cancel"
): Promise<void>;
```

### A.3 Especificação de Ordenação

- O `orderIndex` vem do template (posição do prompt na coleção) e é carregado para cada item do batch.
- A UI (Home/Admin) ordena pela chave `orderIndex` em grids/listas e mantém estabilidade quando chunks chegam fora de ordem.

---

## Anexo B — IAForms com Hero Types (1/2/3)

### B.1 Objetivo

Unificar `HeroSection.jsx` (clássico) e `DynamicHeroSection.jsx` (dinâmico) sob um único componente server-driven (`IAForms`) com troca simples via prop `heroType`.

### B.2 Estrutura (Container/Presenter)

- `IAFormsContainer` (Server Component):

  - Carrega `theme`, `tags` e `template` do backend.
  - heroType 1 (Classic): aplica tema fixo (sem seletor); origem: config do app/workspace.
  - heroType 2 (Dynamic): exibe etapa de seleção de tema antes do formulário, isso já existe no DynamicHero, e aplica dinamicamente.
  - Faz o split Home/Admin (meia coleção) quando aplicável.
  - Expõe Server Actions (`onRun`, `onPause`, `onResume`, `onCancel`).
  - Seleciona o Presenter com base em `heroType`.

- Presenters (Client Components):
  - `IAFormsPresenterClassic` (Hero type 1): layout inspirado no `HeroSection` (form progressivo simples).
  - `IAFormsPresenterDynamic` (Hero type 2): layout inspirado no `DynamicHero` (UI dinâmica com tags).
  - `IAFormsPresenterAlt` (Hero type 3): reservado para variações futuras.

```ts
// API do componente unificado
<IAFormsContainer mode="landing" heroType={2} themeId="sales-assistant" />
```

### B.3 Diretrizes de Implementação

- Containerizado: lógica no container (data loading, actions, orchestration); presenters visuais e com lógica mínima de input.
- Troca fácil de tipo: `heroType` controla o Presenter; manter prop signature idêntica para todos os presenters.
- Suspense: envolver presenters e blocos não cacheados com `React.Suspense`.
- Compatibilidade: manter compatível com as props atuais do `HeroSection` e `DynamicHeroSection` para migração suave.
- Tema: respeitar regra de tema — Classic usa tema fixo (sem troca), Dynamic inclui seletor de tema como primeira etapa.

### B.4 Integração com Redistribuição Home/Admin

- `IAFormsContainer` decide, conforme `mode`, se dispara a metade de prompts (modelo "o4-mini" na Home) ou a segunda metade no Admin.
- Ambos preservam `orderIndex` e publicam no canal `job:{jobId}`; presenters consomem via `useSSE`.

### B.5 Ajustes de UX Específicos

- Admin Header: acionar diálogo simples com ColorPicker e Dark Mode (Server Action para persistir) sem sair da página.
- Notes: remover outline/border ao foco (padronizar tokens CSS e classes utilitárias).

---

Vou acrescentar detalhes no plano: especificações de API (payloads e respostas), modelos de dados, exemplos de eventos SSE, composição do IAForms e presenters, integração Home/Admin, e critérios de aceite. Vou atualizar o arquivo `\plano.plan.md` agora.

[4 tools called]

Segue a continuação do plano para você colar ao final de `plano.plan.md` (mantém total alinhamento com `prompt-single-batch.md`):

## Especificações de API (Detalhadas)

### 1) Single Prompt

- POST `/api/prompt/run`
  - Request:
    ```json
    {
      "templateId": "tpl_123",
      "variables": { "company": "Tesla", "website": "tesla.com" },
      "model": "o4-mini"
    }
    ```
  - Response (201): `{"jobId": "job_abc"}`
  - Eventos: canal `job:{jobId}` com `job:*`

### 2) Jobs (Batch)

- POST `/api/prompt-jobs`
  - Cria job do IAForms (template + dataSource mapping).
  - Request: `{"templateId":"tpl_123","model":"gpt-4-turbo-preview","dataSource":{}}`
  - Response (201): `{"jobId":"job_abc"}`
- GET `/api/prompt-jobs/{jobId}`
  - Response: `{"jobId","status","totals":{"items","completed","failed"},"createdAt","updatedAt"}`
- POST `/api/prompt-jobs/{jobId}/run`
  - Response: `{"ok":true,"status":"QUEUED"}`
- POST `/api/prompt-jobs/{jobId}/{action}` onde `{action}` ∈ `cancel|pause|resume`
  - Response: `{"ok":true,"status":"PAUSED"}` (exemplo)

### 3) Results

- GET `/api/prompt-jobs/{jobId}/results?cursor=...&limit=50`
  - Response: `{"items":[{"itemId","orderIndex","status","result","error","metrics"}],"nextCursor":"..." }`
- DELETE `/api/prompt-jobs/{jobId}/results/{itemId}`
  - Response: `{"ok":true}`

### 4) Logs

- GET `/api/prompt-jobs/{jobId}/logs?level=info|warn|error&cursor=...`
  - Response: `{"items":[{"level","message","ts"}],"nextCursor":"..."}`

### 5) Export

- GET `/api/prompt-jobs/{jobId}/export?format=csv|json&fields=jobId,itemId,status,model,tokens`
  - Response: arquivo CSV/JSON (stream). Opcional SSE `export-progress`.

### 6) Tiles

- POST `/api/tiles` → `{"title","content","orderIndex","status","jobId?"}`
- PUT `/api/tiles/{id}`
- DELETE `/api/tiles/{id}`
- GET `/api/tiles?jobId=...`

## Modelos de Dados (MongoDB)

```json
// prompt_jobs
{
  "jobId": "job_abc",
  "templateId": "tpl_123",
  "model": "o4-mini",
  "dataSource": { "type": "collection|csv|manual", "mapping": {"company": "title"} },
  "status": "QUEUED",
  "totals": { "items": 10, "completed": 0, "failed": 0 },
  "ownerId": "user_x",
  "createdAt": "2025-10-30T10:00:00Z",
  "updatedAt": "2025-10-30T10:00:00Z"
}

// prompt_results
{
  "jobId": "job_abc",
  "itemId": "it_1",
  "orderIndex": 0,
  "status": "COMPLETED",
  "result": "...",
  "error": null,
  "metrics": { "model": "o4-mini", "tokens": {"prompt": 120, "completion": 300}, "ms": 2400 },
  "createdAt": "2025-10-30T10:01:01Z"
}

// prompt_logs
{
  "jobId": "job_abc",
  "level": "info",
  "message": "Runner started",
  "ts": "2025-10-30T10:00:01Z"
}
```

Índices:

- prompt_jobs: `{ jobId:1 } unique`, `{ status:1, createdAt:-1 }`, `{ ownerId:1, createdAt:-1 }`
- prompt_results: `{ jobId:1, itemId:1 } unique`, `{ jobId:1, createdAt:-1 }`
- prompt_logs: `{ jobId:1, ts:-1 }`

## Exemplos de Eventos SSE/WS

- job:status
  ```text
  event: job:status
  data: {"jobId":"job_abc","status":"RUNNING","progress":{"current":1,"total":10}}
  ```
- job:result-chunk
  ```text
  event: job:result-chunk
  data: {"jobId":"job_abc","itemId":"it_1","orderIndex":0,"chunk":"partial ...","ix":0}
  ```
- job:result-completed
  ```text
  event: job:result-completed
  data: {"jobId":"job_abc","itemId":"it_1","orderIndex":0,"result":"final ...","metrics":{"model":"o4-mini","ms":2400}}
  ```
- job:error
  ```text
  event: job:error
  data: {"jobId":"job_abc","itemId":"it_2","error":{"message":"rate limit"}}
  ```

## IAForms — Composição e Troca de Hero Type

- Container (Server): carrega theme/tags/template, decide split Home/Admin, expõe Server Actions.
- Presenters (Client):
  - IAFormsPresenterClassic (type 1, tema fixo).
  - IAFormsPresenterDynamic (type 2, seletor de tema inicial).
  - IAFormsPresenterAlt (type 3).
- Prop principal: `<IAFormsContainer mode="landing|admin" heroType={1|2|3} themeId? />`
- Suspense: envolver presenters e blocos não cacheados.

## Integração Home/Admin e Ordenação

- Home: metade dos prompts (modelo “o4-mini”), batch com rate limit; `orderIndex` por item; grid atualiza por `orderIndex`.
- Admin: segunda metade com modelo superior; mesmo canal de eventos; pause/resume/cancel.
- Grids: ordenação estável por `orderIndex` e reconciliação de chunks fora de ordem.

## Segurança e Checklist (Execução)

- Autenticação: `getCurrentAuth()` em todas as rotas novas.
- Autorização: validar `ownerId`/workspace em jobs/results/logs/tiles.
- SSE: limite 10 conexões/IP e timeout 120s; keep-alive a cada 30s.
- Variáveis: validar/sanear placeholders `{{...}}`.
- CSP: avaliar política mínima para bloquear inline scripts.

## Testes (Plano)

- Unit: mapeamento de variáveis, cálculo de `orderIndex`, assembly de chunks, rate limit de batch.
- Integração: `prompt/run`, `prompt-jobs/*`, `results`, `export`, `tiles`.
- E2E: Home (stream metade) e Admin (restante) com ordenação correta e controles.
- Observabilidade: métricas por item/job, tokens (quando disponível) e erros por modelo.

## Riscos e Mitigações

- SSE em Netlify: keep-alive/edge runtime; fallback WS se necessário.
- Rate limits OpenAI: backoff + batch size dinâmico.
- Ordem inconsistente: `orderIndex` como fonte única da verdade.

---

Entendi. Vou ajustar o plano para refletir exatamente o que você descreveu: a Home dispara imediatamente a geração de “metade” dos tiles (para acelerar a experiência), com fila assíncrona inteligente, placeholders de loading que vão diminuindo conforme chegam os resultados, ordenação determinística, isolamento total via guest + WS/SSE, e UI/visuais iguais entre Home e Admin (IAForms), apenas mudando o fluxo e o “modo”.

Segue o complemento de plano para colar no final do plano atual (mantém tudo existente e corrige a intenção do fluxo):

### Correção de Fluxo: Home acelera metade dos tiles

- Home (IAForms em modo guest) dispara um job parcial com metade dos prompts do template (modelo “o4-mini”), com fila assíncrona inteligente.
- Admin recebe o restante dos prompts do mesmo template/job (ou um job encadeado) assim que o usuário avança, mantendo a mesma ordenação.
- Ambos os lados usam o mesmo canal de eventos e o mesmo sistema de ordenação por `orderIndex`.

### Placeholders de Loading e Decremento

- Antes de começar, o frontend conhece `totals.items` e quantos pertencem à “metade” da Home (ex.: `totals.homePart`).
- Renderizar `homePart` placeholders (ex.: “Generating Insights...”), todos com `status: loading`.
- A cada `job:result-completed`, substituir um placeholder pelo tile final e decrementar o contador de placeholders.
- No Admin, repetir a mesma lógica para a metade restante.

Eventos passam a carregar contadores:

- `job:status`: `{ jobId, status, progress: { current, total, remaining }, scope: "home" | "admin" }`
- `job:result-completed`: `{ jobId, itemId, orderIndex, result, scope: "home" | "admin" }`

### Ordenação determinística

- Usar `orderIndex` do template como fonte única da verdade.
- Placeholders já entram posicionados por `orderIndex`.
- Ao chegar um tile final, o placeholder correspondente (mesmo `orderIndex`) é substituído no mesmo slot, evitando “pulos” de layout.

### IAForms Guest com Isolamento e WS/SSE

- Guest workflow: IAForms em modo “guest” cria job isolado por `guestId` e `jobId`.
- Canal de stream por combinação: `guest:{guestId}:job:{jobId}` (ou um token isolado por job).
- SSE/WS com autorização mínima: valida `guestId`/`jobId` e escopo do stream; nenhum dado sensível no payload.
- Admin e Home consomem o mesmo contrato, apenas com `scope` diferente (“home” para metade inicial; “admin” para a segunda metade).

### Unificação visual (Heroes e Dashboard)

- IAForms apresenta UI idêntica entre Home e Admin (presenters classic/dynamic), mudando apenas:
  - Hero type (1 fixo no clássico; 2 com seletor no dinâmico).
  - Modo (landing/admin) que determina: qual “metade” de prompts iniciar, limites e ações disponíveis.
- Resultado visual final deve ser “o dashboard em preview” no guest (Home) e “o dashboard completo” no Admin, com a mesma grid, placeholders, cards e ordering.

### API e Eventos (ajustes pontuais)

- Single:
  - `POST /api/prompt/run` → efêmero (1 tile) com `{orderIndex, scope:"home"}` quando usado no fluxo simplificado.
- Batch:
  - `POST /api/prompt-jobs` → cria job com `totals.items` e `split: { homePart, adminPart }`.
  - `POST /api/prompt-jobs/{jobId}/run` → aceita `scope: "home" | "admin"` para disparar apenas a fração designada.
- Results/Logs/Export permanecem iguais, com `scope` opcional no filtro.
- Eventos:
  - `job:status`: `progress` agora inclui `remaining` e `scope`.
  - `job:result-chunk`/`job:result-completed`: incluem `orderIndex` e `scope`.

Exemplo de eventos:

```text
event: job:status
data: {"jobId":"job_1","status":"RUNNING","progress":{"current":2,"total":10,"remaining":8},"scope":"home"}

event: job:result-completed
data: {"jobId":"job_1","itemId":"it_3","orderIndex":2,"result":"...","scope":"home"}
```

### Critérios de aceite (ajustados)

- Home (guest) mostra placeholders de `homePart` e substitui por tiles finais conforme o stream chega; contadores de loading diminuem corretamente.
- Admin, ao abrir, exibe placeholders da “segunda metade” e vai substituindo conforme resultados chegam; pause/resume/cancel funcionam.
- Ordenação estável por `orderIndex` em Home e Admin, sem saltos.
- Canal de stream isolado por `guestId`/`jobId` funciona igual em Home e Admin.
- Visual/UX idênticos entre Home (guest) e Admin, diferenciando só o escopo e permissões.
