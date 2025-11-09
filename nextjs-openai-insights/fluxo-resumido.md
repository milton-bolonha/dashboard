# Fluxo de Dados – nextjs-openai-insights 🚀

Documento-resumo sobre como os dados fluem no projeto, separando claramente as responsabilidades entre **Home** e **Admin**, destacando camadas de persistência, criação de tiles e o nível cognitivo das funções que compõem o sistema.

---

## Visão Geral

- **Home (`/`)**: ponto de entrada. Recebe o formulário, dispara geração de tiles e armazena o snapshot inicial no cache (servidor) e no `localStorage`.
- **Admin (`/admin`)**: painel onde os tiles são visualizados, atualizados, reordenados e onde notas/contatos podem ser gerenciados. Reidrata dados do `localStorage` e mantém sincronização com o cache do servidor.
- **Camadas de persistência**:
  - **Memória de sessão (server)**: `Map` global com TTL de 30 minutos. Fonte de verdade durante a sessão ativa.
  - **Cookies (HttpOnly)**: guardam apenas `sessionId` para referenciar o workspace na camada de memória.
  - **LocalStorage (client)**: último snapshot conhecido para reidratação rápida e fallback em caso de cold start.

---

## Fluxo de Dados – Diagrama

```mermaid
flowchart LR
    subgraph Navegador
        A[Usuário preenche formulário na Home] --> B[fetch POST /api/generate]
        B -->|sessionId + workspace| C[localStorage salva snapshot]
        D[Usuário navega para /admin]
        D --> E[SWR /api/workspace]
        E -->|fallback| F[localStorage reidrata UI]
    end

    subgraph Servidor
        B --> G[Função /api/generate]\nGera tiles + atualiza cache
        G --> H[Map global por sessionId]
        H --> I[cookie HttpOnly com sessionId]
        E --> J[/api/workspace]\nLê Map global
        J -->|404 se expirado| F

        subgraph OpenAI
            G --> K[Prompts templateados]
            K --> L[OpenAI Responses API]
            L --> G
        end
    end
```

---

## Home (`HomeContainer` + `ClassicHeroForm`)

| Camada              | Responsabilidade                                 | Observações                          |
| ------------------- | ------------------------------------------------ | ------------------------------------ |
| UI / Form           | Coletar dados do prospect e solução              | Interações visuais, validação mínima |
| Lógica de submissão | Disparar `POST /api/generate` e redirecionar     | Usa `router.push('/admin')`          |
| Persistência client | Salvar `sessionId` + workspace no `localStorage` | Facilita reidratação posterior       |
| Feedback            | Toasts informando sucesso/erro                   | Mantém usuário consciente do status  |

### Criação de tiles

1. `POST /api/generate` normaliza contexto e seleciona template.
2. Para cada tile: monta prompt (string curta e objetiva) e chama OpenAI Responses API.
3. Resultado consolidado → `workspace` (tiles + metadados) → salvo em memória (`Map`) e sincronizado em `localStorage` via Home.
4. Resposta da API devolve `{ success, sessionId, tilesGenerated, workspace }` para consumo imediato.

### Prompts

- Baseados nos templates em `lib/guest-templates.ts` (8 ou 9 variações).
- Claros, com limites de palavras, instruções de fallback e categorização (ex.: `basic`, `financial`, `sales`).
- São interpolados com os dados do formulário antes de chamar a API.

---

## Admin (`AdminContainer` + subtemas)

| Camada              | Responsabilidade                                       | Observações                                            |
| ------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| Reidratação inicial | Ler `localStorage` via helper (`loadWorkspace`)        | Exibe algo mesmo sem servidor quente                   |
| Data Fetching       | SWR (`/api/workspace`) com fallback para cache cliente | TTL no servidor dispara 404 → fallback                 |
| Ações               | Delete tile, reorder, notas, contatos, follow-up       | Cada rota valida sessão e devolve 404 se cache expirou |
| Persistência client | Atualiza `localStorage` toda vez que SWR recebe dados  | Mantém UX consistente                                  |
| UX contingência     | Banner + toast informando quando o cache expirou       | Sugere voltar à Home e regenerar                       |

