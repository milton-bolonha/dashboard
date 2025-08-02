/**
 * 🎴 Sistema de Decks do DeckEngine
 */

import Utils from "./utils.js";

class DeckSystem {
  constructor(eventSystem) {
    this.decks = new Map();
    this.triggers = new Map();
    this.middleware = [];
    this.eventSystem = eventSystem;
  }

  createDeck(deckName, config = {}) {
    if (this.decks.has(deckName)) {
      throw new Error(`Deck "${deckName}" já existe`);
    }

    const deck = {
      name: deckName,
      title: config.title || deckName,
      description: config.description || "",
      version: config.version || "1.0.0",

      // Triggers e execução
      trigger: config.trigger || { type: "manual" },
      cards: Utils.normalizeCards(config.cards || []),
      play: config.play,

      // Hooks do ciclo de vida
      init: config.init,
      cleanup: config.cleanup,
      middleware: config.middleware || [],

      // Eventos de partida
      onMatchStart: config.onMatchStart,
      onVictory: config.onVictory,
      onDefeat: config.onDefeat,
      onCardPlayed: config.onCardPlayed,
      handleError: config.handleError,

      // Configurações de retry
      retry: {
        maxAttempts: config.maxAttempts || config.retry?.maxAttempts || 3,
        factor: config.retry?.factor || 2,
        minTimeoutInMs: config.retry?.minTimeoutInMs || 1000,
        maxTimeoutInMs: config.retry?.maxTimeoutInMs || 30000,
        randomize: config.retry?.randomize || false,
      },

      // Arena e recursos
      arena: {
        name: config.arena?.name || config.arena || "main",
        concurrencyLimit: config.arena?.concurrencyLimit || 10,
        priority: config.arena?.priority || 0,
      },

      // Configurações avançadas
      concurrencyKey: config.concurrencyKey,
      maxDuration: config.maxDuration || 30000,
      machine: config.machine || { preset: "small" },

      // Metadados
      tags: config.tags || [],
      metadata: config.metadata || {},
      idempotencyKey: config.idempotencyKey,
      idempotencyKeyTTL: config.idempotencyKeyTTL || 86400000, // 24h
      ttl: config.ttl,
      delay: config.delay,

      // Rastreamento
      created: new Date().toISOString(),
      createdBy: config.createdBy || "system",
      enabled: config.enabled !== false,
    };

    this.decks.set(deckName, deck);

    // Auto-registrar trigger
    if (config.trigger) {
      this.registerTrigger(deckName, config.trigger);
    }

    this.eventSystem.emit("deck:created", { deckName, deck });

    return deck;
  }

  getDeck(deckName) {
    return this.decks.get(deckName);
  }

  createDeckProxy(deck) {
    const proxy = {
      name: deck.name,
      title: deck.title,
      description: deck.description,
      version: deck.version,
      cards: deck.cards,

      // 🎮 Ações de partida - serão definidas pelo DeckEngine principal
      playMatch: null,
      playAndWait: null,
      playMatches: null,

      // ⚙️ Configuração dinâmica
      configure: (config) => this.configureDeck(deck.name, config),
      use: (middleware) => this.addDeckMiddleware(deck.name, middleware),

      // 🎛️ Controles
      pause: () => this.pauseDeck(deck.name),
      resume: () => this.resumeDeck(deck.name),
      enable: () => this.enableDeck(deck.name),
      disable: () => this.disableDeck(deck.name),

      // 🃏 Gerenciamento de cartas
      addCard: (cardName, cardFunction, options = {}) =>
        this.addCardToDeck(deck.name, cardName, cardFunction, options),
      removeCard: (cardName) => this.removeCardFromDeck(deck.name, cardName),
      replaceCard: (cardName, newCard) =>
        this.replaceCardInDeck(deck.name, cardName, newCard),
      reorderCards: (newOrder) => this.reorderDeckCards(deck.name, newOrder),

      // 📊 Informações e métricas - serão definidas pelo DeckEngine principal
      getMatches: null,
      getStatus: null,
      getStats: null,

      // 🎯 Eventos
      on: (event, handler) =>
        this.eventSystem.onDeckEvent(deck.name, event, handler),
      off: (event, handler) =>
        this.eventSystem.offDeckEvent(deck.name, event, handler),

      // 🔄 Utilitários
      clone: (newName) => this.cloneDeck(deck.name, newName),
      export: () => this.exportDeck(deck.name),
    };

    return proxy;
  }

  addCardToDeck(deckName, cardName, cardFunction, options = {}) {
    const deck = this.decks.get(deckName);
    if (!deck) throw new Error(`Deck "${deckName}" não encontrado`);

    const card = {
      name: cardName,
      play: cardFunction,
      description: options.description || "",
      cost: options.cost || 1,
      type: options.type || "action",
      ...options,
    };

    deck.cards.push(card);
    this.eventSystem.emit("deck:card:added", { deckName, cardName, card });
  }

