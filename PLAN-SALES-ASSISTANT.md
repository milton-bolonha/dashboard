## Plano de Transformação — DashMaster.PRO como Plugin “AI Sales Assistant”

Última atualização: 2025-10-17

---

### Objetivo

Instalar no DashMaster.PRO um núcleo (plugin) de pesquisa de empresas e geração de outreach com IA, multi-tenant, com templates de prompts reutilizáveis, execução em lote, tiles interativas e integração de billing/credits. O resultado deve ser instalável/reinstalável como um “plugin” (scripts) sem quebrar o CMS existente.

---

### 1) Estado atual (o que já temos)

- Autenticação (Clerk) e middleware protegido
  - Pronto: `dashboard/lib/auth.js` com fallback JWT; `middleware.js` com rotas públicas e `auth.protect()`.
- Multi-tenant e Workspaces
  - Pronto: endpoints `/api/workspaces`, isolamento por `x-workspace-id` em várias rotas; criação automática em alguns fluxos; `db` helper.
- Billing (Stripe)
  - Parcial: Netlify functions (`billing-create`, `stripe-webhook`), `lib/stripe-sync.js`, `lib/billingSync.js`, `config/stripe-map.js`, docs em `docs/stripe-customer-portal.md`.
- OpenAI/LLM
  - Parcial: função Netlify `ai-enhance.js`. Ainda não há rotas core (company research/bulk/contacts/outreach) com streaming.
- Cloudinary / Uploads
  - Pronto: `lib/cloudinary.js` e addons de upload nas forms/components.
- Rate limiting
  - Pronto: `lib/rate-limiter.js` (usar nos endpoints de IA/bulk).
- DeckEngine (fila/execução)
  - Pronto: `deckEngine/` com sistemas de fila (arenas), idempotência e execução de partidas.
- UI base (Dashboard + Sections/Content Types)
  - Pronto/Parcial: infraestrutura Next.js, componentes UI e containers; não há “tiles” específicos do Sales Assistant.

---

### 2) GAPs principais (o que falta)

- Tiles/Cards Sales Assistant (UI + modelos + histórico) – NOVO.
- Templates de Prompt por workspace (CRUD + variáveis) – NOVO.
- Fluxos Core: Company Research, Bulk Research, Contact Insights, Outreach Generator/Editor, Bookmarks – NOVO.
- Streaming de respostas LLM e cache de resultados – NOVO.
- Credits por workspace (consumo por chamada LLM) – PARCIAL/NOVO.
- Referral system – NOVO.
- Dashboard Templates (salvar conjuntos de prompts/reutilizar) – NOVO.
- Instalador/Reinstalador tipo “plugin” – NOVO.

---

### 3) Arquitetura do Plugin

- Estrutura proposta

  - Backend (APIs): `dashboard/app/api/sales-assistant/*`
    - `companies/*`, `bulk/*`, `contacts/*`, `outreach/*`, `bookmarks/*`, `templates/*`, `tiles/*`
  - Serviço LLM: `dashboard/lib/ai/` (provider, cache, streaming, token budgeting)
  - Jobs/Bulk: integração com `deckEngine/` (deck “sales-research-deck”)
  - UI: `dashboard/app/dashboard/sales/*` + componentes `dashboard/components/sales/*`
  - Instalador: `dashboard/scripts/install-sales-assistant.js` e `dashboard/scripts/uninstall-sales-assistant.js`

- Isolamento multi-tenant

  - Todas as rotas requerem `getCurrentAuth()` e `x-workspace-id` com validação de membro.
  - Toda gravação/leitura inclui `workspaceId` em filtros.

- Permissões
  - Roles existentes (owner/admin/member) + permissões finas no workspace: `canRunLLM`, `canManageTemplates`, `canInvite`, `canManageBilling`.

---

### 4) Modelagem de dados (MongoDB)

