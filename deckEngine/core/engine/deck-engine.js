/**
 * 🎮 DeckEngine - Sistema Completo e Unificado
 *
 * Engine único que combina todas as funcionalidades:
 * - Pipeline execution
 * - Domains, Logging, Routes, Platform Adapters
 * - Multi-Platform Support
 * - Unified Architecture
 */

const Utils = require("./utils");
const EventSystem = require("./events");
const MetricsSystem = require("./metrics");
const ArenaSystem = require("./arena");
const DeckSystem = require("./deck");
const MatchSystem = require("./match");

// ============ SISTEMAS INTEGRADOS ============

class IntegratedLogger {
  constructor(outputs = ["console"]) {
    this.outputs = outputs;
    this.totalLogs = 0;
  }

  log(level, message, data = {}) {
    console.log(
      `[${level.toUpperCase()}] ${message}`,
      Object.keys(data).length > 0 ? data : ""
    );
    this.totalLogs++;
  }

  info(message, data) {
    this.log("info", message, data);
  }
  error(message, data) {
    this.log("error", message, data);
  }
  warn(message, data) {
    this.log("warn", message, data);
  }
  debug(message, data) {
    this.log("debug", message, data);
  }

  getTotalLogs() {
    return this.totalLogs;
  }
  getOutputTypes() {
    return this.outputs;
  }
  getLogStats() {
    return { total: this.totalLogs, outputs: this.outputs };
  }
}

class RouteManager {
  constructor(logger) {
    this.logger = logger;
    this.routes = new Map();
    this.logger.info("🌐 RouteManager initialized");
  }

  registerRoute(config) {
    const key = `${config.type || "public"}:${config.name}:${
      config.method || "GET"
    }`;
    this.routes.set(key, config);
    return key;
  }

  registerPublicRoute(name, config) {
    return this.registerRoute({ ...config, name, type: "public" });
  }

  registerPrivateRoute(name, config) {
    return this.registerRoute({ ...config, name, type: "private", auth: true });
  }

  async executeRoute(routeKey, context) {
    const route = this.routes.get(routeKey);
    if (!route) throw new Error(`Route ${routeKey} not found`);
    if (route.auth && !context.authenticated)
      throw new Error("Authentication required");
    return await route.handler(context);
  }

  getRouteStats() {
    return { total: this.routes.size, byType: {}, byMethod: {} };
  }
}

class DomainManager {
  constructor(logger) {
    this.logger = logger;
    this.domains = new Map();
    this.logger.info("🏰 DomainManager initialized");
  }

  async installDomain(name, type = "standard") {
    this.logger.info(`🏰 Installing domain: ${name} (${type})`);
    const domain = { name, type, status: "active", installedAt: new Date() };
    this.domains.set(name, domain);
    return domain;
  }

  getDomain(name) {
    return this.domains.get(name);
  }
  getInstalledDomains() {
    return Array.from(this.domains.values());
  }

  async cleanup() {
    const before = this.domains.size;
    // Cleanup logic here if needed
    return { removed: 0, remaining: before };
  }
}

class PlatformAdapter {
  constructor(platform = "auto") {
    this.platform = platform === "auto" ? this.detectPlatform() : platform;
    this.config = {
      serverless: this.platform !== "node",
      timeout: 300000,
      memory: "unlimited",
    };
    this.capabilities = {
      longRunningTasks: this.platform === "node",
      fileSystem: true,
    };
    console.log(`🚀 Platform detected: ${this.platform}`);
  }

  detectPlatform() {
    if (process.env.VERCEL) return "vercel";
    if (process.env.NETLIFY) return "netlify";
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) return "lambda";
    return "node";
  }

  createExecutionContext(request = {}) {
    return {
      platform: this.platform,
      request,
      startTime: Date.now(),
      serverless: this.config.serverless,
    };
  }

  getMemoryUsage() {
    if (process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024),
      };
    }
    return null;
  }

  checkResourceLimits() {
    return [];
  }
  async shutdown() {
    return true;
  }
}

// ============ ENGINE PRINCIPAL ============

