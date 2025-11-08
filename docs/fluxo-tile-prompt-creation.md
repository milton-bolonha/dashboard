# Fluxo 2.0: Orquestração de Geração de Tiles e Prompts

Este documento descreve a arquitetura definitiva para o processo de geração de tiles, desde a interação do usuário na home page até a renderização no dashboard de admin. O objetivo deste fluxo é garantir um processo robusto, sem condições de corrida e com responsabilidades claras para cada parte do sistema.

## Princípios Fundamentais

1.  **Ponto Único de Iniciação:** A geração de um novo "trabalho" (job) de tiles acontece **exclusivamente** na Home Page. O dashboard de Admin não inicia mais nenhum processo de geração para este fluxo de onboarding.
2.  **Admin como Visualizador:** A página de Admin (`/admin`) atua como um visualizador em tempo real para um job que já está em andamento. Sua principal função é carregar o estado do job e ouvir por atualizações, não criar ou iniciar processos.
3.  **Comunicação Focada no Resultado:** A comunicação em tempo real (SSE) não precisa mais focar no streaming de texto caractere por caractere. O evento mais crítico é a notificação de que **"um novo tile foi concluído"**.

## A Nova Orquestração: Passo a Passo

1.  **Home Page - O Ponto de Partida:**

    - O usuário preenche o formulário com as informações necessárias (ex: nome da empresa, solução, etc.).
    - Ao submeter o formulário, o frontend faz uma única chamada `POST` para a API de backend (ex: `/api/prompt-jobs`).

2.  **Backend - O Cérebro da Operação:**

    - A API recebe a requisição da Home Page.
    - Ela cria um novo `job` no banco de dados com um status inicial (ex: `QUEUED`). Este job contém todos os prompts a serem executados, baseados no template padrão.
    - **Imediatamente**, a API responde à Home Page com o `jobId` e o `guestId`. A geração dos tiles começa a ser processada em background, de forma assíncrona.
    - O `workspace` e a `company` são criados no banco de dados neste momento, garantindo que quando o usuário chegar na página de Admin, a estrutura de dados já exista.

3.  **Redirecionamento Imediato:**

    - Assim que a Home Page recebe a resposta da API com o `jobId`, ela redireciona o usuário para a página de Admin, passando os IDs na URL. Ex: `/admin?job_id=JOB_ID&guest_id=GUEST_ID`.
    - Este redirecionamento é rápido e não espera a conclusão de nenhum tile.

4.  **Página de Admin - O Painel de Controle Visual:**
    - Um modal de carregamento (`LoadingModal`) é exibido imediatamente, informando ao usuário que os insights estão sendo gerados. Esse modal atualmente está na mesma camada do main, deve ser previsto como algo acima e separado para não gerar renderização excessiva. De qualquer forma ele não está atrelado ao main e deveria ser movido para ser a primeira coisa que abre junto com o layout geral e como já temos tiles gerando atrás dele o layout e mais quantos tiles placeholders que forem...
    - A página carrega e extrai o `jobId` e o `guestId` da URL.
    - **Renderização Inicial:**
      - O componente (`AdminDashboardContainer`) usa os hooks para buscar o `workspace` e o `jobInfo` existentes. Como eles foram criados no passo 2, não haverá mais erros "Not Found".
      - ⭐ **NOVO**: A API `/api/guest/workspace` usa cache em memória (TTL 1s) e ETag para reduzir requisições MongoDB em 50-70%.
    - **Conexão em Tempo Real:**
      - O `useSSEManager` se conecta ao endpoint de stream do job (`/api/streams/jobs/JOB_ID`).
      - O frontend se inscreve nos eventos `job:status` e `job:result-completed`.
      - ⭐ **NOVO**: Se SSE falhar, polling adaptativo é ativado automaticamente (intervalo: 3s → 5s → 10s → 15s baseado em tentativas).
    - **Renderização Assíncrona dos Tiles:**
      - Quando um evento `job:result-completed` chega, o payload contém os dados do tile finalizado (título, conteúdo, etc.).
      - O estado do React é atualizado com o novo tile, que aparece instantaneamente na UI, substituindo seu placeholder de "loading".
      - ⭐ **NOVO**: Tiles que falharem após 3 tentativas têm retry assíncrono pós-processamento (2 tentativas adicionais).
      - ⭐ **NOVO**: Se retry falhar, tile não é persistido e placeholder é removido. Aviso discreto é mostrado.
      - Este processo se repete para cada tile até que o job seja concluído. O `LoadingModal` pode ser fechado assim que o primeiro tile aparecer ou quando todos os tiles forem gerados.

Este fluxo elimina as condições de corrida, simplifica drasticamente a lógica do frontend na página de Admin e cria uma experiência de usuário fluida e previsível.

---

## 🚀 Otimizações Implementadas (06/11/2025)

### Cache + ETag na API Workspace

- Cache em memória com TTL de 1s (reduz requisições MongoDB em 50-70%)
- ETag determinístico via MD5 do workspace
- Retorno 304 Not Modified quando ETag coincide
- Cache invalidado automaticamente após salvar tiles

### Polling Adaptativo

- Intervalo adaptativo baseado em tentativas: 3s → 5s → 10s → 15s
- Redução de requisições Netlify de ~300K/mês para ~25K/mês
- Timeout de 10 minutos máximo de polling

### Retry Assíncrono de Tiles Falhos

- Tiles que falharem após 3 tentativas têm retry assíncrono pós-processamento
- 2 tentativas adicionais por tile falho
- Se retry falhar, tile não é persistido e placeholder é removido
- Contador total ajustado corretamente quando há tiles falhos
- Aviso discreto mostrado quando há tiles falhos