  removeCardFromDeck(deckName, cardName) {
    const deck = this.decks.get(deckName);
    if (!deck) throw new Error(`Deck "${deckName}" não encontrado`);

    const index = deck.cards.findIndex((card) => card.name === cardName);
    if (index === -1)
      throw new Error(`Carta "${cardName}" não encontrada no deck`);

    const removedCard = deck.cards.splice(index, 1)[0];
    this.eventSystem.emit("deck:card:removed", {
      deckName,
      cardName,
      card: removedCard,
    });
  }

  replaceCardInDeck(deckName, cardName, newCard) {
    const deck = this.decks.get(deckName);
    if (!deck) throw new Error(`Deck "${deckName}" não encontrado`);

    const index = deck.cards.findIndex((card) => card.name === cardName);
    if (index === -1)
      throw new Error(`Carta "${cardName}" não encontrada no deck`);

    deck.cards[index] = Utils.normalizeCards([newCard])[0];
    this.eventSystem.emit("deck:card:replaced", {
      deckName,
      cardName,
      newCard,
    });
  }

  reorderDeckCards(deckName, newOrder) {
    const deck = this.decks.get(deckName);
    if (!deck) throw new Error(`Deck "${deckName}" não encontrado`);

    if (newOrder.length !== deck.cards.length) {
      throw new Error("Nova ordem deve ter o mesmo número de cartas");
    }

    deck.cards = newOrder.map((index) => deck.cards[index]);
    this.eventSystem.emit("deck:cards:reordered", { deckName, newOrder });
  }

  enableDeck(deckName) {
    const deck = this.decks.get(deckName);
    if (!deck) throw new Error(`Deck "${deckName}" não encontrado`);

    deck.enabled = true;
    this.eventSystem.emit("deck:enabled", { deckName });
  }

  disableDeck(deckName) {
    const deck = this.decks.get(deckName);
    if (!deck) throw new Error(`Deck "${deckName}" não encontrado`);

    deck.enabled = false;
    this.eventSystem.emit("deck:disabled", { deckName });
  }

  pauseDeck(deckName) {
    const deck = this.decks.get(deckName);
    if (!deck) throw new Error(`Deck "${deckName}" não encontrado`);

    deck.paused = true;
    this.eventSystem.emit("deck:paused", { deckName });
  }

  resumeDeck(deckName) {
    const deck = this.decks.get(deckName);
    if (!deck) throw new Error(`Deck "${deckName}" não encontrado`);

    deck.paused = false;
    this.eventSystem.emit("deck:resumed", { deckName });
  }

  cloneDeck(deckName, newName) {
    const deck = this.decks.get(deckName);
    if (!deck) throw new Error(`Deck "${deckName}" não encontrado`);

    const clonedConfig = JSON.parse(JSON.stringify(deck));
    clonedConfig.name = newName;
    clonedConfig.title = `${deck.title} (Clone)`;
    clonedConfig.created = new Date().toISOString();

    return this.createDeck(newName, clonedConfig);
  }

  exportDeck(deckName) {
    const deck = this.decks.get(deckName);
    if (!deck) throw new Error(`Deck "${deckName}" não encontrado`);

    return {
      ...deck,
      exportedAt: new Date().toISOString(),
      exportedBy: "deck-engine",
    };
  }

  importDeck(deckData) {
    const { name, ...config } = deckData;
    return this.createDeck(name, config);
  }

  registerTrigger(deckName, trigger) {
    this.triggers.set(deckName, trigger);
    this.eventSystem.emit("deck:trigger:registered", { deckName, trigger });
  }

  configureDeck(deckName, config) {
    const deck = this.decks.get(deckName);
    if (!deck) throw new Error(`Deck "${deckName}" não encontrado`);

    Object.assign(deck, config);
    this.eventSystem.emit("deck:configured", { deckName, config });
  }

  addDeckMiddleware(deckName, middleware) {
    const deck = this.decks.get(deckName);
    if (!deck) throw new Error(`Deck "${deckName}" não encontrado`);

    deck.middleware.push(middleware);
    this.eventSystem.emit("deck:middleware:added", { deckName, middleware });
  }

  getAllDecks() {
    return Array.from(this.decks.values());
  }

  getDeckNames() {
    return Array.from(this.decks.keys());
  }

  getDeckCount() {
    return this.decks.size;
  }

  getEnabledDecks() {
    return Array.from(this.decks.values()).filter(
      (deck) => deck.enabled !== false
    );
  }

  clear() {
    this.decks.clear();
    this.triggers.clear();
  }
}

export default DeckSystem;
