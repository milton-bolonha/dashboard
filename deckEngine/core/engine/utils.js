/**
 * 🛠️ Utilitários do DeckEngine
 */

class Utils {
  static generateUUID() {
    return (
      "match-" + Date.now() + "-" + Math.random().toString(36).substr(2, 9)
    );
  }

  static generateIdempotencyKey(deckName, payload) {
    const payloadHash = JSON.stringify(payload);
    return `${deckName}-${btoa(payloadHash).slice(0, 16)}`;
  }

  static calculateRetryDelay(attempt, retryConfig) {
    const baseDelay = retryConfig.minTimeoutInMs;
    const maxDelay = retryConfig.maxTimeoutInMs;
    const factor = retryConfig.factor;

    let delay = baseDelay * Math.pow(factor, attempt - 1);
    delay = Math.min(delay, maxDelay);

    if (retryConfig.randomize) {
      delay = delay * (0.5 + Math.random() * 0.5); // Jitter de 50-100%
    }

    return Math.floor(delay);
  }

  static delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  static async waitUntil(condition, options = {}) {
    const timeout = options.timeout || 30000;
    const interval = options.interval || 1000;
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return true;
      }
      await Utils.delay(interval);
    }

    throw new Error("Timeout aguardando condição");
  }

  static isFinalState(state, MATCH_STATES) {
    return [
      MATCH_STATES.VICTORY,
      MATCH_STATES.DEFEAT,
      MATCH_STATES.CANCELLED,
      MATCH_STATES.CRASHED,
      MATCH_STATES.TIMED_OUT,
      MATCH_STATES.EXPIRED,
    ].includes(state);
  }

  static normalizeCards(cards) {
    return cards.map((card, index) => {
      if (typeof card === "function") {
        return {
          name: `card-${index}`,
          description: "",
          play: card,
          cost: 1,
          type: "action",
        };
      } else if (typeof card === "object") {
        return {
          name: card.name || `card-${index}`,
          description: card.description || "",
          play: card.play || card.action || card.run,
          cost: card.cost || 1,
          type: card.type || "action",
          conditions: card.conditions || null,
          ...card,
        };
      }
      throw new Error(`Carta inválida no índice ${index}`);
    });
  }
}

module.exports = Utils;
