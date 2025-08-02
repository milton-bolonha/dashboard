/**
 * 🏟️ Sistema de Arenas (Filas) do DeckEngine
 */

class ArenaSystem {
  constructor() {
    this.arenas = new Map();
  }

  initializeArena(name, config = {}) {
    if (this.arenas.has(name)) return;

    const arena = {
      name,
      concurrencyLimit: config.concurrencyLimit || 10,
      priority: config.priority || 0,
      running: new Set(),
      waiting: [],
      paused: false,
      stats: {
        total: 0,
        completed: 0,
        failed: 0,
        victories: 0,
        defeats: 0,
      },
    };

    this.arenas.set(name, arena);
    return arena;
  }

  getArena(name) {
    return this.arenas.get(name);
  }

  enqueueMatch(arenaName, matchId) {
    const arena = this.arenas.get(arenaName);
    if (!arena) {
      throw new Error(`Arena "${arenaName}" não encontrada`);
    }

    arena.waiting.push(matchId);
    arena.stats.total++;

    return {
      arena: arena.name,
      position: arena.waiting.length,
      totalWaiting: arena.waiting.length,
    };
  }

  getNextMatch(arenaName) {
    const arena = this.arenas.get(arenaName);
    if (!arena || arena.paused) return null;

    if (
      arena.waiting.length > 0 &&
      arena.running.size < arena.concurrencyLimit
    ) {
      const matchId = arena.waiting.shift();
      arena.running.add(matchId);
      return matchId;
    }

    return null;
  }

  completeMatch(arenaName, matchId, isVictory = true) {
    const arena = this.arenas.get(arenaName);
    if (!arena) return;

    arena.running.delete(matchId);
    arena.stats.completed++;

    if (isVictory) {
      arena.stats.victories++;
    } else {
      arena.stats.defeats++;
    }
  }

  pauseArena(arenaName) {
    const arena = this.arenas.get(arenaName);
    if (arena) {
      arena.paused = true;
    }
  }

  resumeArena(arenaName) {
    const arena = this.arenas.get(arenaName);
    if (arena) {
      arena.paused = false;
    }
  }

  getArenaStatus(arenaName) {
    const arena = this.arenas.get(arenaName);
    if (!arena) return null;

    return {
      name: arena.name,
      paused: arena.paused,
      waiting: arena.waiting.length,
      running: arena.running.size,
      concurrencyLimit: arena.concurrencyLimit,
      priority: arena.priority,
      stats: arena.stats,
    };
  }

  getAllArenas() {
    return Array.from(this.arenas.entries()).map(([name, arena]) => ({
      name,
      paused: arena.paused,
      waiting: arena.waiting.length,
      running: arena.running.size,
      concurrencyLimit: arena.concurrencyLimit,
      priority: arena.priority,
      stats: arena.stats,
    }));
  }

  canProcessMore(arenaName) {
    const arena = this.arenas.get(arenaName);
    if (!arena || arena.paused) return false;

    return (
      arena.waiting.length > 0 && arena.running.size < arena.concurrencyLimit
    );
  }

  getWaitingMatches(arenaName) {
    const arena = this.arenas.get(arenaName);
    return arena ? [...arena.waiting] : [];
  }

  getRunningMatches(arenaName) {
    const arena = this.arenas.get(arenaName);
    return arena ? Array.from(arena.running) : [];
  }

  removeMatchFromQueue(arenaName, matchId) {
    const arena = this.arenas.get(arenaName);
    if (!arena) return false;

    const index = arena.waiting.indexOf(matchId);
    if (index > -1) {
      arena.waiting.splice(index, 1);
      return true;
    }

    return arena.running.delete(matchId);
  }

  getArenaNames() {
    return Array.from(this.arenas.keys());
  }

  getArenaCount() {
    return this.arenas.size;
  }

  clear() {
    this.arenas.clear();
  }
}

module.exports = ArenaSystem;