### Camadas de Persistência

1. **Memória (server)** – `Map<string, { snapshot, updatedAt }>`
   - TTL de 30 minutos; acessado por todas as rotas `API/workspace`.
2. **Cookie HttpOnly** – `sessionId`
   - Define qual workspace deve ser buscado no map global.
3. **LocalStorage (client)** – `insights_workspace_{sessionId}`
   - Último snapshot conhecido. Utilizado quando a memória de servidor expirou.
4. **Cache SWR (client)** – mantém payload mais recente em memória para a sessão atual no browser.

---

## Complexidade Cognitiva das Funções

| Área           | Função/Hook                                                            | Nível de complexidade                                      | Relações                                                      |
| -------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------------------- |
| Server         | `writeWorkspace`, `readWorkspace`, `updateWorkspace`, `clearWorkspace` | **Média** – cuidam de TTL, clonagem, erros                 | Chamadas centralizadas pelas rotas `/api/workspace/*`         |
| Server         | `generateTileWithRetry`                                                | **Alta** – lida com retries, parcial output, logs          | Depende de `runGenerationAttempt`, `coerceToText` e templates |
| Server         | `runGenerationAttempt`                                                 | **Alta** – monta payload OpenAI, trata logs, analisa usage | Suporta `generateTileWithRetry` e chat                        |
| Client (Home)  | `handleSubmit`                                                         | **Baixa** – fetch + redirecionamento                       | Usa helpers de toast e `rememberSessionId`                    |
| Client (Admin) | `AdminContainer` (hooks)                                               | **Alta** – combina SWR, `localStorage`, banners, toasts    | Orquestra `loadWorkspace`, `saveWorkspace`, mutações          |
| Client (Admin) | Painéis (Notas/Contatos)                                               | **Média** – submit + fallback de sessão                    | Dependem de `onNotesChanged`/`onContactsChanged` e SWR        |

**Resumo**: a maior carga cognitiva está nas funções que interagem com o OpenAI e no `AdminContainer`, por coordenarem múltiplos estados (memória, caches, toasts, fallback). Funções de UI (cards, forms) mantêm complexidade baixa ou média.

---

## UX History – Exemplo de Uso

> **Cenário**: vendedora quer gerar insights sobre “Upwork” para vender “Mentorship Career Program”.

1. **Home**: ela preenche o formulário com dados da empresa alvo e clica em “Connect CRM”.
2. **Geração**: request chega em `/api/generate`, tiles são criados (OpenAI) e o workspace é salvo.
3. **Redirect**: usuário é levado para `/admin` com toast “Generating insights… tiles aparecerão aos poucos”.
4. **Admin**: SWR carrega tiles do cache em memória. Caso servidor esteja frio, reidrata do `localStorage` e avisa que sessão expirou.
5. **Interações**: ela abre o tile “CEO Sales Email”, revisa conteúdo, envia follow-up via chat, adiciona contato e notas.
6. **Reset**: ao terminar, usa o botão “Resetar” para limpar workspace → API gera nova sessão e atualiza `localStorage`.

Esse fluxo garante que, mesmo com cold start no serverless, o usuário sempre tenha algum estado visível, reduzindo frustração e mantendo a continuidade da jornada.

---

## Conclusão

- **Home** → coleta dados, gera tiles, inicia sessão.
- **Admin** → consome, apresenta e manipula os tiles, com camadas de fallback.
- **Persistência** em 3 níveis (memória, cookie, localStorage) garante resiliência.
- **Funções de alta complexidade**: `generateTileWithRetry`, `runGenerationAttempt`, `AdminContainer` (hooks). Exigem mais atenção em evoluções futuras.
- **UX** prioriza feedback constante e recuperação em caso de sessão expirada.

