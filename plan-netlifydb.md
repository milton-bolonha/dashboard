# Plano: Storage Orquestrado NetlifyDB

> Objetivo: separar completamente os dados de guest sessions (Netlify Functions) dos dados do usuário autenticado/pagante, garantindo isolamento, filtros públicos coerentes e fluxo seguro de promoção entre camadas.

## 1. Arquitetura Geral

| Camada          | Origem                           | Destino                                         | Responsável                                                   | Observações                                                         |
| --------------- | -------------------------------- | ----------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------- |
| Ingest          | Formulários Home / Trials        | NetlifyDB (MongoDB cluster serverless)          | Functions (`/api/prompt-jobs`, `/api/guest/*`)                | Dados transitórios; isolamento total por `guestId`/`jobId`/`token`. |
| Orquestração    | Netlify Cron / Background Runner | NetlifyDB & Event Bus                           | `runner.js` 2.0 (tarefa agendada)                             | Consolida eventos, reprocessa jobs, aplica políticas de expiração.  |
| Promoção        | NetlifyDB (coleções `guest_*`)   | Database principal (`tenant_*`)                 | Novo serviço `promotion-worker` (executa em ambiente trusted) | Validação de quota, consentimento e pagamento antes de promover.    |
| Consumo Público | Netlify Edge / SSR anônimo       | NetlifyDB (coleções filtradas `guest_public_*`) | Middleware `withGuestAccess`                                  | Apenas campos whitelisted; sem tokens sensíveis.                    |
| Consumo Privado | Dashboard autenticado            | Database principal                              | APIs atuais (com Clerk)                                       | Continua isolado; sem dependência de NetlifyDB.                     |

## 2. Modelagem NetlifyDB

- **Banco NetlifyDB**: cluster separado ou database dedicado (`guest_netlify`).
- Coleções sugeridas:
  - `guest_workspaces`: snapshot completo do workspace público (estrutura similar ao atual, mas sem dados de billing/clerk).
  - `guest_jobs`: status da geração, quotas, métricas.
  - `guest_tiles`: tiles normalizados (favor facilitar filtros públicos).
  - `guest_notes`, `guest_files`, `guest_contacts`: somente se necessário em modo trial.
  - `guest_public_views`: visões materializadas pré-filtradas (campos permitidos) para consumo sem backend.
- Índices essenciais: `guestId`, `jobId`, `accessTokenHash`, `expiresAt`, `status`, `isPublic`.
- TTL indexes para expurgo automático (`expiresAt`) + marcação `promotedAt`.

## 3. Fluxo Guest → NetlifyDB

1. **Submit** (`/api/prompt-jobs`):

   - Valida input.
   - Cria `guest_job` + `guest_workspace` inicial em NetlifyDB.
   - Dispara pipeline de geração (tiles, notas etc.) escrevendo diretamente em NetlifyDB.

2. **Streaming / Polling** (`/api/streams/jobs/[jobId]`):

   - Eventos SSE buscados de caches in-memory + confirmação via NetlifyDB.
   - FallBack polling (`/api/guest/tiles`) lê exclusivamente NetlifyDB.

3. **Finalização**:
   - `tiles_status` → `completed`, `publicSnapshot` populate.
   - Job marcado como pronto para avaliação de promoção.

## 4. Promoção para Usuário Pagante

- Serviço `promotion-worker` (cron serverless ou worker dedicado):
  1. Lista jobs `status=ready_for_promotion` com `userId` real associado (após upgrade).
  2. Valida quota, ownership e consentimento (ex.: `guest_jobs.pendingPromotion` + `users.pendingGuestImport` no BD principal).
  3. Processa transformação e insere dados no banco principal (`workspace`, `tiles`, `notes` etc.).
  4. Atualiza `guest_job.promotedAt`, `guest_workspace.promoted=true` e reduz retenção.
  5. Remove ou anonimiza dados privados no NetlifyDB (mantendo somente agregados públicos, se necessário).

## 5. Consumo Público (Netlify Edge / SSR)

- Middleware `withGuestAccess`:
  - Opera somente sobre NetlifyDB ou caches derivados.
  - Aplica filtros `isPublic=true`, remove PII (campos whitelist).
  - Responde com dados pré-renderizáveis, favorecendo CDN/ISR.
- Rotas públicas (`/explore`, `/templates/demo`, etc.) consultam `guest_public_views`.
- Implementar rate limiting baseado em IP/cookie para proteção.

## 6. Controles de Segurança & Compliance

- **Tokens**: `accessTokenHash` armazenado apenas no NetlifyDB; tokens reais enviados via URL somente durante sessão guest.
- **Segregação**: Credenciais/URI do NetlifyDB isoladas em variáveis `NETLIFYDB_URI`, `NETLIFYDB_NAME`; nunca reaproveitar `MONGODB_URI`.
- **Auditoria**: Logs estruturados (`[MongoDB Metrics]` stage = `guest-netlify`) para monitoramento específico.
- **Retention**: Política clara (ex.: expira em 14 dias, salvo se promovido).

## 7. Ações Técnicas

1. Provisionar cluster NetlifyDB.
2. Criar camada DAL dedicada (`lib/netlifydb.ts`) com helpers equivalentes (`withNetlifyDb`, `bulkUpsertNetlify` etc.).
3. Migrar APIs guest (`/api/guest/*`, `/api/prompt-jobs`, SSE) para usar NetlifyDB.
4. Ajustar pipelines (`runner.js`, `guest-tile-pipeline`, notes/files) para persistir diretamente no NetlifyDB.
5. Criar worker/cron de promoção (`scripts/promotion-worker.js`).
6. Implementar rotas públicas consumindo apenas `guest_public_views`.
7. Atualizar documentação (`bug-mongo-netlify.md`, `mongodb-performance.md`) com novo fluxo.
8. Configurar variáveis ambiente: `NETLIFYDB_URI`, `NETLIFYDB_DB`, `NETLIFYDB_TTL_DAYS`, etc.
9. Revisitar monitoramento (health check, métricas dedicadas) para o novo cluster.

## 8. Testes e Validação

- ✅ Fluxo guest completo em ambiente de staging usando NetlifyDB.
- ✅ Verificação manual de isolamento (guest não enxerga DB principal e vice-versa).
- ✅ Teste de promoção (simulação de upgrade → worker executa → dados replicados).
- ✅ Health check NetlifyDB (`/api/health/netlifydb`) similar ao atual.
- ✅ Planos de rollback (feature flag `ENABLE_NETLIFYDB_ORCHESTRATION`).

---

> Próximos passos sugeridos: converter este plano em tickets (DAL, migration, worker, rotas públicas) e agendar sessão de revisão com time de produto/segurança para validar políticas de retenção e privacidade.
