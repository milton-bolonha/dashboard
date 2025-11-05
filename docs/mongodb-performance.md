# MongoDB Performance Playbook

> Atualizado em: 05/11/2025

Este guia compila as práticas adotadas no projeto para manter o MongoDB estável em ambiente serverless (Netlify Functions) e reduzir latência em operações de alto volume. Ele consolida as recomendações das análises internas (`bug-mongo-netlify.md`, `relatorio-cards.md`) e das referências externas (talk sobre tuning e vídeo de bulk operations).

## 1. Conexão e Circuit Breaker

- `dashboard/lib/db.js` concentra toda a gestão de conexão:
  - `withMongoConnection` garante compatibilidade com o pipeline SSE/polling descrito em `dashboard/docs/relatorio-cards.md`.
  - Circuit breaker configurável (`MONGODB_CONNECT_RETRIES`, `MONGODB_CIRCUIT_BREAKER_TIMEOUT_MS`).
  - `closeMongoClient` permite encerrar a conexão após fluxos específicos (ex.: tarefas pontuais na home/admin/onboarding).
- `withMongoConnectionHandler` aplica o pre-warm + short-circuit 503 em todas as rotas guest (workspace, tiles, notes, files, templates, upload etc.).

## 2. Bulk Operations

- Use `bulkUpsert` sempre que precisar criar/atualizar múltiplos documentos com chaves compostas.
- `bulkWriteWithMetrics` injeta logs estruturados `[MongoDB Metrics]` com `stage`, `durationMs`, quantidade de documentos e flag `ordered`.
- Quando possível, prefira `ordered: false` para evitar que uma falha interrompa todo o lote (padrão configurado nos helpers).
- Referências rápidas:
  - Vídeo “Bulk Write Operations” – ótimos exemplos de `insertOne`, `updateOne`, `deleteOne`, `replaceOne` em lote.
  - Talk “Performance Tuning Patterns (MongoDB World)” – reforça o ciclo _context → problema → força → solução_.

## 3. Batch Size

- `DEFAULT_MONGODB_BATCH_SIZE` inicia em 50 documentos, podendo ser sobrescrito por `MONGODB_BATCH_SIZE`.
- Pipelines específicos:
  - Importer usa `MONGODB_BATCH_SIZE` (fallback para 50).
  - Guest tile pipeline aceita `GUEST_TILE_BATCH_SIZE` (default 10) mantendo a compatibilidade com SSE/polling.
- Ajuste os valores monitorando os logs `[MongoDB Metrics]` e as latências no Atlas.

## 4. Observabilidade

- Métricas estruturadas: todos os helpers registram payload JSON via `[MongoDB Metrics]` (tempo, contagem, estágio, metadados).
- Health check (`/api/health/mongodb`):
  - Responde `ok` com `durationMs` quando o `admin().ping()` é bem-sucedido.
  - Abre circuito local após `MONGODB_HEALTH_FAILURE_THRESHOLD` falhas, retornando `503` com `Retry-After`.
- Combine com dashboards do Atlas (Connection Count, Operation Latency) e logs do Netlify.
- SSE/Fallback:
  - `useSSEManager` possui retries exponenciais (3 tentativas) e dispara polling automático via `AdminDashboardContainer` quando a conexão não estabiliza.
  - Polling roda de forma controlada (`POLLING_INTERVAL_MS`, `MAX_POLLING_ATTEMPTS`) e se auto encerra quando os tiles finalizam.

## 5. Variáveis de Ambiente

| Variável                             | Descrição                                                     |
| ------------------------------------ | ------------------------------------------------------------- |
| `MONGODB_CONNECT_RETRIES`            | Número de tentativas ao inicializar a conexão                 |
| `MONGODB_CONNECT_BACKOFF_MS`         | Backoff inicial entre tentativas (dobrado a cada falha)       |
| `MONGODB_CIRCUIT_BREAKER_TIMEOUT_MS` | Janela de circuito aberto após falhas críticas                |
| `MONGODB_BATCH_SIZE`                 | Tamanho padrão de lote para operações em massa                |
| `MONGODB_HEALTH_FAILURE_THRESHOLD`   | Falhas consecutivas antes de abrir o circuito do health check |
| `MONGODB_HEALTH_TIMEOUT_MS`          | Tempo de cooldown do health check                             |
| `GUEST_TILE_BATCH_SIZE`              | Batch size específico para o pipeline de tiles                |

## 6. Checklist Rápido

- [ ] Sempre usar `withMongoConnection` em novas rotas/serviços antes de tocar o banco.
- [ ] Avaliar se a rota deve usar `withMongoConnectionHandler` para garantir short-circuit (guest APIs).
- [ ] Preferir `bulkUpsert`/`bulkWriteWithMetrics` a loops `findOne` + `insertOne`.
- [ ] Atualizar `bug-mongo-netlify.md` quando uma otimização relevante for implementada.
- [ ] Validar `/api/health/mongodb` em pré-produção (esperado `status=ok`).
- [ ] Review periódico das métricas `[MongoDB Metrics]` no log stream e no Atlas.

> Dica: ao investigar problemas, combine este guia com o fluxograma de diagnóstico descrito em `bug-mongo-netlify.md` – ele aponta onde observar logs, métricas e toggles de configuração.