---

## Radar de Riscos (baseado nos relatórios históricos)

| Categoria                 | Risco identificado                                             | Nível | Notas e origens                                                                                        |
| ------------------------- | -------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------ |
| Consistência de dados     | Tiles duplicados, sumindo ou misturando pesquisas              | Alto  | Falta de filtro por `job_id`, placeholders persistentes e state híbrido (relatório-cards.md).          |
| Streaming & fallback      | SSE fechando em 10 s, placeholders infinitos, polling infinito | Alto  | Limites de serverless + ausência de keep-alive ou timeout (fluxo-report.md).                           |
| Background serverless     | Função “process-job” retornando 202 sem executar               | Alto  | `callbackWaitsForEmptyEventLoop`, import errado, logs ausentes (fluxo-report.md).                      |
| Conectividade MongoDB     | `MongoServerSelectionError`, promise rejeitada globalmente     | Alto  | Cold starts prolongados, whitelist, circuito sem reset (bug-mongo-netlify.md).                         |
| Persistência multi-camada | Diferença entre Map, cookie HttpOnly, localStorage e SWR       | Médio | Cold start derruba cache em memória e exige fallback manual informado ao usuário.                      |
| UX & feedback             | Modal duplicado/re-render, mensagens inconsistentes pós F5     | Médio | Hooks em ordem errada, falta de guard rails (`hasCompletedTiles`).                                     |
| Observabilidade           | Logs demais ou insuficientes para stuck jobs                   | Médio | Necessidade de health checks, métricas, telemetry nos flows SSE/polling.                               |
| Performance/custo         | Polling sem adaptação, operações Mongo não batchadas           | Médio | Relatório de otimização (bug-mongo-netlify.md) mostra redução de custos com caches/ETag e bulk writes. |
| Falhas upstream (OpenAI)  | Respostas vazias, fallback silencioso                          | Médio | Sistema precisa mostrar quando veio fallback e reprocessar automaticamente.                            |
| Serverless coldstarts     | Sessão perdida ou caches zerados entre execuções               | Médio | TTL curto minimiza impacto, mas exige reidratação via localStorage/pre-warm.                           |

### Riscos “severos” destacados

1. **Inconsistência de tiles** – Mistura de sessions e placeholders permanentes; resolvido com backend-first + hooks determinísticos, mas depende de monitoramento constante.
2. **Streaming frágil** – SSE fecha cedo em Netlify; solução: retry automático + polling adaptativo (3s → 5s → 10s → 15s) com timeout de 5 min.
3. **Background tasks falhando silenciosamente** – Export errado no handler, sem logs; mitigação é hardening (`callbackWaitsForEmptyEventLoop = false`, logs detalhados).
4. **MongoDB promises corrompidas** – Falha de conexão deixava `global._mongoClientPromise` rejeitada; corrigido com retry/circuit breaker, mas precisa health check constante.
5. **Operações Mongo dispendiosas** – Loops inserindo um a um (importer); recomendação: `bulkUpsert`, `bulkWrite`, TTL curto, invalidar caches após persistências.

### Metas de resiliência / “desafios”

- **Sessão determinística**: manter workspace coerente entre Map, cookie e `localStorage`.
- **Fallback transparente**: UI avisa quando sessão expira ou quando tile veio de retry/fallback.
- **Observabilidade**: health endpoints, métricas de stuck jobs, alertas para SSE/polling, logs estruturados.
- **Batch + retry**: garantir que tiles falhos têm 2 tentativas extra no backend antes de fallback definitivo.
- **Serverless hygiene**: pre-warm/conexão Mongo, invalidar cache de workspace, polling adaptativo evitando custo excessivo.

> **Resumo**: o projeto já incorpora várias correções dos relatórios, mas o histórico mostra que riscos voltam facilmente sem monitoramento ativo. Manter métricas, health checks e testes E2E (especialmente streaming/persistência) é essencial para prevenir regressões.
