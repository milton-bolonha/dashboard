# Admin Dashboard Container — Technical Health Review (06/11/2025)

## 1. Visão Geral

- Arquivo: `dashboard/containers/AdminDashboardContainer.jsx`
- Tamanho atual: **~765 linhas** (incluindo JSX) — sinal de alerta para responsabilidade excessiva.
- Papel: orquestra o consumo de SSE, polling de fallback, modais, CRUD de tiles, notas, arquivos e personalização visual em um único componente client-side.

## 2. Métricas Rápidas

- `useState`: 12 declarações.
- `useMemo`: 9 declarações.
- `useCallback`: 15 declarações (vários handlers inline).
- `useEffect`: 6 declarações.
- Hooks externos: `useSWR`, `useSearchParams`, `useSSEManager`.
- Side effects relevantes:
  - Polling + SSE fallback (streams de jobs).
  - Mutations diretas via `fetch` para diversas rotas guest.
  - Controle de múltiplos modais (company, contact, prompt, template, background, doc viewer).

## 3. Pontos Fortes

- Conecta-se corretamente ao `useSSEManager` e usa fallback de polling.
- Mantém as dependências dos hooks sincronizadas (após a correção mais recente).
- Encapsula mutações críticas em `useCallback` para evitar recreação desnecessária.
- Log de diagnóstico temporário facilita investigar regressões em produção.

## 4. Riscos & Code Smells

1. **Complexidade Cognitiva Alta**

   - Um único componente concentra fluxo de dados, persistência, UI modals e estados derivados.
   - Dificulta testes isolados e revisão de regressões.

2. **Hooks + Estado Compartilhado Demais**

   - `useState`/`useMemo`/`useCallback` declarados no mesmo escopo competem por dependências.
   - Fácil introduzir bugs de ordem (ex.: `stopPolling`/`startPolling`).

3. **Duplicidade de Responsabilidades**

   - Regras de domínio (persistência de tiles, reorder, notes/files) convivem com regras de apresentação.
   - Fica difícil reaproveitar lógica em outras telas (ex.: versão authenticated vs guest).

4. **Tratamento de Erros Disperso**

   - Cada handler `fetch` faz seu próprio `try/catch` com logs, mas não existe camada centralizada.
   - Não há feedback visual consistente para erros (exceto console).

5. **Testabilidade Baixa**
   - Sem separação em hooks customizados puros ou serviços, torna difícil escrever testes unitários/integration.

## 5. Recomendações (Sem aplicar ainda)

### Curto Prazo

- **Criar hooks especializados**:
  - `useGuestWorkspace(jobId, guestId, token)` → isola `useSWR`, `revalidateWorkspace` e derivações (`companies`, `selectedCompany`).
  - `useJobStreaming(jobId, guestId, token)` → encapsula SSE + polling + progress state.
- **Extrair componentes de modais**: mover JSX de cada modal para componentes dedicados ou lazy.
- **Centralizar operações Fetch**: criar serviços em `lib/guest-tiles`, `guest-notes`, etc. para reduzir repetição.

### Médio Prazo

- Avaliar dividir o container em camadas:
  - `AdminDashboardProvider` (contexto com estados e ações compartilhadas).
  - `AdminDashboardView` (apenas renderização).
- Introduzir notificações de erro/sucesso reutilizáveis (toast/snackbar) em vez de só logs.
- Mapear eventos críticos (tile gerado, polling terminado) em um logger único (`logDashboardEvent`).

### Longo Prazo

- Implementar testes básicos (Jest/RTL) focados em:
  - `useJobStreaming` (simulação de SSE + fallback).
  - Mutations (`handleSaveTemplate`, `handleReorderTiles` etc.).
- Considerar dividir o dashboard em **Sub-rotas/Layouts** (tiles, notas, arquivos) para reduzir carga inicial.

## 6. Observabilidade & Alertas

- Manter logs adicionados recentemente até estabilidade confirmada em produção.
- Planejar remoção dos logs manuais (console) substituindo por um logger normalizado.
- Monitorar `/api/streams/jobs/*` e `/api/guest/workspace` em produção (latência + taxa de erro) após ajustes.

