/**
 * ⚔️ Sistema de Partidas (Matches) do DeckEngine
 */

const Utils = require("./utils");

class MatchSystem {
  constructor(eventSystem, metricsSystem, MATCH_STATES, CARD_STATES) {
    this.matches = new Map();
    this.idempotencyCache = new Map();
    this.eventSystem = eventSystem;
    this.metricsSystem = metricsSystem;
    this.MATCH_STATES = MATCH_STATES;
    this.CARD_STATES = CARD_STATES;
  }

  async createMatch(matchId, deck, payload, options = {}) {
    const match = {
      id: matchId,
      deckName: deck.name,
      state: this.MATCH_STATES.WAITING,
      payload,
      result: null,

      // Informações da partida
      player: options.player || "anonymous",
      tags: options.tags || [],
      metadata: options.metadata || {},

      // Controle de tempo
      createdAt: new Date().toISOString(),
      scheduledAt: options.scheduledAt || new Date().toISOString(),
      startedAt: null,
      endedAt: null,
      duration: null,

      // Cartas e jogadas
      cards: [...deck.cards],
      cardsPlayed: [],
      currentCardIndex: 0,

      // Controle de retry e erro
      attempts: 0,
      errors: [],
      retryCount: 0,

      // Logs da partida
      logs: [],

      // Configurações
      options,
      idempotencyKey: options.idempotencyKey,
    };

    this.matches.set(matchId, match);

    this.logToMatch(match, "info", "Partida criada", {
      deckName: deck.name,
      cardCount: deck.cards.length,
    });

    return match;
  }

  getMatch(matchId) {
    return this.matches.get(matchId);
  }

  async playMatch(match, deck) {
    const startTime = Date.now();

    try {
      match.state = this.MATCH_STATES.PLAYING;
      match.startedAt = new Date().toISOString();
      match.attempts++;

      this.logToMatch(match, "info", "Iniciando partida", {
        attempt: match.attempts,
        cardCount: match.cards.length,
      });

      // Executar init se existir
      if (deck.init) {
        await deck.init(this.createMatchContext(match, deck));
      }

      // Executar função principal ou sequência de cartas
      let result;
      if (deck.play) {
        result = await deck.play(this.createMatchContext(match, deck));
      } else if (match.cards.length > 0) {
        result = await this.playCards(match, deck);
      } else {
        result = match.payload; // Sem lógica específica
      }

      // Executar cleanup se existir
      if (deck.cleanup) {
        await deck.cleanup(this.createMatchContext(match, deck));
      }

      match.result = result;
      match.state = this.MATCH_STATES.VICTORY;
      match.endedAt = new Date().toISOString();
      match.duration = Date.now() - startTime;

      // Callback de vitória
      if (deck.onVictory) {
        await deck.onVictory(this.createMatchContext(match, deck));
      }

      this.logToMatch(match, "info", "Partida concluída com vitória", {
        duration: match.duration,
        cardsPlayed: match.cardsPlayed.length,
      });

      // Atualizar métricas globais
      this.metricsSystem.updateMetrics(
        match,
        deck,
        this.MATCH_STATES,
        this.CARD_STATES
      );
      this.eventSystem.emit("match:victory", {
        matchId: match.id,
        deckName: deck.name,
        match,
      });

      return { success: true, result };
    } catch (error) {
      await this.handleMatchError(match, deck, error, startTime);
      return { success: false, error };
    }
  }

  async playCards(match, deck) {
    const context = this.createMatchContext(match, deck);
    const results = [];

    for (let i = 0; i < match.cards.length; i++) {
      const card = match.cards[i];
      match.currentCardIndex = i;

      try {
        this.logToMatch(match, "info", `Jogando carta: ${card.name}`, {
          cardIndex: i,
          cardName: card.name,
        });

        const cardResult = await this.playCard(match, card, context);

        match.cardsPlayed.push({
          name: card.name,
          index: i,
          state: this.CARD_STATES.PLAYED,
          result: cardResult,
          playedAt: new Date().toISOString(),
        });

        results.push(cardResult);

        // Callback de carta jogada
        if (deck.onCardPlayed) {
          await deck.onCardPlayed(context, card, cardResult);
        }
      } catch (error) {
        match.cardsPlayed.push({
          name: card.name,
          index: i,
          state: this.CARD_STATES.FAILED,
          error: error.message,
          playedAt: new Date().toISOString(),
        });

        throw error; // Re-throw para ser tratado no nível da partida
      }
    }

    return results;
  }

  async playCard(match, card, context) {
    if (typeof card === "function") {
      return await card(context);
    } else if (typeof card === "object" && card.play) {
      return await card.play(context);
    } else {
      throw new Error(`Carta inválida: ${card.name || "sem nome"}`);
    }
  }

