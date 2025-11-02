# Plano de Execução — IA Nativa (Single/Batch + SSE/WS)

## Escopo

Implementar IA nativa (single e batch) com respostas em stream, IAForms server-driven, redistribuição Home/Admin, ordering determinístico, orquestração via `deckEngine/`, SSE/WS, APIs/CRUDs, export, segurança e ajustes de UX.

## Arquitetura

- Orquestração: `deckEngine/` (jobs, runners, eventos).
- Tempo real: SSE/WS (canal `job:{jobId}`) com contratos padronizados.
- Frontend: IAForms (Server Components/Actions) + Presenters (Hero type 1/2/3) com Suspense e listeners SSE.
- Dados: MongoDB (`prompt_jobs`, `prompt_results`, `prompt_logs`) com índices.

## Mudanças Principais (Arquivos)

- Frontend (dashboard/):
- `components/landing/IAFormsContainer.jsx` (Server Component)
- `components/landing/iaforms/IAFormsPresenterClassic.jsx` (Hero type 1)
- `components/landing/iaforms/IAFormsPresenterDynamic.jsx` (Hero type 2)
- `hooks/useSSE.js` (reuso; garantir eventos `job:*`)
- `lib/sse-manager.js` (se ainda não existir)
- Ajustes mínimos em `app/page.js` e `app/admin/page.jsx` para assinar streams
- Ajuste CSS de Notes (remover outline/border)
- Header Admin: diálogo ColorPicker + Dark Mode
- Backend (dashboard/):
- `app/api/prompt/run/route.js` (single)
- `app/api/prompt-jobs/route.js` (create/list)
- `app/api/prompt-jobs/[jobId]/route.js` (get)
- `app/api/prompt-jobs/[jobId]/run|cancel|pause|resume/route.js`
- `app/api/prompt-jobs/[jobId]/results/route.js` (GET paginado, DELETE item)
- `app/api/prompt-jobs/[jobId]/export/route.js` (CSV/JSON; opcional SSE `export-progress`)
- `app/api/tiles/route.js` (CRUD; `orderIndex`, `status`, opcional `jobId`)
- `lib/ai/provider.js` (OpenAI, streaming, batch control/rate limit)
- `lib/jobs/deck-engine-adapter.js` (ponte com `deckEngine/` + emissores de evento)
- `lib/jobs/events.js` (emissão SSE/WS padronizada)
- `lib/db/prompt-jobs.js`, `lib/db/prompt-results.js`, `lib/db/prompt-logs.js`
- `lib/auth.js` (garantir `getCurrentAuth()` nas rotas novas)
- Orquestração (`/deckEngine`):
- Runners/handlers para prompts (single/batch), callbacks/emitters dos eventos `job:*`.

## Contratos de Eventos (SSE/WS)

- `job:status` { jobId, status, progress? }
- `job:log` { jobId, level, message, ts }
- `job:result-chunk` { jobId, itemId, orderIndex, chunk, ix }
- `job:result-completed` { jobId, itemId, orderIndex, result, metrics? }
- `job:error` { jobId, itemId?, error }

## Fluxos

- Home: metade dos prompts (modelo "o4-mini") via batch; stream item a item; ordenar por `orderIndex` (do template).
- Admin: segunda metade com modelo superior; mesmo canal de eventos.
- IAForms:
- heroType 1 (Classic): tema fixo (config); sem seletor.
- heroType 2 (Dynamic): seleção de tema antes do formulário; aplicação dinâmica.

## Banco de Dados

- `prompt_jobs`: { jobId, templateId, model, dataSource, status, totals, ownerId, createdAt, updatedAt }.
- Índices: { jobId:1 unique }, { status:1, createdAt:-1 }, { ownerId:1, createdAt:-1 }.
- `prompt_results`: { jobId, itemId, status, result, error, metrics, orderIndex, createdAt }.
- Índices: { jobId:1, itemId:1 unique }, { jobId:1, createdAt:-1 }.
- `prompt_logs`: { jobId, level, message, ts }.
- Índices: { jobId:1, ts:-1 }.

## Segurança e Boas Práticas

- Autenticação centralizada: `getCurrentAuth()` em todas as rotas.
- Autorização por `ownerId`/workspace.
- Rate limiting e timeout SSE.
- Server Actions seguras (validação, tainting).
- A11y/SEO: Image, Font Module, global-error/not-found.
- Type safety: JSDoc/TS gradual onde aplicável (tipos de eventos e payloads).