class DeckEngine {
  constructor(options = {}) {
    // 🎯 Estados das partidas e cartas
    this.MATCH_STATES = {
      WAITING: "waiting",
      QUEUED: "queued",
      PLAYING: "playing",
      VICTORY: "victory",
      DEFEAT: "defeat",
      PAUSED: "paused",
      CANCELLED: "cancelled",
      CRASHED: "crashed",
      TIMED_OUT: "timed_out",
      EXPIRED: "expired",
    };

    this.CARD_STATES = {
      IN_HAND: "in_hand",
      PLAYING: "playing",
      PLAYED: "played",
      FAILED: "failed",
      DISCARDED: "discarded",
    };

    // 🏗️ Sistemas integrados
    this.logger = new IntegratedLogger(options.logging || ["console"]);
    this.routeManager = new RouteManager(this.logger);
    this.domainManager = new DomainManager(this.logger);
    this.platformAdapter = new PlatformAdapter(options.platform || "auto");

    // 🏗️ Sistemas core
    this.eventSystem = new EventSystem(options.enableEvents !== false);
    this.metricsSystem = new MetricsSystem(options.enableMetrics !== false);
    this.arenaSystem = new ArenaSystem();
    this.deckSystem = new DeckSystem(this.eventSystem);
    this.matchSystem = new MatchSystem(
      this.eventSystem,
      this.metricsSystem,
      this.MATCH_STATES,
      this.CARD_STATES
    );

    // 🎪 Arena principal
    this.arenaSystem.initializeArena("main", {
      concurrencyLimit: options.concurrencyLimit || 10,
      priority: 0,
    });

    // ⚡ Engine state
    this.version = "2.1.0";
    this.engineId = `engine-${Date.now()}`;
    this.startTime = Date.now();
    this.processing = false;
    this.processInterval = null;

    // 🧹 Limpeza automática
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, options.cleanupInterval || 300000);

    // 🏰 Inicializar domains padrão
    this.initializeStandardDomains(options);

    this.logger.info("🎮 DeckEngine initialized", {
      version: this.version,
      platform: this.platformAdapter.platform,
      domains: this.domainManager.getInstalledDomains().length,
    });

