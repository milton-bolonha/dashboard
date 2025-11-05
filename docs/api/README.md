# APIs — Dashboard Guest & Jobs

> Última revisão: 05 Nov 2025

Este documento descreve as rotas expostas pelo projeto em `/dashboard/app/api`. Todas as rotas usam Netlify Functions (runtime `nodejs`).

## Convenções

- **Auth Guest**: requer `guest_id`, `job_id`, `token` (hash validado no Mongo).
- **Auth Clerk**: usa middleware padrão (Clerk) — não tratado aqui.
- **Mongo Circuit Breaker**: rotas críticas utilizam `withMongoConnectionHandler`/`withMongoErrorHandler` para retornar 503 cedo.
- **Tokens**: sempre enviados na query string (`token`) e armazenados como SHA-256 hashed.

## 1. Jobs & Workspace

| Método | Endpoint                                           | Auth           | Payload                                           | Resposta                         | Observações                                                                          |
| ------ | -------------------------------------------------- | -------------- | ------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------ |
| `POST` | `/api/prompt-jobs`                                 | Pública (form) | `{ templateId, model?, context }`                 | `{ jobId, guestId, token }`      | Cria guest workspace + job; dispara runner. Retorna 201 ou erros Joi (400).          |
| `GET`  | `/api/guest/workspace?guest_id=...&job_id?&token?` | Guest          | Query params                                      | `{ success, ...workspace_data }` | Filtra tiles por `jobId` se informado; recalcula `tiles_status`/`tiles_to_generate`. |
| `POST` | `/api/guest/workspace`                             | Guest          | `{ context, themeId? }`                           | `{ success, workspace }`         | Criação adicional (onboarding); atualiza cookies `guest_id`.                         |
| `PUT`  | `/api/guest/workspace`                             | Guest          | `{ tiles?, tiles_status?, dashboardBackground? }` | `{ success }`                    | Permite sobrescrever tiles/estado (cuidado com quotas).                              |

## 2. Tiles & Conteúdo

| Método   | Endpoint                          | Auth  | Payload                                        | Resposta             | Observações                                                                      |
| -------- | --------------------------------- | ----- | ---------------------------------------------- | -------------------- | -------------------------------------------------------------------------------- |
| `POST`   | `/api/guest/tiles`                | Guest | `{ tile, jobId, entityKey }`                   | `{ success }`        | Persistência manual (fallback). Usa `withMongoConnectionHandler`.                |
| `DELETE` | `/api/guest/tiles/[id]`           | Guest | `{ jobId, guestId, token, companyId }`         | `{ success }`        | Remove tile específico; bloqueado enquanto job gera (`tiles_status=generating`). |
| `POST`   | `/api/guest/reorder-tiles`        | Guest | `{ jobId, guestId, token, tilesOrder }`        | `{ success }`        | Atualiza ordem com `$set`.                                                       |
| `POST`   | `/api/guest/generate-custom-tile` | Guest | `{ jobId, guestId, token, companyId, prompt }` | `{ success, tile? }` | Chama runner simplificado para prompt custom.                                    |

## 3. Templates, Notes, Files, Contacts

| Método         | Endpoint                 | Auth  | Notas                                                                            |
| -------------- | ------------------------ | ----- | -------------------------------------------------------------------------------- |
| `GET`          | `/api/guest/templates`   | Guest | Requer `{ jobId, guestId, token }`. Retorna templates default + custom do guest. |
| `POST`         | `/api/guest/templates`   | Guest | `{ template }` persistido em `guest_workspaces.custom_templates`.                |
| `GET`          | `/api/guest/notes`       | Guest | Query `{ jobId, guestId, token, companyId }`. Filtra por entidade.               |
| `POST`         | `/api/guest/notes`       | Guest | `{ title, content }` sanitizados (html whitelist).                               |
| `PUT`/`DELETE` | `/api/guest/notes/[id]`  | Guest | Atualiza/exclui nota.                                                            |
| `GET`          | `/api/guest/files`       | Guest | Lista anexos por entidade.                                                       |
| `POST`         | `/api/guest/files`       | Guest | Adiciona arquivo referenciando Cloudinary (`fileUrl`, `fileSize`).               |
| `DELETE`       | `/api/guest/files/[id]`  | Guest | Remove arquivo de uma entidade.                                                  |
| `POST`         | `/api/guest/upload`      | Guest | Upload base64 → Cloudinary (usa `cloudinary` config env). Retorna `fileUrl`.     |
| `POST`         | `/api/guest/add-contact` | Guest | Gera contato + copy de outreach (usa generator interno).                         |

## 4. SSE & Tempo Real

| Método | Endpoint                                           | Auth  | Resposta                                                                                                                                                                   |
| ------ | -------------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/streams/jobs/[jobId]?guest_id=...&token=...` | Guest | Stream SSE com eventos `job:status`, `job:result-chunk`, `job:result-completed`, `job:error`. Keep-alive `: keep-alive` a cada 25s. Snapshot inicial enviado no handshake. |

Fallback: `useSSEManager` ativa polling (`GET /api/guest/workspace`) após 3 erros.

## 5. Saúde e utilidades

| Método | Endpoint              | Auth    | Observações                                                                                         |
| ------ | --------------------- | ------- | --------------------------------------------------------------------------------------------------- |
| `GET`  | `/api/health/mongodb` | Público | Ping `db.admin().ping()`. Circuit breaker local (falhas sucessivas retornam 503 com `Retry-After`). |

## 6. Dependências externas

- **OpenAI (via `generateStreamedCompletion`)** — usado no runner.
- **Cloudinary** — upload de arquivos em `/api/guest/upload`.
- **Clerk** — middleware global para rotas não guest.

---

> Security note: todas as rotas guest devem validar `accessTokenHash` e nunca retornar tokens brutos. Logs sensíveis precisam ser desligados em produção.
