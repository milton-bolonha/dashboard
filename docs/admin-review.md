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

## 7. Próximos Passos Sugeridos

1. Validar estabilidade do SSE/polling em produção (deixar logs por 24h).
2. Definir plano de refatoração incremental (começando pelos hooks customizados).
3. Criar tarefa para mover operações `fetch` para camadas de serviço.
4. Revisar outros containers grandes (`StoryContainer`, `DashboardStatsContainer`) para padrão semelhante.
