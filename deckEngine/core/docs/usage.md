# Guia de Uso e Exemplos

Esta seção fornece exemplos práticos de como inicializar e usar o `Deck Engine`.

## 1. Instanciando o Engine

O ponto de entrada principal é a classe `DeckEngineApp` exportada pelo `index.js`.

```javascript
const DeckEngineApp = require("./index");

// Instanciar o engine com configurações padrão
const engine = new DeckEngineApp();

// Você pode passar opções para configurar o engine
const engineComOpcoes = new DeckEngineApp({
  concurrencyLimit: 20, // Limite global de concorrência
  enableMetrics: true, // Ativar coleta de métricas
});

// Acesso aos subsistemas
const logger = engine.logger;
const routeManager = engine.routeManager;
```

## 2. Criando seu Primeiro Deck

Um `Deck` é um objeto de configuração que define uma tarefa.

```javascript
// Criar um deck chamado 'send-welcome-email'
const emailDeck = engine.createDeck("send-welcome-email", {
  // Descrição para referência
  description: "Envia um e-mail de boas-vindas para um novo usuário.",

  // Cartas (funções) a serem executadas em sequência
  cards: [
    {
      name: "validate-input",
      play: (context) => {
        const { email, name } = context.payload;
        if (!email || !name) {
          throw new Error("Email e nome são obrigatórios.");
        }
        context.log("info", "Dados de entrada validados", { email });
        return { ...context.payload, validated: true };
      },
    },
    {
      name: "send-email-via-api",
      play: async (context) => {
        const { email, name } = context.payload;
        context.log("info", `Enviando e-mail para ${email}...`);

        // Simulação de uma chamada de API
        await context.wait(1000); // Simula latência de rede

        const emailResult = { success: true, messageId: `msg_${Date.now()}` };
        context.log("info", "E-mail enviado com sucesso", {
          result: emailResult,
        });
        return emailResult;
      },
    },
  ],

  // Configuração de retentativa em caso de falha
  retry: {
    maxAttempts: 3,
    factor: 2,
  },

  // Hooks de ciclo de vida
  onVictory: (context) => {
    console.log(
      `SUCESSO: E-mail de boas-vindas enviado para ${context.payload.email}`
    );
  },
  onDefeat: (context) => {
    console.error(
      `FALHA: Não foi possível enviar e-mail para ${context.payload.email}`
    );
  },
});
```

## 3. Executando uma Partida (Match)

Para executar o `Deck`, você inicia uma `Partida`.

### Execução Assíncrona (Fire-and-Forget)

Esta é a forma mais comum. A partida é enfileirada e executada em segundo plano.

```javascript
const userData = {
  email: "test@example.com",
  name: "John Doe",
  userId: "user123",
};

// Inicia a partida e retorna imediatamente um matchId
engine
  .playMatch("send-welcome-email", userData)
  .then((result) => {
    console.log("Partida enfileirada com sucesso!", result);
    // { matchId: 'match-167...', queued: true, arena: 'main' }
  })
  .catch((err) => {
    console.error("Erro ao enfileirar partida:", err);
  });
```

### Execução Síncrona (Aguardando o Resultado)

Use `playAndWait` se você precisa do resultado da partida antes de continuar.

```javascript
async function sendEmailAndWait() {
  try {
    console.log("Enviando e-mail e aguardando...");
    const result = await engine.playAndWait("send-welcome-email", userData, {
      timeout: 15000, // Timeout de 15 segundos
    });

    if (result.success) {
      console.log("Resultado da partida:", result.result);
    } else {
      console.error("A partida falhou:", result.errors);
    }
  } catch (error) {
    console.error("Erro na execução síncrona:", error);
  }
}

sendEmailAndWait();
```

## 4. Obtendo o Status

Você pode verificar o status de um Deck ou do Engine a qualquer momento.

```javascript
// Status de um Deck específico
const status = engine.getDeckStatus("send-welcome-email");
console.log(status);

// Status global do Engine
const globalStatus = engine.getGlobalStatus();
console.log(globalStatus);
```
