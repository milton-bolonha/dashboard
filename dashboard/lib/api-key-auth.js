import { db } from "./db";
import { ObjectId } from "mongodb";

/**
 * Middleware para validação de API Keys
 */
export class ApiKeyAuth {
  /**
   * Valida uma API key
   */
  static async validateApiKey(request) {
    const apiKey = request.headers.get("x-api-key");

    if (!apiKey) {
      return { valid: false, error: "API key required" };
    }

    try {
      // Buscar chave no banco
      const key = await db.findOne("api_keys", {
        key: apiKey,
        isActive: true,
      });

      if (!key) {
        return { valid: false, error: "Invalid API key" };
      }

      // Verificar se expirou
      if (key.expiresAt && new Date() > key.expiresAt) {
        return { valid: false, error: "API key expired" };
      }

      return { valid: true, key };
    } catch (error) {
      console.error("Erro ao validar API key:", error);
      return { valid: false, error: "Internal server error" };
    }
  }

  /**
   * Verifica rate limit para uma API key
   */
  static async checkRateLimit(apiKey, endpoint) {
    try {
      const key = await db.findOne("api_keys", { key: apiKey });
      if (!key) return { allowed: false, error: "Invalid API key" };

      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Contar requisições na última hora
      const requestCount = await db.count("api_requests", {
        apiKey,
        endpoint,
        timestamp: { $gte: oneHourAgo },
      });

      const limit = key.rateLimit || 100; // default 100 req/hora

      if (requestCount >= limit) {
        return {
          allowed: false,
          error: "Rate limit exceeded",
          retryAfter: 3600, // 1 hora
        };
      }

      // Registrar requisição
      await db.insertOne("api_requests", {
        apiKey,
        endpoint,
        timestamp: now,
        ip: "unknown", // TODO: extrair IP real
      });

      return { allowed: true };
    } catch (error) {
      console.error("Erro ao verificar rate limit:", error);
      return { allowed: true }; // Permitir em caso de erro
    }
  }

  /**
   * Gera uma nova API key
   */
  static async generateApiKey(config) {
    const {
      name,
      workspaceId,
      permissions = ["read"],
      rateLimit = 100,
      expiresAt = null,
    } = config;

    // Gerar chave única
    const key = this.generateKeyCode();

    const apiKey = {
      _id: new ObjectId().toString(),
      key,
      name,
      workspaceId,
      permissions,
      rateLimit,
      expiresAt,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      usage: {
        totalRequests: 0,
        lastUsed: null,
      },
    };

    await db.insertOne("api_keys", apiKey);
    return apiKey;
  }

  /**
   * Gera código único para API key
   */
  static generateKeyCode() {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "API";
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Lista API keys de um workspace
   */
  static async listKeys(workspaceId, filters = {}) {
    const query = { workspaceId, ...filters };
    return await db.find("api_keys", query);
  }

  /**
   * Revoga uma API key
   */
  static async revokeKey(keyId, reason = "Revoked by admin") {
    return await db.updateOne(
      "api_keys",
      { _id: keyId },
      {
        $set: {
          isActive: false,
          revokedAt: new Date(),
          revokedReason: reason,
        },
      }
    );
  }

  /**
   * Obtém estatísticas de uso de uma API key
   */
  static async getKeyStats(keyId) {
    const key = await db.findOne("api_keys", { _id: keyId });
    if (!key) return null;

    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [hourlyRequests, dailyRequests] = await Promise.all([
      db.count("api_requests", {
        apiKey: key.key,
        timestamp: { $gte: oneHourAgo },
      }),
      db.count("api_requests", {
        apiKey: key.key,
        timestamp: { $gte: oneDayAgo },
      }),
    ]);

    return {
      key: key.name,
      totalRequests: key.usage.totalRequests,
      hourlyRequests,
      dailyRequests,
      rateLimit: key.rateLimit,
      lastUsed: key.usage.lastUsed,
      isActive: key.isActive,
    };
  }
}

/**
 * Middleware para rotas que requerem API key
 */
export async function requireApiKey(request) {
  const validation = await ApiKeyAuth.validateApiKey(request);

  if (!validation.valid) {
    return {
      error: validation.error,
      status: 401,
    };
  }

  const rateLimit = await ApiKeyAuth.checkRateLimit(
    validation.key.key,
    request.url
  );

  if (!rateLimit.allowed) {
    return {
      error: rateLimit.error,
      status: 429,
      headers: {
        "Retry-After": rateLimit.retryAfter,
      },
    };
  }

  return { key: validation.key };
}