- companies: { \_id, workspaceId, name, domain, url, tags[], createdAt, updatedAt }
- dashboards: { \_id, workspaceId, companyId, name, layout, templateRef, createdAt, updatedAt }
- templates: { \_id, workspaceId, name, prompt, variables[], tags[], createdAt, updatedAt }
- tiles: { \_id, workspaceId, companyId, dashboardId, templateId, result, status, lastRun, history[], usage }
- contacts: { \_id, workspaceId, companyId, name, title, email, notes, createdAt }
- outreach: { \_id, workspaceId, companyId, contactId, type: "email|call|linkedin", draft, final, revisions[], createdAt }
- bookmarks: { \_id, workspaceId, entity: "outreach|tile", refId, title, snapshot, createdAt }
- files: { \_id, workspaceId, companyId?, dashboardId?, url, type, size, meta, createdAt }
- jobLogs: { \_id, workspaceId, type, status, payload, trace, createdAt }
- credits: { \_id, workspaceId, plan, quota, consumed, resetsAt, updatedAt }

Observações:

- Indexes por `(workspaceId, companyId)`, `(workspaceId, dashboardId)`, `(workspaceId, templateId)`.
- `tiles.history[]` guarda versões/execuções anteriores (para comparação e auditoria).

---

### 5) Endpoints (planejamento)

- Templates
  - GET/POST/PUT/DELETE `/api/sales-assistant/templates`
- Companies & Dashboards
  - POST `/api/sales-assistant/companies` (criar + opcional criar dashboard padrão)
  - GET `/api/sales-assistant/companies`
  - GET `/api/sales-assistant/dashboards?companyId=`
- Tiles (Company Research)
  - POST `/api/sales-assistant/tiles/run` { companyId, templateId } → inicia execução (stream opcional)
  - POST `/api/sales-assistant/tiles/bulk` { companyIds[], templateIds[] } → enfileira via DeckEngine
  - GET `/api/sales-assistant/tiles?dashboardId=`
- Contacts & Insights
  - POST `/api/sales-assistant/contacts` { companyId, name, title, email }
  - POST `/api/sales-assistant/contacts/insights` { contactId } → gera tile de insights
- Outreach
  - POST `/api/sales-assistant/outreach/generate` { companyId, contactId, type }
  - POST `/api/sales-assistant/outreach/edit` { outreachId, command }
  - POST `/api/sales-assistant/outreach/bookmark` { outreachId }
- Files/Notes
  - POST `/api/sales-assistant/files/upload` (Cloudinary)
  - POST `/api/sales-assistant/notes` { dashboardId, text }
- Billing/Credits
  - GET `/api/sales-assistant/credits` (saldo)
  - POST `/api/sales-assistant/credits/debit` (consumir por chamada LLM, com idempotency)

Todos com: rate limiting, `x-workspace-id`, logs e verificação de permissão.

---

### 6) Estratégia LLM (velocidade, custo, qualidade)

- Streaming: SSE/stream do provider para resposta imediata; UI mostra progresso por tile.
- Cache: chave `(workspaceId + companyId + templateId + hash(vars))` com TTL; invalidar on edit.
- Batching: para bulk, enfileirar jobs com limite de concorrência; usar DeckEngine.
- Token budgeting: estimar custo e negar se créditos insuficientes.
- Model routing: modelos baratos p/ tarefas preliminares; melhores p/ geração final.

---

### 7) Uso do DeckEngine (fila/bulk)

- Criar deck `sales-research-deck` com cards:
  - `prepare-context-card` (compila contexto empresa+notas+files)
  - `run-template-card` (chama LLM, grava tile, atualiza usage)
  - `update-credits-card` (debita créditos, idempotente)
- Arena com concorrência configurável por workspace.
- Eventos de progresso para UI (via polling curto ou canal SSE por jobId).

---

### 8) UI/UX (Next.js)

- Grid de tiles com open/rearrange/resize e histórico.
- Editor de Outreach side-by-side (contexto à esquerda, editor à direita) com comandos rápidos.
- Bulk view (linhas=empresas, colunas=perguntas/templates) com progresso por célula.
- Dashboard templates: salvar/aplicar conjuntos de prompts.
- Barra de créditos visível; avisos ao aproximar do limite.

---

### 9) Instalador/Reinstalador (tipo plugin)

- `dashboard/scripts/install-sales-assistant.js`
  - Verifica/Cria coleções e índices.
  - Seed de templates básicos (ex.: “Competidores”, “Resumo 75 palavras”).
  - Seed dashboard padrão por workspace (opcional).
  - Configura permissões default no workspace.
