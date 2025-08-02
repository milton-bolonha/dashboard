# Componentes do Engine Principal

Esta seção detalha os subsistemas que compõem o `DeckEngine` principal, encontrado em `engine/deck-engine.js`.

---

### `ArenaSystem` (`engine/arena.js`)

O `ArenaSystem` gerencia as filas de execução.

- **Responsabilidade**: Controlar a concorrência e o fluxo de partidas.
- **Funcionalidades**:
  - `initializeArena`: Cria uma nova fila de execução (`Arena`) com um limite de concorrência.
  - `enqueueMatch`: Adiciona uma partida à fila de uma arena.
  - `getNextMatch`: Obtém a próxima partida da fila para processamento se houver capacidade.
  - `completeMatch`: Marca uma partida como concluída, liberando espaço para a próxima.
  - `pauseArena`/`resumeArena`: Permite pausar e retomar o processamento de uma fila.

---

### `DeckSystem` (`engine/deck.js`)

O `DeckSystem` é responsável por gerenciar os "modelos" das tarefas.

- **Responsabilidade**: Definir e gerenciar os `Decks`.
- **Funcionalidades**:
  - `createDeck`: Cria um novo `Deck` a partir de um objeto de configuração. Um Deck pode conter uma lista de `cards` (funções), hooks de ciclo de vida (`init`, `onVictory`), políticas de `retry`, e configuração da `arena`.
  - `createDeckProxy`: Fornece um objeto simplificado para interagir com um deck, permitindo adicionar/remover cartas e controlar seu estado.
  - `enableDeck`/`disableDeck`: Ativa ou desativa um deck inteiro.

---

### `MatchSystem` (`engine/match.js`)

O `MatchSystem` gerencia o ciclo de vida de uma execução de tarefa.

- **Responsabilidade**: Orquestrar a execução de uma `Partida` (Match) do início ao fim.
- **Funcionalidades**:
  - `createMatch`: Cria um objeto de `Partida` que rastreia o estado, payload, resultado, logs e erros de uma execução.
  - `playMatch`: Executa a lógica principal de uma partida, incluindo a execução sequencial das `cards` do deck.
  - `handleMatchError`: Gerencia falhas, aplicando a lógica de `retry` definida no deck.
  - `createMatchContext`: Fornece um objeto de contexto para as `cards`, permitindo que elas acessem dados da partida e funcionalidades do engine (como `log` e `wait`).
  - `cleanup`: Remove partidas antigas e concluídas da memória.

---

### `EventSystem` (`engine/events.js`)

Um simples barramento de eventos (pub/sub) para comunicação interna.

- **Responsabilidade**: Permitir o desacoplamento entre os diferentes subsistemas.
- **Funcionalidades**:
  - `on(event, handler)`: Registra um ouvinte para um evento.
  - `emit(event, data)`: Dispara um evento para todos os ouvintes registrados.
  - Eventos comuns incluem `engine:initialized`, `deck:created`, `match:started`, `match:victory`, `match:defeat`.

---

### `MetricsSystem` (`engine/metrics.js`)

Um coletor de estatísticas de tempo de execução.

- **Responsabilidade**: Coletar dados sobre o desempenho do engine.
- **Funcionalidades**:
  - `updateMetrics`: Atualiza as estatísticas após cada partida, registrando o número total de partidas, vitórias, derrotas e a duração média.
  - `getDeckStats`/`getCardStats`: Fornece métricas agregadas por deck ou por carta.

---

### `Utils` (`engine/utils.js`)

Um conjunto de funções auxiliares estáticas.

- **Responsabilidade**: Fornecer funcionalidades comuns usadas em todo o engine.
- **Funcionalidades**:
  - `generateUUID`: Gera IDs únicos.
  - `calculateRetryDelay`: Calcula o tempo de espera para retentativas com backoff exponencial.
  - `normalizeCards`: Padroniza diferentes formatos de definição de cartas em um objeto consistente.
  - `isFinalState`: Verifica se um estado de partida é considerado final.
