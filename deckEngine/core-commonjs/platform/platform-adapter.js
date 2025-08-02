/**
 * 🚀 Platform Adapter - DeckEngine V2
 *
 * Adapta o DeckEngine para diferentes plataformas:
 * - Node.js (traditional server)
 * - Vercel (serverless)
 * - Netlify (functions)
 * - Cloudflare Workers
 */

class PlatformAdapter {
  constructor(platform = "auto") {
    this.platform = platform === "auto" ? this.detectPlatform() : platform;
    this.config = this.getPlatformConfig();
    this.capabilities = this.getPlatformCapabilities();

    console.log(`🚀 Platform detected: ${this.platform}`);
  }

  // ============ PLATFORM DETECTION ============
  detectPlatform() {
    // Detectar plataforma automaticamente baseado em variáveis de ambiente
    if (process.env.VERCEL) return "vercel";
    if (process.env.NETLIFY) return "netlify";
    if (process.env.CLOUDFLARE_WORKERS) return "cloudflare";
    if (process.env.AWS_LAMBDA_FUNCTION_NAME) return "aws-lambda";
    return "node";
  }

  getPlatformConfig() {
    const configs = {
      node: {
        serverless: false,
        timeout: 300000, // 5 minutos
        memory: "unlimited",
        concurrency: 10,
        persistent: true,
        filesystem: true,
        environment: "server",
      },
      vercel: {
        serverless: true,
        timeout: 10000, // 10 segundos (hobby) / 60s (pro)
        memory: "1024mb",
        concurrency: 1,
        persistent: false,
        filesystem: false,
        environment: "serverless",
      },
      netlify: {
        serverless: true,
        timeout: 10000, // 10 segundos (free) / 26s (pro)
        memory: "1024mb",
        concurrency: 1,
        persistent: false,
        filesystem: false,
        environment: "serverless",
      },
      cloudflare: {
        serverless: true,
        timeout: 30000, // 30 segundos
        memory: "128mb",
        concurrency: 1,
        persistent: false,
        filesystem: false,
        environment: "edge",
      },
      "aws-lambda": {
        serverless: true,
        timeout: 900000, // 15 minutos
        memory: "3008mb",
        concurrency: 1,
        persistent: false,
        filesystem: true, // /tmp available
        environment: "serverless",
      },
    };

    return configs[this.platform] || configs.node;
  }

  getPlatformCapabilities() {
    return {
      // Capacidades baseadas na plataforma
      longRunningTasks: !this.config.serverless,
      fileSystem: this.config.filesystem,
      persistentMemory: this.config.persistent,
      backgroundJobs: !this.config.serverless,
      webSockets: this.platform === "node",

      // Limitações
      maxTimeout: this.config.timeout,
      maxMemory: this.config.memory,
      maxConcurrency: this.config.concurrency,
    };
  }

  // ============ PLATFORM-SPECIFIC ADAPTATIONS ============
  adaptDeckEngineConfig(originalConfig) {
    const adaptedConfig = { ...originalConfig };

    // Adaptar concorrência baseado na plataforma
    if (this.config.serverless) {
      adaptedConfig.concurrencyLimit = Math.min(
        adaptedConfig.concurrencyLimit || 10,
        this.config.concurrency
      );
    }

    // Adaptar timeout
    adaptedConfig.defaultTimeout = Math.min(
      adaptedConfig.defaultTimeout || 30000,
      this.config.timeout
    );

    // Adaptar logging baseado na plataforma
    if (this.config.serverless) {
      // Em serverless, preferir console e evitar file system
      adaptedConfig.logging = adaptedConfig.logging?.filter(
        (type) => type !== "file" && type !== "markdown"
      ) || ["console"];
    }

    // Adaptar cleanup interval
    if (this.config.serverless) {
      // Em serverless, cleanup mais frequente por causa da memória limitada
      adaptedConfig.cleanupInterval = Math.min(
        adaptedConfig.cleanupInterval || 300000,
        60000 // 1 minuto
      );
    }

    return adaptedConfig;
  }

  // ============ EXECUTION CONTEXT ============
  createExecutionContext(request = {}) {
    const context = {
      platform: this.platform,
      serverless: this.config.serverless,
      environment: this.config.environment,
      capabilities: this.capabilities,
      request: this.normalizeRequest(request),
      response: this.createResponseHelper(),
      startTime: Date.now(),
      requestId: this.generateRequestId(),
    };

    // Adicionar helpers específicos da plataforma
    switch (this.platform) {
      case "vercel":
        context.vercel = this.createVercelHelpers();
        break;
      case "netlify":
        context.netlify = this.createNetlifyHelpers();
        break;
      case "cloudflare":
        context.cloudflare = this.createCloudflareHelpers();
        break;
    }

    return context;
  }

  normalizeRequest(request) {
    // Normalizar request para diferentes plataformas
    return {
      method: request.method || "GET",
      url: request.url || "/",
      headers: request.headers || {},
      body: request.body || null,
      query: request.query || {},
      params: request.params || {},
      ip: request.ip || "unknown",
      userAgent: request.headers?.["user-agent"] || "unknown",
    };
  }