  createMatchContext(match, deck) {
    return {
      // Informações da partida
      matchId: match.id,
      deckName: deck.name,
      payload: match.payload,
      metadata: match.metadata,

      // Controles
      log: (level, message, data) =>
        this.logToMatch(match, level, message, data),

      // Utilitários
      wait: (ms) => Utils.delay(ms),
      waitUntil: (condition, options) => Utils.waitUntil(condition, options),

      // Informações das cartas
      currentCard: match.currentCardIndex,
      cardsPlayed: match.cardsPlayed,
      totalCards: match.cards.length,

      // Dados do player
      player: match.player || "anonymous",

      // Funções de controle
      pauseMatch: () => this.pauseMatch(match.id),
      resumeMatch: () => this.resumeMatch(match.id),
      cancelMatch: () => this.cancelMatch(match.id),
    };
  }

  async handleMatchError(match, deck, error, startTime) {
    match.errors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      attempt: match.attempts,
    });

    this.logToMatch(match, "error", `Erro na partida: ${error.message}`, {
      attempt: match.attempts,
      error: error.message,
    });

    // Verificar se deve tentar novamente
    const maxRetries = deck.retry.maxAttempts;
    if (match.retryCount < maxRetries) {
      match.retryCount++;
      match.state = this.MATCH_STATES.QUEUED;

      const retryDelay = Utils.calculateRetryDelay(
        match.retryCount,
        deck.retry
      );

      this.logToMatch(match, "info", `Tentando novamente em ${retryDelay}ms`, {
        retryCount: match.retryCount,
        maxRetries,
      });

      // Retorno para reprocessamento
      return { shouldRetry: true, delay: retryDelay };
    }

    // Falha definitiva
    match.state = this.MATCH_STATES.DEFEAT;
    match.endedAt = new Date().toISOString();
    match.duration = Date.now() - startTime;

    // Callback de derrota
    if (deck.onDefeat) {
      try {
        await deck.onDefeat(this.createMatchContext(match, deck));
      } catch (callbackError) {
        this.logToMatch(
          match,
          "error",
          `Erro no callback onDefeat: ${callbackError.message}`
        );
      }
    }

    // Atualizar métricas globais
    this.metricsSystem.updateMetrics(
      match,
      deck,
      this.MATCH_STATES,
      this.CARD_STATES
    );
    this.eventSystem.emit("match:defeat", {
      matchId: match.id,
      deckName: deck.name,
      match,
    });

    this.logToMatch(match, "error", "Partida terminou em derrota", {
      duration: match.duration,
      totalAttempts: match.attempts,
      errors: match.errors.length,
    });

    return { shouldRetry: false };
  }

  pauseMatch(matchId) {
    const match = this.matches.get(matchId);
    if (!match) throw new Error(`Partida "${matchId}" não encontrada`);

    match.state = this.MATCH_STATES.PAUSED;
    this.logToMatch(match, "info", "Partida pausada");
  }

  resumeMatch(matchId) {
    const match = this.matches.get(matchId);
    if (!match) throw new Error(`Partida "${matchId}" não encontrada`);

    match.state = this.MATCH_STATES.QUEUED;
    this.logToMatch(match, "info", "Partida retomada");
  }

  cancelMatch(matchId) {
    const match = this.matches.get(matchId);
    if (!match) throw new Error(`Partida "${matchId}" não encontrada`);

    match.state = this.MATCH_STATES.CANCELLED;
    match.endedAt = new Date().toISOString();
    this.logToMatch(match, "info", "Partida cancelada");
  }

  logToMatch(match, level, message, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
    };

    match.logs.push(logEntry);
  }

  checkIdempotency(key) {
    return this.idempotencyCache.has(key);
  }

  storeIdempotency(key, match, ttl) {
    this.idempotencyCache.set(key, match);

    // Auto-limpeza após TTL
    setTimeout(() => {
      this.idempotencyCache.delete(key);
    }, ttl);
  }

  getMatchesByDeck(deckName, options = {}) {
    const matches = Array.from(this.matches.values()).filter(
      (match) => match.deckName === deckName
    );

    // Filtros opcionais
    if (options.state) {
      return matches.filter((match) => match.state === options.state);
    }

    if (options.limit) {
      return matches.slice(0, options.limit);
    }

    return matches.map((match) => ({
      id: match.id,
      state: match.state,
      createdAt: match.createdAt,
      duration: match.duration,
      cardsPlayed: match.cardsPlayed.length,
      attempts: match.attempts,
    }));
  }

  getAllMatches() {
    return Array.from(this.matches.values());
  }

  cleanup(maxAge = 86400000) {
    // 24h por padrão
    const now = Date.now();
    let cleaned = 0;

    // Limpar partidas antigas
    for (const [matchId, match] of this.matches.entries()) {
      const matchAge = now - new Date(match.createdAt).getTime();
      if (
        matchAge > maxAge &&
        Utils.isFinalState(match.state, this.MATCH_STATES)
      ) {
        this.matches.delete(matchId);
        cleaned++;
      }
    }

    return { cleaned };
  }
}

module.exports = MatchSystem;
