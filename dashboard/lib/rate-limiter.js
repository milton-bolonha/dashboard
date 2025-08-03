/**
 * 🛡️ SISTEMA DE RATE LIMITING
 *
 * Implementa rate limiting baseado em memória para proteger APIs
 * contra abuso e ataques conforme especificado nas tarefas de lançamento.
 */

// Store em memória para tracking de requests
const requestStore = new Map();

// Configurações padrão de rate limiting
const RATE_LIMITS = {
  // Deploy APIs - mais restritivo
  deploy: {
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 5, // máximo 5 deploys por hora
    message:
      "Limite de deploys por hora excedido (5). Tente novamente em 1 hora.",
  },

  // Webhook APIs - moderado
  webhook: {
    windowMs: 60 * 1000, // 1 minuto
    max: 30, // máximo 30 requests por minuto
    message: "Muitas requisições de webhook. Tente novamente em 1 minuto.",
  },

  // API Pública - mais permissivo
  public: {
    windowMs: 60 * 1000, // 1 minuto
    max: 100, // máximo 100 requests por minuto
    message: "Limite de requisições excedido. Tente novamente em 1 minuto.",
  },

  // APIs gerais
  general: {
    windowMs: 60 * 1000, // 1 minuto
    max: 60, // máximo 60 requests por minuto
    message: "Muitas requisições. Tente novamente em 1 minuto.",
  },
};

/**
 * Limpa entradas expiradas do store
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, data] of requestStore.entries()) {
    if (now - data.windowStart > data.windowMs) {
      requestStore.delete(key);
    }
  }
}

/**
 * Gera chave única para identificar cliente
 */
function generateClientKey(request, userId = null) {
  // Usar userId se disponível, senão IP
  if (userId) {
    return `user:${userId}`;
  }

  // Extrair IP do request
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  return `ip:${ip}`;
}

/**
 * Aplica rate limiting baseado no tipo de endpoint
 */
function applyRateLimit(clientKey, limitType = "general") {
  const limit = RATE_LIMITS[limitType];
  if (!limit) {
    throw new Error(`Tipo de limite desconhecido: ${limitType}`);
  }

  const now = Date.now();
  const data = requestStore.get(clientKey);

  if (!data) {
    // Primeira requisição deste cliente
    requestStore.set(clientKey, {
      count: 1,
      windowStart: now,
      windowMs: limit.windowMs,
    });
    return { allowed: true, remaining: limit.max - 1 };
  }

  // Verificar se está dentro da janela atual
  if (now - data.windowStart < data.windowMs) {
    // Dentro da janela - incrementar contador
    data.count++;

    if (data.count > limit.max) {
      // Limite excedido
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil((data.windowStart + data.windowMs - now) / 1000),
        message: limit.message,
      };
    }

    return {
      allowed: true,
      remaining: limit.max - data.count,
    };
  } else {
    // Nova janela - resetar contador
    data.count = 1;
    data.windowStart = now;
    return { allowed: true, remaining: limit.max - 1 };
  }
}

/**
 * Middleware de rate limiting para Next.js
 */
export function createRateLimiter(limitType = "general") {
  return function rateLimitMiddleware(request, userId = null) {
    // Bypass para ambiente de desenvolvimento
    if (process.env.NODE_ENV === "development") {
      return { allowed: true, remaining: 999 };
    }

    // 🚨 HACK TEMPORÁRIO: Bypass para email específico de desenvolvimento
    if (userId === "user_30lCRGxlNoUi6cc1l9m30u71zNt") {
      console.log(
        "🔓 HACK DEV: Bypass de rate limit para usuário de desenvolvimento"
      );
      return { allowed: true, remaining: 999, hackMode: true };
    }

    // Limpar entradas expiradas periodicamente
    if (Math.random() < 0.01) {
      // 1% chance a cada request
      cleanupExpiredEntries();
    }

    const clientKey = generateClientKey(request, userId);
    const result = applyRateLimit(clientKey, limitType);

    return result;
  };
}

/**
 * Helper para usar em rotas de API
 */
export async function checkRateLimit(
  request,
  limitType = "general",
  userId = null
) {
  // 🚨 HACK TEMPORÁRIO: Bypass para email específico de desenvolvimento
  if (userId === "user_30lCRGxlNoUi6cc1l9m30u71zNt") {
    console.log(
      "🔓 HACK DEV: Bypass de rate limit para usuário de desenvolvimento"
    );
    return {
      blocked: false,
      remaining: 999,
      hackMode: true,
      headers: {
        "X-RateLimit-Limit": "999",
        "X-RateLimit-Remaining": "999",
        "X-RateLimit-Reset": "0",
      },
    };
  }
  const rateLimiter = createRateLimiter(limitType);
  const result = rateLimiter(request, userId);

  if (!result.allowed) {
    return {
      blocked: true,
      status: 429,
      headers: {
        "X-RateLimit-Limit": RATE_LIMITS[limitType].max,
        "X-RateLimit-Remaining": result.remaining,
        "X-RateLimit-Reset": new Date(
          Date.now() + result.retryAfter * 1000
        ).toISOString(),
        "Retry-After": result.retryAfter,
      },
      message: result.message,
    };
  }

  return {
    blocked: false,
    headers: {
      "X-RateLimit-Limit": RATE_LIMITS[limitType].max,
      "X-RateLimit-Remaining": result.remaining,
    },
  };
}

/**
 * Sanitização de inputs para prevenir ataques
 */
export function sanitizeInput(input, type = "general") {
  if (typeof input !== "string") {
    return input;
  }

  switch (type) {
    case "siteName":
      // Para nomes de site - apenas alfanuméricos, hífens e underscores
      return input
        .replace(/[^a-zA-Z0-9\-_\s]/g, "")
        .trim()
        .substring(0, 100);

    case "repoUrl":
      // Para URLs de repositório Git
      if (!input.match(/^https:\/\/github\.com\/[\w\-_.]+\/[\w\-_.]+$/)) {
        throw new Error(
          "URL de repositório inválida. Apenas URLs do GitHub são permitidas."
        );
      }
      return input.trim();

    case "token":
      // Para tokens de API
      return input
        .replace(/[^a-zA-Z0-9_\-]/g, "")
        .trim()
        .substring(0, 200);

    case "general":
    default:
      // Sanitização geral - remove scripts e caracteres perigosos
      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/javascript:/gi, "")
        .replace(/on\w+\s*=/gi, "")
        .trim()
        .substring(0, 1000);
  }
}

/**
 * Middleware combinado de rate limiting e sanitização
 */
export function securityMiddleware(limitType = "general") {
  return async function (request, userId = null) {
    // 1. Verificar rate limiting
    const rateLimitResult = await checkRateLimit(request, limitType, userId);

    if (rateLimitResult.blocked) {
      return {
        blocked: true,
        status: rateLimitResult.status,
        headers: rateLimitResult.headers,
        message: rateLimitResult.message,
      };
    }

    // 2. Headers de rate limiting (mesmo quando permitido)
    return {
      blocked: false,
      headers: rateLimitResult.headers,
    };
  };
}
