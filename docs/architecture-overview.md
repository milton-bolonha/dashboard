# Arquitetura — Fluxo Guest & Multitenant (Nov/2025)

## 1. Visão Geral

- **Front**: Next.js App Router (`dashboard/app`), com páginas híbridas (SSR + client) e Clerk para autenticação do modo pago.
- **Guest Flow (Trials)**: rotas `app/api/guest/*` e `app/api/prompt-jobs` operam sem Clerk usando tokens `guestId`/`jobId`/`token`.
- **Persistência**: MongoDB Atlas único, com collections `guest_workspaces`, `guest_jobs`, `prompt_results`, etc. Circuit breaker + métricas em `lib/db.js`.
- **Tempo real**: SSE em `/api/streams/jobs/[jobId]` e fallback de polling através de `useSSEManager` + revalidations via `useSWR`.
- **Runner**: `lib/jobs/deck-engine-adapter.js` roda tiles em background, hoje dentro da mesma função serverless.

```
submit form → POST /api/prompt-jobs → cria guestId/jobId/token + workspace (Mongo)
             ↳ runJobInBackground(jobId) → queueJob → deck-engine runner
SSE client conecta a /api/streams/jobs/:jobId (token) ↔ eventos job:status / job:result-*
Fallback polling GET /api/guest/workspace?guest_id=...&job_id=...
Tiles persistidos em guest_workspaces.workspace_data.<entity>.tiles
```

## 2. Fluxos detalhados

### 2.1 Criação de Job (`POST /api/prompt-jobs`)

1. Valida payload (templateId/model/context) via Joi.
2. Realiza ping em Mongo via `withMongoConnection` (pré-aquecimento/circuit breaker).
3. Cria `guestId`, `jobId`, `accessToken` (hash armazenado).
4. Monta workspace dinâmico (theme + context normalizado) e insere em `guest_workspaces`.
5. Salva job em `prompt_jobs` com status `QUEUED` e totals esperados.
6. Dispara `runJobInBackground(jobId)` (execução “fire-and-forget”).
7. Responde `{ jobId, guestId, token }` para o navegador continuar no dashboard guest.

**Segurança**: token SHA-256, `guestId`/`jobId` cruzados em cada endpoint. Clerk não é exigido no guest flow.

### 2.2 SSE `GET /api/streams/jobs/[jobId]`

1. Valida `guest_id` + `token` contra hash do job.
2. Usa `sseManager.add(key)` onde `key = guest:${guestId}:job:${jobId}`.
3. Envia handshake `: connected` e snapshot inicial (`job:status` do job).
4. Mantém keep-alive (`: keep-alive`) a cada 25s para evitar 504/timeout Netlify.
5. Eventos de `emitJobEvent` (status/chunk/result) são propagados; fallback de buffer caso cliente desconecte.
6. Abort → remove handler + encerra keepalive.

**Riscos**: função SSE continua limitada a 10s sem eventos — keepalive + snapshot mitigam; cargas altas exigem rate limit e possivelmente mover runner para função assíncrona.

### 2.3 Polling (`GET /api/guest/workspace`)

1. Aceita `guest_id` obrigatório e opcional `job_id` + `token` (obriga se job).
2. Mescla `workspace_data` + `dynamicData` do Mongo.
3. Se `job_id` informado, filtra `tiles` por `jobId` e recalcula `tiles_to_generate`/status.
4. Normaliza limits/usage caso o documento seja legacy.

### 2.4 Execução de Tiles (`queueJob` + `deck-engine-runner-openai`)

1. Calcula total de tiles baseado no template.
2. Para cada tile: gera prompt, chama OpenAI (streamed), acumula chunks.
3. Em caso de falha/refusal, re-tenta até 3 vezes; fallback salva mensagem e marca tile como `FAILED` (após ajuste recente).
4. Persistência direta em Mongo com `$pull` + `$push`; incrementa `usage.total_tiles_generated`.
5. Emite eventos SSE conforme progresso.

**Limitações atuais**:

- Sem fila/concurrency control – vários jobs paralelos podem saturar 10s da função.
- Persistência `$pull+$push` sequencial → latência crescente.
- Runner roda na mesma função que responde SSE, sofrendo timeouts (Netlify limita 10s por request).

## 3. Segurança & Multi-tenant

- **Isolamento guest**: todo acesso guest exige `guestId` + token; jobs pertencem a guests; Clerk só no modo pago.
- **Tokens**: sempre hashed em banco; URLs carregam token raw apenas no guest admin.
- **Circuit breaker**: `withMongoConnectionHandler` em rotas críticas para responder 503 cedo quando cluster estiver frio.
- **SSE**: validação reforçada + buffer; keep-alive evita sobrecarregar fallback, mas ainda suscetível a “serverless hell” sem fila.
- **Dados sensíveis**: `accessToken`, `jobId` guardados; logs verbose só em desenvolvimento (revisar antes de produção).

## 4. Próximos passos já planejados

1. **Documentar APIs** (`docs/api/README.md`).
2. **Revisão Next.js** (server/client split, middleware, environment).
3. **Estrategia deck-engine** com Netlify Background Functions (15min) versus filas (Bull/Redis) — reduzir riscos de timeout.
4. **Roadmap** para modularizar container, batching, observabilidade, promoção NetlifyDB (ver `plan-netlifydb.md`).

---

> Referências: `dashboard/app/api/prompt-jobs/route.js`, `dashboard/app/api/guest/workspace/route.js`, `dashboard/app/api/streams/jobs/[jobId]/route.js`, `dashboard/lib/jobs/deck-engine-adapter.js`, `dashboard/lib/jobs/deck-engine-runner-openai.js`.