    this.eventSystem.emit("engine:initialized", {
      version: this.version,
      systems: [
        "events",
        "metrics",
        "arena",
        "deck",
        "match",
        "domain",
        "route",
        "platform",
      ],
    });
  }

  // 🏰 ============ DOMAIN METHODS ============
  async initializeStandardDomains(options = {}) {
    const domains = options.standardDomains || [
      "authentication",
      "user-management",
      "system",
    ];

    for (const domain of domains) {
      try {
        await this.domainManager.installDomain(domain, "standard");
      } catch (error) {
        this.logger.error(`Failed to install domain ${domain}`, {
          error: error.message,
        });
      }
    }
  }

  getDomain(domainName) {
    return this.domainManager.getDomain(domainName);
  }

  async installDomain(domainName, type = "expansion", config = {}) {
    return await this.domainManager.installDomain(domainName, type, config);
  }

  getInstalledDomains() {
    return this.domainManager.getInstalledDomains();
  }

  async playDomainDeck(domainName, deckPath, payload = {}, options = {}) {
    const domain = this.getDomain(domainName);
    if (!domain) {
      throw new Error(`Domain "${domainName}" not found`);
    }

    this.logger.info("🎯 Playing domain deck", { domainName, deckPath });

    return {
      domain: domainName,
      deckPath,
      result: `Domain ${domainName} executed ${deckPath} successfully`,
      timestamp: new Date().toISOString(),
    };
  }

  // 🎴 ============ CRIAÇÃO DE DECKS ============
  createDeck(deckName, config = {}) {
    const deck = this.deckSystem.createDeck(deckName, config);

    // Inicializar arena se especificada
    if (deck.arena.name !== "main") {
      this.arenaSystem.initializeArena(deck.arena.name, {
        concurrencyLimit: deck.arena.concurrencyLimit,
        priority: deck.arena.priority,
      });
    }

    // Inicializar métricas do deck
    this.metricsSystem.initializeDeckStats(deckName);

    // Criar proxy enriquecido
    const proxy = this.deckSystem.createDeckProxy(deck);

    // Adicionar métodos do engine
    proxy.playMatch = (payload, options) =>
      this.playMatch(deckName, payload, options);
    proxy.playAndWait = (payload, options) =>
      this.playAndWait(deckName, payload, options);
    proxy.playMatches = (payloads, options) =>
      this.playMatches(deckName, payloads, options);
    proxy.getMatches = (options) =>
      this.matchSystem.getMatchesByDeck(deckName, options);
    proxy.getStatus = () => this.getDeckStatus(deckName);
    proxy.getStats = () => this.metricsSystem.getDeckStats(deckName);

    return proxy;
  }

  // 🎮 ============ EXECUÇÃO DE PARTIDAS ============
  async playMatch(deckName, payload = {}, options = {}) {
    this.logger.info("🎮 Playing match", { deckName });

    const deck = this.deckSystem.getDeck(deckName);
    if (!deck) throw new Error(`Deck "${deckName}" não encontrado`);
    if (!deck.enabled) throw new Error(`Deck "${deckName}" está desabilitado`);

    // Verificar idempotência
    const idempotencyKey =
      options.idempotencyKey ||
      (deck.idempotencyKey
        ? Utils.generateIdempotencyKey(deckName, payload)
        : null);

    if (idempotencyKey && this.matchSystem.checkIdempotency(idempotencyKey)) {
      this.eventSystem.emit("match:idempotent", { deckName, idempotencyKey });
      return { success: true, cached: true };
    }

    // Criar partida
    const matchId = options.matchId || Utils.generateUUID();
    const match = await this.matchSystem.createMatch(matchId, deck, payload, {
      ...options,
      idempotencyKey,
    });

    // Armazenar idempotência
    if (idempotencyKey) {
      this.matchSystem.storeIdempotency(
        idempotencyKey,
        match,
        deck.idempotencyKeyTTL
      );
    }

    // Colocar na fila
    this.arenaSystem.enqueueMatch(deck.arena.name, matchId);
    match.state = this.MATCH_STATES.QUEUED;

    this.eventSystem.emit("match:queued", {
      matchId,
      deckName,
      arenaName: deck.arena.name,
    });

    // Iniciar processamento se não estiver rodando
    if (!this.processing) {
      this.startProcessing();
    }

    return { matchId, queued: true, arena: deck.arena.name };
  }

  async playAndWait(deckName, payload = {}, options = {}) {
    this.logger.info("⏳ Playing and waiting", { deckName });

    const result = await this.playMatch(deckName, payload, options);

    if (result.cached) return result;

    const matchId = result.matchId;

    // Aguardar conclusão
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Timeout aguardando partida ${matchId}`));
      }, options.timeout || 60000);

      const checkResult = () => {
        const match = this.matchSystem.getMatch(matchId);
        if (!match) {
          clearTimeout(timeout);
          reject(new Error(`Partida ${matchId} não encontrada`));
          return;
        }

        if (Utils.isFinalState(match.state, this.MATCH_STATES)) {
          clearTimeout(timeout);

          if (match.state === this.MATCH_STATES.VICTORY) {
            this.logger.info("🏆 Match completed", { deckName });
            resolve({ success: true, result: match.result, match });
          } else {
            this.logger.error("💥 Match failed", { deckName });
            resolve({ success: false, errors: match.errors, match });
          }
        } else {
          setTimeout(checkResult, 100);
        }
      };

      checkResult();
    });
  }

  async playMatches(deckName, payloads, options = {}) {
    this.logger.info("🎯 Playing multiple matches", {
      deckName,
      count: payloads.length,
    });

    const promises = payloads.map((payload, index) =>
      this.playMatch(deckName, payload, {
        ...options,
        matchId: options.generateIds ? Utils.generateUUID() : undefined,
      })
    );

    if (options.waitAll) {
      const results = await Promise.all(promises);
      this.logger.info("✅ All matches completed", {
        deckName,
        completed: results.length,
      });

      // Aguardar todas as execuções
      const matchIds = results.filter((r) => r.matchId).map((r) => r.matchId);
      return await Promise.all(
        matchIds.map((matchId) => this.waitForMatch(matchId, options.timeout))
      );
    }

    return await Promise.all(promises);
  }

  async waitForMatch(matchId, timeout = 60000) {
    this.logger.info("⏳ Waiting for match", { matchId });

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error(`Timeout aguardando partida ${matchId}`));
      }, timeout);

      const checkResult = () => {
        const match = this.matchSystem.getMatch(matchId);
        if (!match) {
          clearTimeout(timeoutId);
          reject(new Error(`Partida ${matchId} não encontrada`));
          return;
        }

        if (Utils.isFinalState(match.state, this.MATCH_STATES)) {
          clearTimeout(timeoutId);
          this.logger.info("🏆 Match wait completed", { matchId });
          resolve({
            success: match.state === this.MATCH_STATES.VICTORY,
            result: match.result,
            errors: match.errors,
            match,
          });
        } else {
          setTimeout(checkResult, 100);
        }
      };

      checkResult();
    });
  }

  // ⚡ ============ PROCESSAMENTO ============
  async startProcessing() {
    if (this.processing) return;

    this.processing = true;
    this.eventSystem.emit("engine:processing:started");

    this.processInterval = setInterval(async () => {
      await this.processNextMatches();
    }, 100);
  }

  stopProcessing() {
    if (!this.processing) return;

    this.processing = false;
    if (this.processInterval) {
      clearInterval(this.processInterval);
      this.processInterval = null;
    }

    this.eventSystem.emit("engine:processing:stopped");
  }

  async processNextMatches() {
    const arenas = this.arenaSystem.getAllArenas();

    for (const arena of arenas) {
      if (!this.arenaSystem.canProcessMore(arena.name)) continue;

      const matchId = this.arenaSystem.getNextMatch(arena.name);
      if (!matchId) continue;

      const match = this.matchSystem.getMatch(matchId);
      if (!match) continue;

      const deck = this.deckSystem.getDeck(match.deckName);
      if (!deck || !deck.enabled || deck.paused) continue;

      // Processar em background
      this.processMatch(match, deck, arena.name).catch((error) => {
        console.error(`Erro processando partida ${matchId}:`, error);
      });
    }
  }

  async processMatch(match, deck, arenaName) {
    try {
      this.eventSystem.emit("match:started", {
        matchId: match.id,
        deckName: deck.name,
        arenaName,
      });

      const result = await this.matchSystem.playMatch(match, deck);

      // Completar na arena
      this.arenaSystem.completeMatch(arenaName, match.id, result.success);

      if (result.success) {
        this.eventSystem.emit("match:completed", {
          matchId: match.id,
          deckName: deck.name,
          result: result.result,
        });
      }
    } catch (error) {
      this.arenaSystem.completeMatch(arenaName, match.id, false);
      this.eventSystem.emit("match:error", {
        matchId: match.id,
        deckName: deck.name,
        error: error.message,
      });
    }
  }

  // 📊 ============ INFORMAÇÕES E CONTROLE ============
  getDeckStatus(deckName) {
    const deck = this.deckSystem.getDeck(deckName);
    if (!deck) return null;

    const matches = this.matchSystem.getMatchesByDeck(deckName);
    const arenaStatus = this.arenaSystem.getArenaStatus(deck.arena.name);

    return {
      name: deck.name,
      enabled: deck.enabled,
      paused: deck.paused,
      cardCount: deck.cards.length,
      matches: {
        total: matches.length,
        waiting: matches.filter((m) => m.state === this.MATCH_STATES.WAITING)
          .length,
        queued: matches.filter((m) => m.state === this.MATCH_STATES.QUEUED)
          .length,
        playing: matches.filter((m) => m.state === this.MATCH_STATES.PLAYING)
          .length,
        victories: matches.filter((m) => m.state === this.MATCH_STATES.VICTORY)
          .length,
        defeats: matches.filter((m) => m.state === this.MATCH_STATES.DEFEAT)
          .length,
      },
      arena: arenaStatus,
      stats: this.metricsSystem.getDeckStats(deckName),
    };
  }

  getGlobalStatus() {
    const domains = this.domainManager.getInstalledDomains();

    return {
      engine: {
        version: this.version,
        uptime: Date.now() - this.startTime,
        processing: this.processing,
      },
      decks: {
        total: this.deckSystem.getDeckCount(),
        enabled: this.deckSystem.getEnabledDecks().length,
        names: this.deckSystem.getDeckNames(),
      },
      arenas: this.arenaSystem.getAllArenas(),
      matches: {
        total: this.matchSystem.getAllMatches().length,
      },
      domains: {
        total: domains.length,
        standard: domains.filter((d) => d.type === "standard").length,
        expansions: domains.filter((d) => d.type === "expansion").length,
      },
      platform: this.platformAdapter.platform,
      logging: this.logger.getOutputTypes(),
      metrics: this.metricsSystem.getAllStats(),
      events: {
        enabled: this.eventSystem.enabled,
        handlers: this.eventSystem.getEventCount(),
      },
    };
  }

  healthCheck() {
    const status = this.getGlobalStatus();

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: this.version,
      platform: this.platformAdapter.platform,
      uptime: status.engine.uptime,
      system: {
        decks: status.decks || { total: 0 },
        domains: status.domains,
        processing: status.engine.processing,
      },
      logging: {
        outputs: this.logger.getOutputTypes(),
        totalLogs: this.logger.getTotalLogs(),
      },
      checks: {
        processing: this.processing ? "ok" : "stopped",
        decks: status.decks.total > 0 ? "ok" : "no_decks",
        arenas: status.arenas.length > 0 ? "ok" : "no_arenas",
        events: this.eventSystem.enabled ? "ok" : "disabled",
        metrics: this.metricsSystem.enabled ? "ok" : "disabled",
      },
    };

    // Determinar status geral
    const criticalIssues = Object.values(health.checks).filter(
      (check) => !["ok", "disabled"].includes(check)
    );

    if (criticalIssues.length > 0) {
      health.status = "degraded";
    }

    this.logger.info("🏥 Health check performed");
    return health;
  }

  // 🧹 ============ LIMPEZA E MANUTENÇÃO ============
  cleanup(maxAge = 86400000) {
    this.logger.info("🧹 Running cleanup");

    // 24h
    const results = {
      matches: this.matchSystem.cleanup(maxAge),
      timestamp: new Date().toISOString(),
    };

    this.eventSystem.emit("engine:cleanup", results);
    this.logger.info("✅ Cleanup completed", { cleaned: results });
    return results;
  }

  // 🎯 ============ EVENTOS GLOBAIS ============
  on(event, handler) {
    this.eventSystem.on(event, handler);
  }

  off(event, handler) {
    this.eventSystem.off(event, handler);
  }

  // 🔧 ============ UTILITÁRIOS ============
  getDeck(deckName) {
    return this.deckSystem.getDeck(deckName);
  }

  getAllDecks() {
    return this.deckSystem.getAllDecks();
  }

  getMatch(matchId) {
    return this.matchSystem.getMatch(matchId);
  }

  pauseArena(arenaName) {
    this.arenaSystem.pauseArena(arenaName);
  }

  resumeArena(arenaName) {
    this.arenaSystem.resumeArena(arenaName);
  }

  getMetrics() {
    return this.metricsSystem.getAllStats();
  }

  resetMetrics() {
    this.metricsSystem.reset();
  }

  // 🔄 ============ SHUTDOWN ============
  async shutdown() {
    this.logger.info("🔥 Shutting down DeckEngine");

    this.stopProcessing();

    // 🛑 FORÇAR limpeza de TODOS os timers
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    // 🛑 Limpar qualquer timer ativo
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    this.eventSystem.emit("engine:shutdown");
    this.eventSystem.clear();

    // Platform shutdown
    await this.platformAdapter.shutdown();

    // 🛑 GARANTIR que tudo pare
    this.processing = false;

    this.logger.info("✅ Shutdown complete");
  }
}

module.exports = DeckEngine;
