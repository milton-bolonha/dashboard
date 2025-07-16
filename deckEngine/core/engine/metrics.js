/**
 * 📊 Sistema de Métricas do DeckEngine
 */

class MetricsSystem {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.data = {
      totalMatches: 0,
      totalVictories: 0,
      totalDefeats: 0,
      avgMatchDuration: 0,
      cardStats: new Map(),
      deckStats: new Map(),
    };
  }

  initializeDeckStats(deckName) {
    this.data.deckStats.set(deckName, {
      matches: 0,
      victories: 0,
      defeats: 0,
      avgDuration: 0,
      cardsPlayed: 0,
    });
  }

  updateMetrics(match, deck, MATCH_STATES, CARD_STATES) {
    if (!this.enabled) return;

    this.data.totalMatches++;

    if (match.state === MATCH_STATES.VICTORY) {
      this.data.totalVictories++;
    } else if (match.state === MATCH_STATES.DEFEAT) {
      this.data.totalDefeats++;
    }

    // Atualizar média de duração
    if (match.duration) {
      const total = this.data.totalMatches;
      this.data.avgMatchDuration =
        (this.data.avgMatchDuration * (total - 1) + match.duration) / total;
    }

    // Stats do deck
    const deckStats = this.data.deckStats.get(deck.name);
    if (deckStats) {
      deckStats.matches++;
      if (match.state === MATCH_STATES.VICTORY) deckStats.victories++;
      if (match.state === MATCH_STATES.DEFEAT) deckStats.defeats++;
      deckStats.cardsPlayed += match.cardsPlayed.length;

      if (match.duration) {
        deckStats.avgDuration =
          (deckStats.avgDuration * (deckStats.matches - 1) + match.duration) /
          deckStats.matches;
      }
    }

    // Stats das cartas
    match.cardsPlayed.forEach((cardPlayed) => {
      const cardName = cardPlayed.name;
      if (!this.data.cardStats.has(cardName)) {
        this.data.cardStats.set(cardName, {
          plays: 0,
          successes: 0,
          failures: 0,
          avgDuration: 0,
        });
      }

      const cardStats = this.data.cardStats.get(cardName);
      cardStats.plays++;

      if (cardPlayed.state === CARD_STATES.PLAYED) {
        cardStats.successes++;
      } else if (cardPlayed.state === CARD_STATES.FAILED) {
        cardStats.failures++;
      }
    });
  }

  getDeckStats(deckName) {
    return (
      this.data.deckStats.get(deckName) || {
        matches: 0,
        victories: 0,
        defeats: 0,
        avgDuration: 0,
        cardsPlayed: 0,
      }
    );
  }

  getCardStats(cardName) {
    return (
      this.data.cardStats.get(cardName) || {
        plays: 0,
        successes: 0,
        failures: 0,
        avgDuration: 0,
      }
    );
  }

  getAllStats() {
    return {
      ...this.data,
      cardStats: Object.fromEntries(this.data.cardStats),
      deckStats: Object.fromEntries(this.data.deckStats),
    };
  }

  reset() {
    this.data = {
      totalMatches: 0,
      totalVictories: 0,
      totalDefeats: 0,
      avgMatchDuration: 0,
      cardStats: new Map(),
      deckStats: new Map(),
    };
  }

  getTopCards(limit = 10) {
    return Array.from(this.data.cardStats.entries())
      .sort((a, b) => b[1].plays - a[1].plays)
      .slice(0, limit)
      .map(([name, stats]) => ({ name, ...stats }));
  }

  getTopDecks(limit = 10) {
    return Array.from(this.data.deckStats.entries())
      .sort((a, b) => b[1].matches - a[1].matches)
      .slice(0, limit)
      .map(([name, stats]) => ({ name, ...stats }));
  }
}

module.exports = MetricsSystem;
