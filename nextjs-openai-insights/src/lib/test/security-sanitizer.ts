"use client";

/**
 * Security Sanitizer for Test Dashboard
 * 
 * IMPORTANTE: Este sistema é apenas para DESENVOLVIMENTO/TESTE
 * Em produção, o logging deve ser DESABILITADO ou configurado para não capturar dados sensíveis
 */

const SENSITIVE_HEADERS = [
  "authorization",
  "cookie",
  "x-api-key",
  "api-key",
  "x-auth-token",
  "stripe-signature",
  "x-stripe-signature",
];

const SENSITIVE_BODY_FIELDS = [
  "password",
  "apiKey",
  "api_key",
  "openai_api_key",
  "stripe_secret_key",
  "stripe_webhook_secret",
  "token",
  "access_token",
  "refresh_token",
  "authorization",
  "credit_card",
  "card_number",
  "cvv",
  "ssn",
  "social_security_number",
];

const SENSITIVE_URL_PARAMS = [
  "token",
  "key",
  "api_key",
  "secret",
  "password",
  "auth",
];

export interface SanitizedRequest {
  url: string;
  method: string;
  sanitizedHeaders: Record<string, string>;
  sanitizedBody: unknown;
  hasSensitiveData: boolean;
}

/**
 * Sanitiza headers removendo dados sensíveis
 */
export function sanitizeHeaders(headers: HeadersInit | undefined): Record<string, string> {
  if (!headers) return {};
  
  const sanitized: Record<string, string> = {};
  
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_HEADERS.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = value;
      }
    });
  } else if (Array.isArray(headers)) {
    headers.forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_HEADERS.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = String(value);
      }
    });
  } else {
    Object.entries(headers).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (SENSITIVE_HEADERS.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = String(value);
      }
    });
  }
  
  return sanitized;
}

/**
 * Sanitiza URL removendo parâmetros sensíveis
 */
export function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url, window.location.origin);
    SENSITIVE_URL_PARAMS.forEach((param) => {
      if (urlObj.searchParams.has(param)) {
        urlObj.searchParams.set(param, "[REDACTED]");
      }
    });
    return urlObj.pathname + urlObj.search;
  } catch {
    // Se não conseguir parsear, retorna URL sem query params sensíveis
    let sanitized = url;
    SENSITIVE_URL_PARAMS.forEach((param) => {
      const regex = new RegExp(`([?&])${param}=[^&]*`, "gi");
      sanitized = sanitized.replace(regex, `$1${param}=[REDACTED]`);
    });
    return sanitized;
  }
}

/**
 * Sanitiza body removendo campos sensíveis
 */
export function sanitizeBody(body: unknown): { sanitized: unknown; hasSensitiveData: boolean } {
  if (!body) return { sanitized: null, hasSensitiveData: false };
  
  // Se for string, tentar parsear JSON
  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body);
      return sanitizeBody(parsed);
    } catch {
      // Se não for JSON, retornar como está (mas marcar como potencialmente sensível)
      return { sanitized: "[BODY_REDACTED]", hasSensitiveData: true };
    }
  }
  
  // Se for objeto, sanitizar recursivamente
  if (typeof body === "object" && body !== null) {
    const sanitized: Record<string, unknown> = {};
    let hasSensitive = false;
    
    Object.entries(body).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_BODY_FIELDS.some((field) => lowerKey.includes(field));
      
      if (isSensitive) {
        sanitized[key] = "[REDACTED]";
        hasSensitive = true;
      } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
        // Recursivamente sanitizar objetos aninhados
        const nested = sanitizeBody(value);
        sanitized[key] = nested.sanitized;
        if (nested.hasSensitiveData) hasSensitive = true;
      } else {
        sanitized[key] = value;
      }
    });
    
    return { sanitized, hasSensitiveData: hasSensitive };
  }
  
  return { sanitized: body, hasSensitiveData: false };
}

/**
 * Sanitiza requisição completa
 */
export function sanitizeRequest(
  url: string,
  method: string,
  headers?: HeadersInit,
  body?: unknown
): SanitizedRequest {
  const sanitizedUrl = sanitizeUrl(url);
  const sanitizedHeaders = sanitizeHeaders(headers);
  const bodySanitization = sanitizeBody(body);
  
  return {
    url: sanitizedUrl,
    method,
    sanitizedHeaders,
    sanitizedBody: bodySanitization.sanitized,
    hasSensitiveData: bodySanitization.hasSensitiveData || Object.values(sanitizedHeaders).some((v) => v === "[REDACTED]"),
  };
}

/**
 * Verifica se logging está habilitado (apenas em desenvolvimento)
 */
export function isLoggingEnabled(): boolean {
  if (typeof window === "undefined") return false;
  
  // Verificar variável de ambiente ou localStorage
  const envEnabled = process.env.NEXT_PUBLIC_ENABLE_TEST_LOGGING === "true";
  const storageEnabled = localStorage.getItem("insights_test_logging_enabled") === "true";
  
  // Por padrão, só habilitar em desenvolvimento
  const isDev = process.env.NODE_ENV === "development";
  
  return isDev && (envEnabled || storageEnabled);
}

/**
 * Verifica se deve capturar body completo ou apenas metadata
 */
export function shouldCaptureBody(url: string): boolean {
  // Não capturar body de webhooks ou endpoints sensíveis
  const sensitiveEndpoints = [
    "/api/webhooks/",
    "/api/auth/",
    "/api/login",
    "/api/signup",
  ];
  
  return !sensitiveEndpoints.some((endpoint) => url.includes(endpoint));
}