  createResponseHelper() {
    return {
      status: 200,
      headers: {},
      body: null,

      setStatus(code) {
        this.status = code;
        return this;
      },

      setHeader(name, value) {
        this.headers[name] = value;
        return this;
      },

      json(data) {
        this.headers["Content-Type"] = "application/json";
        this.body = JSON.stringify(data);
        return this;
      },

      text(data) {
        this.headers["Content-Type"] = "text/plain";
        this.body = data;
        return this;
      },
    };
  }

  // ============ PLATFORM-SPECIFIC HELPERS ============
  createVercelHelpers() {
    return {
      env: process.env.VERCEL_ENV,
      region: process.env.VERCEL_REGION,
      url: process.env.VERCEL_URL,

      isPreview: process.env.VERCEL_ENV === "preview",
      isProduction: process.env.VERCEL_ENV === "production",
    };
  }

  createNetlifyHelpers() {
    return {
      context: process.env.CONTEXT,
      branch: process.env.BRANCH,
      commitRef: process.env.COMMIT_REF,

      isDeploy: process.env.CONTEXT === "deploy-preview",
      isProduction: process.env.CONTEXT === "production",
    };
  }

  createCloudflareHelpers() {
    return {
      // Cloudflare Workers específicos
      runtime: "cloudflare-workers",

      // TODO: Adicionar helpers específicos do Cloudflare
    };
  }

  // ============ PERFORMANCE MONITORING ============
  measurePerformance(fn, name) {
    return async (...args) => {
      const start = process.hrtime.bigint();
      const result = await fn(...args);
      const end = process.hrtime.bigint();
      const duration = Number(end - start) / 1000000; // Convert to milliseconds

      // Log performance com contexto da plataforma
      console.log(`⚡ [${this.platform}] ${name}: ${duration.toFixed(2)}ms`);

      // Alertar se próximo dos limites da plataforma
      if (duration > this.config.timeout * 0.8) {
        console.warn(
          `⚠️ Performance warning: ${name} took ${duration.toFixed(
            2
          )}ms (near timeout limit)`
        );
      }

      return result;
    };
  }

  // ============ ERROR HANDLING ============
  handlePlatformError(error, context) {
    const platformError = {
      platform: this.platform,
      error: {
        message: error.message,
        stack: error.stack,
        code: error.code,
      },
      context: {
        requestId: context.requestId,
        duration: Date.now() - context.startTime,
        memory: this.getMemoryUsage(),
      },
      timestamp: new Date().toISOString(),
    };

    // Logging específico da plataforma
    if (this.config.serverless) {
      // Em serverless, log estruturado para melhor visibilidade
      console.error("Platform Error:", JSON.stringify(platformError, null, 2));
    } else {
      // Em servidor tradicional, log mais simples
      console.error(`❌ [${this.platform}] Error:`, error.message);
    }

    return platformError;
  }

  // ============ RESOURCE MONITORING ============
  getMemoryUsage() {
    if (typeof process !== "undefined" && process.memoryUsage) {
      const usage = process.memoryUsage();
      return {
        heapUsed: Math.round(usage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(usage.heapTotal / 1024 / 1024), // MB
        external: Math.round(usage.external / 1024 / 1024), // MB
        rss: Math.round(usage.rss / 1024 / 1024), // MB
      };
    }
    return null;
  }

  checkResourceLimits() {
    const memory = this.getMemoryUsage();
    const warnings = [];

    if (memory && this.config.memory !== "unlimited") {
      const maxMemoryMB = parseInt(this.config.memory);
      const usagePercent = (memory.heapUsed / maxMemoryMB) * 100;

      if (usagePercent > 80) {
        warnings.push(
          `High memory usage: ${usagePercent.toFixed(1)}% of ${maxMemoryMB}MB`
        );
      }
    }

    return warnings;
  }

  // ============ UTILITIES ============
  generateRequestId() {
    return `req-${this.platform}-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
  }

  // ============ LIFECYCLE ============
  async initialize() {
    console.log(`🔧 Initializing platform adapter for ${this.platform}`);

    // Verificar se a plataforma suporta os recursos necessários
    this.validatePlatformSupport();

    console.log(`✅ Platform adapter initialized`);
  }

  validatePlatformSupport() {
    const warnings = [];

    if (this.config.serverless && this.config.timeout < 10000) {
      warnings.push(
        "Very low timeout limit may cause issues with complex operations"
      );
    }

    if (!this.capabilities.fileSystem) {
      warnings.push("File system not available - file logging disabled");
    }

    if (warnings.length > 0) {
      console.warn(`⚠️ Platform warnings for ${this.platform}:`);
      warnings.forEach((warning) => console.warn(`  - ${warning}`));
    }
  }

  async shutdown() {
    console.log(`🔥 Shutting down platform adapter for ${this.platform}`);

    // Cleanup específico da plataforma se necessário

    console.log(`✅ Platform adapter shutdown complete`);
  }
}

module.exports = PlatformAdapter;