## Testes e Observabilidade

- Unit: libs de AI, mapeamento de variáveis, ordenação `orderIndex`.
- Integração: rotas de API (single/batch, results, export, tiles).
- E2E: Home/Admin recebendo streams e ordenando corretamente.
- Logs de auditoria: `prompt_logs` + métricas básicas (tokens/ms/modelo).

## Migração e Rollout

- Habilitar novas rotas em paralelo às antigas (flag interna).
- Migrar Home primeiro (o4-mini), depois Admin.
- Monitorar SSE no Netlify (keep-alive, timeouts) e ajustar conforme doc.

## Entregáveis Visíveis

- Home renderiza metade dos tiles por stream, ordenados.
- Admin renderiza a outra metade com controle de estado (pause/resume/cancel).
- IAForms único com `heroType` 1/2/3.
- Export CSV/JSON por job com filtros/fields.
- Admin header com ColorPicker + Dark Mode; Notes sem outline.

---

## Refinos de Execução (Adendos)

- IAFormsContainer: suportar `initialItems` (opcional) no `run` para enviar a lista de itens já com `orderIndex`. Benefícios: progresso e placeholders são inicializados sem esperar o primeiro `job:status` intermediário.
- Canal de Stream (SSE/WS): opcionalmente adotar token curto no canal `guest:{guestId}:job:{jobId}:{token}` com validação no endpoint de stream para reforçar isolamento (sem quebrar compatibilidade caso omitido).
- Logs: expor `GET /api/prompt-jobs/[jobId]/logs?level=&cursor=&limit=` para observabilidade do runner.

## Correção de Fluxo (Home acelera metade dos tiles)

- Home (guest, IAForms) dispara um job parcial com metade dos prompts (modelo "o4-mini"), via fila assíncrona.
- Admin executa a segunda metade do mesmo template/job (ou job encadeado), preservando a mesma ordenação.
- Placeholders: renderizar homePart placeholders (Generating Insights...). Cada job:result-completed substitui o placeholder correspondente e decremente o contador.
- Ordenação determinística por orderIndex (do template): placeholders e resultados usam o mesmo índice, evitando saltos de layout.
- Eventos incluem scope: "home" | "admin" e progresso { current, total, remaining }.

Exemplos de eventos:
event: job:status
data: {"jobId":"job_1","status":"RUNNING","progress":{"current":2,"total":10,"remaining":8},"scope":"home"}

event: job:result-completed
data: {"jobId":"job_1","itemId":"it_3","orderIndex":2,"result":"...","scope":"home"}

Isolamento guest + stream:

- Canal: guest:{guestId}:job:{jobId} (ou token por job) para isolamento de dados.
- Autorização mínima no stream por guestId/jobId; nenhum dado sensível no payload.

## Papéis de Acesso e Billing (Dashboard vs Admin)

- Hierarquia de papéis (visão inicial):

  - Visitor: acesso público; sem edição; pode iniciar IAForms guest (Home) para preview.
  - Guest User: identidade efêmera/limitada; recebe canal isolado WS/SSE; sem edição de dashboard.
  - User Pago (logado): desbloqueia recursos mediante pagamento; usa o Dashboard (versão paga do Admin). Sem editar elementos restritos se o plano não permitir.
  - Admin/Owner/SuperAdmin: conforme sistema existente.

- Regras:

  - O Dashboard é a versão paga do Admin: quem não tem plano não vê ações de edição do dashboard.
  - IAForms guest envia dados externos com segurança e isolamento; UI idêntica ao Admin, mudando permissões e escopo.

- Billing via Stripe (Fase 1 — manual, Fase 2 — automático):
  - Fase 1 (provisório): checkout resolvido manualmente; registrar pagamento/ativação via endpoint interno (flag no workspace/user). Access Engine libera features.
  - Fase 2 (definitivo): integrar Stripe Checkout Link; webhook de confirmação atualiza plano/limites no backend; remover modo manual.

Checklist (billing, não será completo ainda, stripe nõa está configurado, é um modo dev de desenvolvimento ainda):

- [ ] Rotas seguras para marcar plano/limites manualmente (apenas admin).
- [ ] Endpoint de webhook Stripe e persistência de assinatura/estado (fase 2).
- [ ] Middleware/UI: esconder botões de edição do dashboard quando role/plano não permitir.

Resumo

- Plano atualizado em `prompt-single-batch.md` com papéis e billing.
- Trecho pronto para colar no `\plano.plan.md` mantendo total alinhamento.
