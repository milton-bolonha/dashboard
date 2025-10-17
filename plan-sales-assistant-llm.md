## LLM Strategy — Streaming, Cache, Credits

### Provider

- Abstração em `dashboard/lib/ai/` com suporte a OpenAI (inicial) e fácil extensão.

### Streaming

- SSE ou streaming nativo do SDK.
- UI: render incremental, barra de progresso por tile.

### Cache

- Chave: `(workspaceId, companyId, templateId, hash(vars,prompt))`.
- TTL configurável; invalidar ao editar template/variáveis.

### Credits

- `credits` por workspace; débito atômico por request LLM (idempotency key).
- Bloquear execução se saldo insuficiente; exibir aviso.

### Bulk

- DeckEngine: jobs por (empresa × template) com concorrência controlada.
- Replays idempotentes e logs para auditoria.