## 7. Avaliação Next.js (Best Practices)

- **Server vs Client Components**: `AdminDashboardContainer` é `"use client"` por necessidade (hooks/SSE). Componentes como `Sidebar`, `Header`, `SortableTilesGrid` poderiam ser convertidos para server ou divididos para reduzir bundle e hidratação.
- **Middleware Clerk**: Configuração atual permite `/api/guest/*`, `/api/streams/*`, `/api/health/mongodb` sem Clerk — alinhado ao requisito multi-tenant. Recomenda-se validar periodicamente para evitar regressões (ex.: novas rotas guest precisariam ser adicionadas).
- **Runtimes & streaming**: SSE permanece em `runtime = "nodejs"`, keep-alive ativo. Função precisa deixar claro `Cache-Control: no-store`; já presente na rota.
- **Env/Secrets**: `MONGODB_URI`, `CLOUDINARY_*`, tokens Clerk estão bem isolados. Ao introduzir Netlify Background Functions será necessário criar variáveis dedicadas (`NETLIFY_BACKGROUND_QUEUE?`).
- **ISR/Edge**: Rotas guest são API routes tradicionais; consumo público ainda não usa Edge. Recomenda-se preparar camadas derivadas (ex.: `guest_public_views`) antes de mover para Edge.

## 8. Estratégia DeckEngine & Escalabilidade

| Opção                                                | Prós                                                                                                                                                                   | Contras / Riscos                                                                                | Uso recomendado                                                                                                                        |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Netlify Background Functions** (`*-background.js`) | 15 min runtime, invocação async (202), sem bloquear requisição principal, retries automáticos [[docs](https://docs.netlify.com/build/functions/background-functions/)] | Sem streaming direto; precisa persistir status em Mongo e notificar via SSE/polling manualmente | “Job worker” para gerar tiles em segundo plano; executar `queueJob` dentro de background function chamada após `POST /api/prompt-jobs` |
| **Fila externa (BullMQ/Redis)**                      | Controle de concorrência, reprocessamento, visualização                                                                                                                | Infra extra (Redis), custos, Cold start em serverless                                           | Quando volume for alto (multi-tenant pago) e for necessário rate limit custom                                                          |
| **Fila interna (semáforo in-memory)**                | Simples, sem dependência externa                                                                                                                                       | Não escala em múltiplas instâncias; instável em serverless stateless                            | Apenas para throttling leve (poucos jobs simultâneos)                                                                                  |

Recomendação prática:

1. Criar background route (`api/jobs/process-background.js`) que recebe `jobId` e invoca `queueJob` fora da requisição do cliente.
2. `POST /api/prompt-jobs` responde 202 + dados e dispara `fetch('/api/jobs/process-background', { method: 'POST', body: ... })`.
3. SSE/polling continuam lendo status do Mongo (sem depender da resposta inline).
4. Se volume crescer além de 15min/worker, planejar migração para fila dedicada (Bull/Redis ou serviço gerenciado).

## 9. Roadmap de Melhoria (Prioritário)

1. **Runner/Queue**
   - Migrar execução para Netlify Background Function.
   - Implementar batching Mongo (`$push` com `$each`) para reduzir round-trips.
2. **Modularização do Container**
   - Extrair `useJobStreaming`, `useGuestWorkspace` hooks.
   - Dividir UI em `Provider` + `View` + componentes modulados.
3. **Observabilidade**
   - Toggle de logs por env (`RUNNER_VERBOSE_LOGS`).
   - Adicionar métricas de duração por tile (`[OpenAI Metrics]`).
4. **Promoção NetlifyDB** (ver `plan-netlifydb.md`)
   - Implementar camada DAL NetlifyDB + worker de promoção.
5. **UX/Feedback**
   - Toasts para erros (falha em tile → exibir no grid).
   - Barra de progresso que consome `job:status` (considerar exibir erros).

---

> Este documento deve ser revisitado após a migração para background functions e modularização inicial, para atualizar métricas e riscos.
