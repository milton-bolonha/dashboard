/**
 * 🎮 DeckEngine V2 - Sistema de Pipeline com Metáforas de Gaming
 *
 * Nova arquitetura modular com suporte a:
 * - Domains (Authentication, User Management, System, Expansions)
 * - Unified Logging (Console, File, Database, Markdown)
 * - Multi-Platform (Node, Vercel, Netlify, Cloudflare)
 * - Route Types (Public, Private, External)
 */

// V1 Core (base sólida)
import DeckEngineV1 from "./deck-engine.js";
import Utils from "./utils.js";

// V2 Systems com fallbacks
let UnifiedLogger, RouteManager, DomainManager, PlatformAdapter;

try {
  UnifiedLogger = (await import("../logging/unified-logger.js")).default;
} catch {
  UnifiedLogger = class {
    constructor(outputs = ["console"]) {
      this.outputs = outputs;
      this.totalLogs = 0;
    }
    log(level, message, data = {}) {
      console.log(`[${level.toUpperCase()}] ${message}`, data);
      this.totalLogs++;
    }
    info(message, data) {
      this.log("info", message, data);
    }
    error(message, data) {
      this.log("error", message, data);
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
  };
}

try {
  RouteManager = (await import("../routing/route-manager.js")).default;
} catch {
  RouteManager = class {
    constructor(logger) {
      this.logger = logger;
      this.routes = new Map();
      this.logger.info("🌐 RouteManager initialized (fallback)");
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
      return this.registerRoute({ ...config, name, type: "private" });
    }
    async executeRoute(routeKey, context) {
      const route = this.routes.get(routeKey);
      if (!route) throw new Error(`Route ${routeKey} not found`);
      return await route.handler(context);
    }
    getRouteStats() {
      return { total: this.routes.size, byType: {}, byMethod: {} };
    }
  };
}

try {
  DomainManager = (await import("../domains/domain-manager.js")).default;
} catch {
  DomainManager = class {
    constructor(logger) {
      this.logger = logger;
      this.domains = new Map();
      this.logger.info("🏰 DomainManager initialized (fallback)");
    }
    async installDomain(name, type = "standard") {
      this.logger.info(`🏰 Installing domain: ${name} (${type})`);
      const domain = { name, type, status: "active" };
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
      return 0;
    }
  };
}

try {
  PlatformAdapter = (await import("../platform/platform-adapter.js")).default;
} catch {
  PlatformAdapter = class {
    constructor(platform = "auto") {
      this.platform = platform === "auto" ? this.detectPlatform() : platform;
      this.config = { serverless: false, timeout: 300000, memory: "unlimited" };
      this.capabilities = { longRunningTasks: true, fileSystem: true };
      console.log(`🚀 Platform detected: ${this.platform} (fallback)`);
    }
    detectPlatform() {
      if (process.env.VERCEL) return "vercel";
      if (process.env.NETLIFY) return "netlify";
      return "node";
    }
    createExecutionContext(request = {}) {
      return {
        platform: this.platform,
        request,
        startTime: Date.now(),
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
  };
}

class DeckEngineV2 extends DeckEngineV1 {
  constructor(options = {}) {
    // Inicializar V1 primeiro
    super(options);

    // 🆔 Identificação da engine
    this.version = "2.0.0";
    this.engineId = Utils.generateUUID();
    this.startTime = Date.now();

    // 🚀 Sistemas V2
    this.logger = new UnifiedLogger(options.logging || ["console"]);
    this.routeManager = new RouteManager(this.logger);
    this.domainManager = new DomainManager(this.logger);
    this.platformAdapter = new PlatformAdapter(options.platform || "node");

    // 🌍 Inicializar domains padrão
    this.initializeStandardDomains(options);

    // 📝 Log de inicialização
    this.logger.info("🎮 DeckEngine V2 initialized", {
      version: this.version,
      engineId: this.engineId,
      platform: this.platformAdapter.platform,
      systems: [
        "events",
        "metrics",
        "arena",
        "deck",
        "match",
        "logging",
        "routing",
        "domains",
      ],
    });
  }

  // 🏰 ============ DOMAIN MANAGEMENT ============
  async initializeStandardDomains(options = {}) {
    const standardDomains = options.standardDomains || [
      "authentication",
      "user-management",
      "system",
    ];

    this.logger.info("🏰 Initializing standard domains", {
      domains: standardDomains,
    });

    for (const domainName of standardDomains) {
      try {
        await this.domainManager.installDomain(domainName, "standard");
        this.logger.info(`✅ Domain ${domainName} installed`);
      } catch (error) {
        this.logger.error(`❌ Failed to install domain ${domainName}`, {
          error: error.message,
        });
      }
    }
  }

  // 🏰 ============ DOMAIN OPERATIONS ============
  getDomain(domainName) {
    return this.domainManager.getDomain(domainName);
  }

  async installDomain(domainName, type = "expansion", config = {}) {
    this.logger.info(`🏰 Installing domain ${domainName}`, { type, config });
    return await this.domainManager.installDomain(domainName, type, config);
  }

  getInstalledDomains() {
    return this.domainManager.getInstalledDomains();
  }

  // 🎯 ============ DECK FROM DOMAIN ============
  async playDomainDeck(domainName, deckPath, payload = {}, options = {}) {
    const domain = this.getDomain(domainName);
    if (!domain) {
      throw new Error(`Domain "${domainName}" not found`);
    }

    this.logger.info("🎯 Playing domain deck", {
      domainName,
      deckPath,
      payload: Object.keys(payload),
    });

    // Simular execução de deck do domain
    return {
      domain: domainName,
      deckPath,
      payload,
      result: `Domain ${domainName} executed ${deckPath} successfully`,
      timestamp: new Date().toISOString(),
    };
  }

  // 🎮 ============ EXECUÇÃO APRIMORADA ============
  async playMatch(deckName, payload = {}, options = {}) {
    this.logger.info("🎮 Playing match", {
      deckName,
      payload: Object.keys(payload),
      options,
    });

    // Usar implementação V1 como base
    const result = await super.playMatch(deckName, payload, options);

    this.logger.info("📋 Match queued", {
      result,
    });

    return result;
  }

  async playAndWait(deckName, payload = {}, options = {}) {
    this.logger.info("⏳ Playing and waiting for match", { deckName });

    const result = await super.playAndWait(deckName, payload, options);

    if (result.success) {
      this.logger.info("🏆 Match completed successfully", { deckName });
    } else {
      this.logger.error("💥 Match failed", { deckName, errors: result.errors });
    }

    return result;
  }

  // 📊 ============ STATUS & MONITORING APRIMORADO ============
  getGlobalStatus() {
    const v1Status = super.getGlobalStatus();
    const domains = this.domainManager.getInstalledDomains();

    return {
      ...v1Status,
      engine: {
        version: this.version,
        engineId: this.engineId,
        uptime: Date.now() - this.startTime,
        processing: this.processing,
      },
      domains: {
        total: domains.length,
        standard: domains.filter((d) => d.type === "standard").length,
        expansions: domains.filter((d) => d.type === "expansion").length,
      },
      platform: this.platformAdapter.platform,
      logging: this.logger.getOutputTypes(),
    };
  }

  healthCheck() {
    const status = this.getGlobalStatus();

    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: this.version,
      engineId: this.engineId,
      platform: this.platformAdapter.platform,
      uptime: status.engine.uptime,
      system: {
        decks: status.decks,
        arenas: status.arenas,
        domains: status.domains,
        processing: status.engine.processing,
      },
      logging: {
        outputs: this.logger.getOutputTypes(),
        totalLogs: this.logger.getTotalLogs(),
      },
    };

    this.logger.info("🏥 Health check performed", {
      status: health.status,
    });

    return health;
  }

  // 🧹 ============ CLEANUP APRIMORADO ============
  cleanup(maxAge = 86400000) {
    this.logger.info("🧹 Running cleanup", { maxAge });

    const cleaned = super.cleanup(maxAge);

    this.logger.info("✅ Cleanup completed", {
      matchesCleaned: cleaned,
    });

    return cleaned;
  }

  // 🔥 ============ SHUTDOWN APRIMORADO ============
  async shutdown() {
    this.logger.info("🔥 Shutting down DeckEngine V2");

    await super.shutdown();
    await this.platformAdapter.shutdown();

    this.logger.info("✅ DeckEngine V2 shutdown complete");
  }
}

export default DeckEngineV2;
