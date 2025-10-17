## Roadmap Detalhado — AI Sales Assistant

### Semana 1 — Fundação

- Instalador do plugin (coleções, índices, seeds de templates).
- CRUD Templates + Companies/Dashboards (isolamento por `x-workspace-id`).
- UI inicial de Tiles (lista/placeholder) e seleção de template/empresa.
- CI/CD e variáveis (OpenAI, Stripe, Mongo).

### Semana 2 — LLM + Execução

- Serviço LLM com streaming e cache.
- Execução de Tile (single) com débito de créditos.
- Bulk via DeckEngine (fila, concorrência, progresso por jobId).
- UI de progresso e histórico por tile.

### Semana 3 — Contacts & Outreach & Billing

- Modelo/rotas de Contacts + Insights automáticos.
- Gerador de Outreach (email/call/LinkedIn) + Editor side-by-side + Bookmarks.
- Dashboard Templates (salvar/apply) e barra de créditos.
- Stripe sync para créditos por workspace.

### Semana 4 — Polimento e Entrega

- Admin simples (jobs, logs, retries).
- Observabilidade (opcional Sentry/Logflare).
- Testes de carga leve + documentação e runbooks.

### Passos executivos

1. Installer → Templates/Companies → Tile Single → Bulk → Contacts → Outreach → Dashboard Templates → Billing → Admin/Docs.
