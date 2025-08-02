/**
 * 🌐 Sistema de Routing - DeckEngine V2
 *
 * Gerencia rotas por tipo:
 * - Public: Acessíveis publicamente
 * - Private: Requerem autenticação
 * - External: Integrações com terceiros
 */

class RouteManager {
  constructor(logger) {
    this.logger = logger;
    this.routes = new Map();
    this.routeTypes = {
      PUBLIC: "public",
      PRIVATE: "private",
      EXTERNAL: "external",
    };

    this.logger.info("🌐 RouteManager initialized");
  }

  // ============ ROUTE REGISTRATION ============
  registerRoute(routeConfig) {
    const route = this.normalizeRoute(routeConfig);
    const routeKey = this.generateRouteKey(route);

    this.routes.set(routeKey, route);

    this.logger.info("🛣️ Route registered", {
      name: route.name,
      type: route.type,
      path: route.path,
      method: route.method,
    });

    return routeKey;
  }

  registerPublicRoute(name, config = {}) {
    return this.registerRoute({
      ...config,
      name,
      type: this.routeTypes.PUBLIC,
    });
  }

  registerPrivateRoute(name, config = {}) {
    return this.registerRoute({
      ...config,
      name,
      type: this.routeTypes.PRIVATE,
      auth: true,
    });
  }

  registerExternalRoute(name, config = {}) {
    return this.registerRoute({
      ...config,
      name,
      type: this.routeTypes.EXTERNAL,
    });
  }

  // ============ ROUTE MANAGEMENT ============
  getRoute(routeKey) {
    return this.routes.get(routeKey);
  }

  getRoutesByType(type) {
    return Array.from(this.routes.values()).filter(
      (route) => route.type === type
    );
  }

  getAllRoutes() {
    return Array.from(this.routes.values());
  }

  removeRoute(routeKey) {
    const route = this.routes.get(routeKey);
    if (route) {
      this.routes.delete(routeKey);
      this.logger.info("🗑️ Route removed", { routeKey, name: route.name });
      return true;
    }
    return false;
  }

  // ============ ROUTE EXECUTION ============
  async executeRoute(routeKey, context = {}) {
    const route = this.getRoute(routeKey);
    if (!route) {
      throw new Error(`Route ${routeKey} not found`);
    }

    this.logger.info("🚀 Executing route", {
      routeKey,
      name: route.name,
      type: route.type,
    });

    try {
      // Verificar autenticação se necessário
      if (route.auth && !context.authenticated) {
        throw new Error("Authentication required");
      }

      // Executar middleware se existir
      if (route.middleware && route.middleware.length > 0) {
        for (const middleware of route.middleware) {
          await middleware(context);
        }
      }

      // Executar handler da rota
      const result = await route.handler(context);

      this.logger.info("✅ Route executed successfully", {
        routeKey,
        name: route.name,
      });

      return result;
    } catch (error) {
      this.logger.error("❌ Route execution failed", {
        routeKey,
        name: route.name,
        error: error.message,
      });
      throw error;
    }
  }

  // ============ UTILITIES ============
  normalizeRoute(config) {
    return {
      name: config.name,
      type: config.type || this.routeTypes.PUBLIC,
      path: config.path || `/${config.name}`,
      method: config.method || "GET",
      handler: config.handler || this.defaultHandler,
      middleware: config.middleware || [],
      auth: config.auth || false,
      rateLimit: config.rateLimit || null,
      timeout: config.timeout || 30000,
      description: config.description || "",
      metadata: config.metadata || {},
    };
  }

  generateRouteKey(route) {
    return `${route.type}:${route.name}:${route.method}`;
  }

  defaultHandler(context) {
    return {
      message: "Route executed successfully",
      timestamp: new Date().toISOString(),
      context: Object.keys(context),
    };
  }

  // ============ ROUTE DISCOVERY ============
  findRouteByPath(path, method = "GET") {
    return Array.from(this.routes.values()).find(
      (route) => route.path === path && route.method === method
    );
  }

  findRoutesByPattern(pattern) {
    const regex = new RegExp(pattern);
    return Array.from(this.routes.values()).filter(
      (route) => regex.test(route.path) || regex.test(route.name)
    );
  }

  // ============ STATISTICS ============
  getRouteStats() {
    const stats = {
      total: this.routes.size,
      byType: {},
      byMethod: {},
    };

    for (const route of this.routes.values()) {
      // Count by type
      stats.byType[route.type] = (stats.byType[route.type] || 0) + 1;

      // Count by method
      stats.byMethod[route.method] = (stats.byMethod[route.method] || 0) + 1;
    }

    return stats;
  }

  // ============ VALIDATION ============
  validateRouteConfig(config) {
    if (!config.name) {
      throw new Error("Route config must have a name");
    }

    if (!config.handler || typeof config.handler !== "function") {
      throw new Error("Route config must have a handler function");
    }

    const validTypes = Object.values(this.routeTypes);
    if (config.type && !validTypes.includes(config.type)) {
      throw new Error(
        `Invalid route type: ${config.type}. Must be one of: ${validTypes.join(
          ", "
        )}`
      );
    }

    return true;
  }

  // ============ CLEANUP ============
  cleanup() {
    const removedCount = this.routes.size;
    this.routes.clear();

    this.logger.info("🧹 RouteManager cleanup completed", {
      removedRoutes: removedCount,
    });

    return removedCount;
  }
}

module.exports = RouteManager;
