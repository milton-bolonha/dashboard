/**
 * 🎯 Sistema de Eventos do DeckEngine
 */

class EventSystem {
  constructor(enabled = true) {
    this.enabled = enabled;
    this.handlers = new Map();
  }

  emit(event, data = {}) {
    if (!this.enabled) return;

    const handlers = this.handlers.get(event) || [];
    handlers.forEach((handler) => {
      try {
        handler(data);
      } catch (error) {
        console.error(`Erro em handler do evento ${event}:`, error.message);
      }
    });
  }

  on(event, handler) {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, []);
    }
    this.handlers.get(event).push(handler);
  }

  off(event, handler) {
    const handlers = this.handlers.get(event) || [];
    const index = handlers.indexOf(handler);
    if (index > -1) {
      handlers.splice(index, 1);
    }
  }

  onDeckEvent(deckName, event, handler) {
    this.on(`deck:${deckName}:${event}`, handler);
  }

  offDeckEvent(deckName, event, handler) {
    this.off(`deck:${deckName}:${event}`, handler);
  }

  clear() {
    this.handlers.clear();
  }

  getEventCount() {
    return this.handlers.size;
  }

  getEvents() {
    return Array.from(this.handlers.keys());
  }
}

module.exports = EventSystem;