- `dashboard/scripts/uninstall-sales-assistant.js`
  - Remoção segura (opcionalmente apenas dados do plugin).
- `npm run plugin:install` / `npm run plugin:uninstall` (documentar no README).

---

### 10) Billing & Credits

- Reusar Stripe atual (Customer Portal + webhooks) e atrelar plano/limites ao `workspaceId`.
- Tabela `credits` por workspace; consumo por request LLM.
- Webhook Stripe atualiza saldo/planos; endpoints para exibir créditos restantes.

---

### 11) Segurança e Observabilidade

- RBAC estrito no backend (nunca confiar no client).
- Rate limiting por usuário/workspace e por rota LLM/bulk.
- Logs estruturados e `jobLogs` para auditoria; opcional Sentry/Logflare.

---

### 11.1) RBAC — Roles e Permissões (Sales Assistant)

- Roles padrão por workspace

  - owner: controle total do workspace; gerencia billing/planos; deploy da landing; convida/remover usuários; configura limites.
  - admin: gerencia templates, dashboards, contacts, execução LLM (single/bulk), bookmarks; pode convidar usuários (sem gerenciar billing/deploy).
  - member: usa o core (tiles, bulk se habilitado, contacts/outreach), cria/salva dashboards próprios (se permitido), sem acesso a billing/deploy.
  - billing_manager (opcional): acessa Stripe Portal do workspace; não altera conteúdo nem templates.
  - viewer (opcional): somente leitura de dashboards/tiles/outreach aprovados.

- Escopo de permissões

  - Core LLM: `canRunLLM`, `canRunBulk`, `canEditTemplates`, `canEditDashboards`.
  - Usuários: `canInvite`, `canManageMembers`.
  - Financeiro: `canManageBilling`, `canViewBilling`.
  - Deploy: `canManageDeploy` (templates/landing, chaves e publicações).
  - Admin geral: `canViewAdmin`, `canViewLogs`.

- Mapeamento sugerido

  - owner: todas as permissões.
  - admin: todas exceto `canManageBilling` e `canManageDeploy` (configurável por owner).
  - member: `canRunLLM`, `canRunBulk` (se habilitado), editar seus próprios dashboards; sem `canEditTemplates` por padrão.
  - billing_manager: `canManageBilling` e `canViewBilling` apenas.
  - viewer: nenhuma permissão de escrita; leitura do que o admin/owner marcar como visível.

- Onboarding por role

  - Assinante (pagou/plano ativo): vira `member` por padrão no workspace; onboarding guiado ao core (tiles, companies, contacts) sem acesso a billing/deploy/users.
  - Owner/Admin: onboarding estendido (templates, dashboard templates, configurações, billing/credits, convites).

- Enforço no backend
  - Todas as rotas validam `x-workspace-id`, membership e permissões específicas.
  - Clerk metadata: cache leve; verdade canônica no banco (`workspaces.members[ { userId, role, permissions } ]`).
  - UI só reflete o que o backend permite; sem lógica de permissão no cliente.

---

### 12) Roadmap proposto (4 semanas)

- Semana 1 (fundação)

  - Instalador do plugin, modelos de dados, CRUD de templates, UI inicial de tiles.
  - Auth/Workspaces já prontos; conectar `x-workspace-id` em novas rotas.
  - Deploy CI (Netlify/Vercel) com variáveis (OpenAI, Stripe, Mongo).
  - Entrega: V0.1 com criação de company, template e execução single (sem bulk), salvando tile.

- Semana 2 (core LLM + ingest)

  - Streaming + cache + rate limit + débito de créditos.
  - DeckEngine para fila/bulk com concorrência.
  - UI de progresso por tile; primeira versão do editor de outreach.
  - Entrega: pesquisar 1..N empresas com templates salvos e tiles preenchidas.

- Semana 3 (contacts, dashboards e billing)

  - Contacts + insights automáticos; geração de outreach (email/call/LinkedIn).
  - Dashboard templates (salvar conjuntos) e aplicação.
  - Integração Stripe consolidada em nível de workspace (saldo/planos na UI).
  - Entrega: workspace com billing e outreach funcional.

