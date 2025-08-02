# Arquitetura Geral do Deck Engine

O Deck Engine foi projetado para ser um sistema robusto e flexível para orquestração e execução de tarefas. Para facilitar o entendimento e o gerenciamento, ele utiliza uma metáfora de jogo de cartas.

## A Metáfora

- **Carta (Card)**: A menor unidade de trabalho. É uma função ou uma pequena operação que executa uma tarefa específica.
- **Deck**: Uma coleção ordenada de Cartas. Um Deck define um fluxo de trabalho completo ou um pipeline de execução. Ele contém a lógica de como as cartas devem ser jogadas em sequência.
- **Partida (Match)**: Uma instância de execução de um Deck. Quando você "joga" um Deck com um determinado conjunto de dados de entrada (`payload`), uma Partida é criada para rastrear o progresso, estado, logs e resultado dessa execução específica.
- **Arena**: Um ambiente de execução onde as Partidas são disputadas. As Arenas funcionam como filas de processamento com limites de concorrência, garantindo que os recursos do sistema sejam usados de forma controlada. Um Deck pode ser configurado para ser jogado em uma Arena específica.

## Fluxo de Execução Típico

1.  **Criação do Deck**: Você define um `Deck` com uma ou mais `Cartas`. Cada carta é uma função Javascript.
2.  **Início da Partida**: Você chama `playMatch()` no `Deck`, fornecendo um `payload` (dados de entrada).
3.  **Fila na Arena**: O `DeckEngine` cria um objeto `Match` para representar essa execução e o coloca na `Arena` apropriada.
4.  **Processamento**: A `Arena` pega a `Match` da fila (respeitando o limite de concorrência) e começa a executá-la.
5.  **Execução das Cartas**: O `MatchSystem` executa as `Cartas` do `Deck` em sequência, passando o contexto da partida para cada uma.
6.  **Conclusão**: A `Partida` termina em `VICTORY` (sucesso) ou `DEFEAT` (falha). O resultado é armazenado no objeto da `Partida`.

## Componentes Principais

O `DeckEngine` é o orquestrador central e é composto por vários subsistemas:

- **`DeckEngine` (`deck-engine.js`)**: O núcleo que integra todos os outros sistemas.
- **`DeckSystem` (`deck.js`)**: Gerencia a criação, configuração e ciclo de vida dos Decks.
- **`MatchSystem` (`match.js`)**: Gerencia a criação, execução e estado das Partidas.
- **`ArenaSystem` (`arena.js`)**: Gerencia as filas de execução (Arenas) e a concorrência.
- **`EventSystem` (`events.js`)**: Um sistema de pub/sub para comunicação desacoplada entre os componentes.
- **`MetricsSystem` (`metrics.js`)**: Coleta estatísticas sobre o desempenho do engine.

## Modularidade e Evolução: Arquitetura V2

Além do engine principal, o `core` contém um conjunto de **módulos avançados** (referidos como "V2") que fornecem implementações muito mais robustas para funcionalidades específicas:

- **`DomainManager`**: Um sistema de plugins para estender as funcionalidades do engine.
- **`UnifiedLogger`**: Um sistema de logging avançado com múltiplas saídas (console, arquivo, markdown) e formatação rica.
- **`PlatformAdapter`**: Adapta a execução do engine para diferentes ambientes de nuvem (Node.js, Vercel, Netlify, etc.), gerenciando as limitações de cada um.
- **`RouteManager`**: Um gerenciador de rotas completo para expor endpoints de API, com suporte a middleware e tipos de rota.

Esses módulos "V2" representam a direção futura da arquitetura, projetada para cenários de produção complexos e implantação em larga escala. Atualmente, o ponto de entrada principal (`index.js`) utiliza a implementação integrada e mais simples do engine.
