# Novo Guia de Debug – Dashboard com SWR

## Visão Geral

- **Objetivo**: tornar o dashboard de admin determinístico, usando o backend como fonte única de verdade.
- **Arquitetura Atual**: SWR (polling a cada 2s) para buscar `/api/guest/workspace`. SSE apenas notifica finalizações e dispara `mutate()` + persistência.
- **Componentes-Chave**:
  - `dashboard/containers/AdminDashboardContainer.jsx`
  - `dashboard/lib/fetcher.js`
  - `dashboard/hooks/useSSEManager.js`
  - API `/api/guest/workspace` + `/api/guest/tiles`

## Fluxo de Dados

1. **SWR Snapshot**

   - `useSWR(key, fetcher, { refreshInterval: 2000 })` carrega `companies`, `tiles`, `progress`, `dashboardBackground`.
   - Qualquer sucesso em SWR atualiza imediatamente a UI.

2. **SSE (Complementar)**

   - `job:result-completed` → POST `/api/guest/tiles` → `mutate()`
   - `job:status` → atualiza `tileProgress` → se `COMPLETED`, `mutate()`

3. **Renderização**
   - `SortableTilesGrid` recebe `tiles` e `tilesToGenerate` direto do snapshot.
   - Placeholders são gerados apenas quando `tiles_status` é `pending/generating`.

## Check-list de Debug

| Situação                   | Passos                                                                                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Tiles não aparecem após F5 | Conferir `/api/guest/workspace` (via `curl` ou DevTools). Se tiles estão lá → problema no grid; senão, verificar persistência (`/api/guest/tiles`). |
| SSE não atualiza           | Conferir console do navegador (eventos logados). Se eventos chegam, confirmar POST `/api/guest/tiles` (Status 200).                                 |
| Polling saturando          | Ajustar `refreshInterval` ou usar `mutate(key, newData, { revalidate: false })` após operações que já devolvem snapshot.                            |
| Autenticação falhou        | `/api/guest/workspace` exige `job_id`, `guest_id`, `token`. Checar query params.                                                                    |

## Dicas de Manutenção

- **Nunca** reconcilie tiles manualmente no React; confie no snapshot.
- Em novos recursos (ex: custom prompt), faça a ação → aguarde resposta → `mutate()`.
- Logue sempre os eventos SSE recebidos para facilitar análise.
- Use `network` tab para confirmar ordens: SSE → POST tile → GET workspace.

## Próximos Passos

- Opcional: remover SSE completamente (apenas polling) se performance aceitar.
- Documentar no onboarding que SWR é a primeira ferramenta de debug.
- Implementar testes de integração que comparam snapshot do backend com UI renderizada.
