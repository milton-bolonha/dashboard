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

## 6. Monetização

Este recurso é um candidato perfeito para um **addon premium**.

- **Plano Básico**: Acesso a 1 ou 2 tipos de `dataSource`, execução de jobs com até 10 itens.
- **Plano Profissional**: Acesso a todas as `dataSources`, jobs com milhares de itens, maior prioridade na fila de processamento.
- **Pay-as-you-go**: Cobrança por número de prompts executados.

A lógica de acesso será controlada pelo `Access Engine` existente, verificando o plano do usuário antes de permitir a criação de `Prompt Jobs` ou a execução deles.