- Semana 4 (polimento e entrega)
  - Admin, logs, retries, testes de carga leve.
  - Documentação (README, runbooks, lista de contas/keys).
  - Entrega: release candidate instalável.

---

### 12.1) Resumo rápido de passos (execução)

- Passo 1: Criar instalador do plugin e coleções (indices + seeds básicos).
- Passo 2: Implementar CRUD de Templates e Companies/Dashboards (isolado por workspace).
- Passo 3: Implementar execução single de Tile (LLM provider com streaming + cache + débito de créditos).
- Passo 4: Integrar DeckEngine para Bulk (fila com concorrência + progresso por jobId).
- Passo 5: Implementar Contacts + Insights + Outreach (geração + editor side-by-side + bookmarks).
- Passo 6: Expor Dashboard Templates (salvar/aplicar conjuntos de prompts) e barras de créditos.
- Passo 7: Consolidar Billing (Stripe webhook → créditos/planos por workspace) e Admin/Logs.
- Passo 8: Polimento final, testes de carga leve, documentação e runbooks.

---

### 13) Checklist “assinale o que já tem pronto”

- Authentication (Clerk): ✅ Pronto
- Workspaces/Multi-tenant: ✅ Pronto
- Billing & Credits (Stripe): ⚠️ Parcial (precisa créditos por workspace)
- Referral System: ⛔ Não implementado
- Dashboard Templates: ⛔ Não implementado
- Notes & Files: ✅ Parcial (Cloudinary pronto; notas simples a criar)
- Profile & Settings: ✅ Básico (ajustes menores)
- Deployment & Access: ✅ Parcial (Netlify/Vercel; habilitar flags do plugin)
- Company Research (tiles): ⛔ Não implementado
- Bulk Research: ⛔ Não implementado (usar DeckEngine)
- Tile System (histórico/resize): ⛔ Não implementado
- Contact Insights: ⛔ Não implementado
- Outreach Generator/Editor/Bookmarks: ⛔ Não implementado
- Training Inputs: ⛔ Não implementado (futuro)

---

### 14) Próximos passos operacionais

1. Criar `scripts/install-sales-assistant.js` e `scripts/uninstall-sales-assistant.js`.
2. Criar base `lib/ai/provider.ts/js` com streaming + cache.
3. Implementar endpoints Templates/Companies/Dashboards/Tiles (single run).
4. Integrar DeckEngine (bulk) e UI de progresso.
5. Créditos por workspace (debit/verify) + barras de saldo na UI.
6. Contacts/Outreach/Bookmarks.
7. Dashboard Templates (save/apply) e polimento de UX.

---

### 15) Tabela de Tarefas (nome, descrição, categoria)

| Nome                       | Descrição                                                     | Categoria         |
| -------------------------- | ------------------------------------------------------------- | ----------------- |
| Instalador do Plugin       | Scripts para criar índices, coleções e seeds iniciais         | Installer         |
| CRUD Templates             | Endpoints + UI para criar/editar/excluir templates de prompts | LLM Engine        |
| CRUD Companies/Dashboards  | Endpoints + UI para companies e dashboards por workspace      | Multi-tenant      |
| Execução de Tile (Single)  | Rodar um template contra uma empresa com streaming e cache    | LLM Engine        |
| Créditos por Workspace     | Tabela/rotas para débito/consulta de créditos                 | Billing & Credits |
| Bulk via DeckEngine        | Fila/batch com concorrência e progresso por job               | Jobs/Queue        |
| UI de Tiles/Progresso      | Grid, abrir/resize, progresso e histórico                     | UI/UX             |
| Contacts & Insights        | Modelo/rotas de contatos + geração de insights                | Core App          |
| Outreach Generator         | Geração de email/call/LinkedIn com editor e bookmarks         | Core App          |
| Dashboard Templates        | Salvar/aplicar conjuntos de prompts                           | Core App          |
| Stripe Workspace Sync      | Webhook + mapeamento para créditos/planos                     | Billing & Credits |
| Admin & Logs               | Painel simples, jobLogs, retries, métricas                    | Monitoring        |
| Sentry/Logflare (opcional) | Observabilidade e alertas                                     | Monitoring        |
| Documentação/Runbooks      | READMEs, guias de operação e chaves                           | Operations        |
