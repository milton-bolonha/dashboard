# Deck Engine

O Deck Engine é um motor de processamento de tarefas flexível e modular, projetado para orquestrar e executar fluxos de trabalho complexos de forma confiável e controlada.

## Visão Geral

O `core` implementa uma arquitetura de execução de tarefas baseada em uma metáfora de "jogo de cartas" para simplificar conceitos como pipelines, concorrência e rastreamento de estado.

- **Decks**: Defina seus fluxos de trabalho como uma sequência de etapas.
- **Cartas**: Encapsule a lógica de cada etapa em funções reutilizáveis.
- **Partidas**: Execute seus Decks com dados específicos e monitore cada execução individualmente.
- **Arenas**: Controle a concorrência e priorize as execuções para gerenciar os recursos do sistema.

## Documentação Completa

Para uma análise aprofundada da arquitetura, componentes, módulos avançados e guias de uso, consulte a **[documentação completa](./docs/README.md)**.

## Ponto de Entrada Principal

O principal ponto de entrada para usar o sistema é o `DeckEngineApp`, exportado por `index.js`.

```javascript
const DeckEngineApp = require("./index");

const engine = new DeckEngineApp();

// Crie seu deck
const meuDeck = engine.createDeck("meu-deck", {
  cards: [(context) => console.log("Olá, mundo!", context.payload)],
});

// Execute uma partida
engine.playMatch("meu-deck", { info: "Teste" });
```
