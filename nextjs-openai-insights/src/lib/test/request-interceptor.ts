"use client";

import type { RequestData } from "./metrics-storage";
import { addRequest } from "./metrics-storage";
import { sanitizeRequest, isLoggingEnabled, shouldCaptureBody } from "./security-sanitizer";

let reqIdCounter = 1;
let originalFetch: typeof fetch | undefined;

interface InterceptedRequest {
  url: string;
  method: string;
  headers: HeadersInit;
  body?: unknown;
  startTime: number;
  traceId: string;
}

const activeRequests = new Map<string, InterceptedRequest>();

function getServiceFromUrl(url: string): string {
  if (url.includes("/api/generate")) return "api-gateway";
  if (url.includes("/api/workspace/tiles")) return "tile-service";
  if (url.includes("/api/workspace/contacts")) return "contact-service";
  if (url.includes("/api/workspace/notes")) return "note-service";
  if (url.includes("/api/chat")) return "chat-service";
  if (url.includes("/api/workspace")) return "workspace-service";
  return "api-gateway";
}

function getIconFromUrl(url: string): string {
  if (url.includes("/api/generate")) return "📤";
  if (url.includes("/api/workspace/tiles")) return "🎴";
  if (url.includes("/api/workspace/contacts")) return "👤";
  if (url.includes("/api/workspace/notes")) return "📝";
  if (url.includes("/chat")) return "💬";
  if (url.includes("/api/workspace")) return "🏠";
  return "🌐";
}

function createSpans(duration: number, hasError: boolean, service: string) {
  const status2: "error" | "ok" = hasError ? "error" : "ok";
  return [
    {
      id: "span-1",
      service: "frontend-ui",
      duration: Math.floor(duration * 0.1),
      status: "ok" as const,
    },
    {
      id: "span-2",
      service,
      duration: Math.floor(duration * 0.7),
      status: status2,
    },
    {
      id: "span-3",
      service: "storage",
      duration: Math.floor(duration * 0.2),
      status: "ok" as const,
    },
  ];
}

export function interceptRequests() {
  if (typeof window === "undefined") return;
  if (originalFetch) return; // Já interceptado
  
  // Verificar se logging está habilitado
  if (!isLoggingEnabled()) {
    console.log("[Test Dashboard] ⚠️ Logging desabilitado. Para habilitar em desenvolvimento, defina NEXT_PUBLIC_ENABLE_TEST_LOGGING=true ou localStorage.setItem('insights_test_logging_enabled', 'true')");
    return;
  }

  originalFetch = window.fetch.bind(window);
  window.fetch = async function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
    const method = init?.method || "GET";
    const traceId = `trace-${Date.now()}-${reqIdCounter++}`;
    const startTime = performance.now();

    // Ignorar requisições de observabilidade para evitar loop
    if (url.includes("/api/test/")) {
      return originalFetch!(input, init);
    }

    // Sanitizar dados sensíveis ANTES de qualquer processamento
    const captureBody = shouldCaptureBody(url);
    const sanitized = sanitizeRequest(
      url,
      method,
      init?.headers,
      captureBody ? init?.body : undefined
    );

    const intercepted: InterceptedRequest = {
      url: sanitized.url,
      method,
      headers: sanitized.sanitizedHeaders as HeadersInit,
      body: sanitized.sanitizedBody,
      startTime,
      traceId,
    };

    activeRequests.set(traceId, intercepted);

    let hasError = false;
    let errorType: string | null = null;
    let statusCode: number | undefined;

    try {
      const response = await originalFetch!(input, init);
      statusCode = response.status;
      hasError = !response.ok;
      
      if (hasError) {
        if (statusCode >= 500) errorType = "500 Server Error";
        else if (statusCode === 401) errorType = "401 Unauthorized";
        else if (statusCode === 429) errorType = "429 Rate Limit";
        else errorType = `${statusCode} Error`;
      }

      const duration = Math.floor(performance.now() - startTime);
      const service = getServiceFromUrl(sanitized.url); // Usar URL sanitizada
      const icon = getIconFromUrl(sanitized.url); // Usar URL sanitizada

      // Determinar cache status (simplificado)
      const cacheStatus: "hit" | "miss" | "skip" = 
        method === "GET" && response.headers.get("cache-control")?.includes("max-age")
          ? Math.random() < 0.3 ? "hit" : "miss"
          : "skip";

      const requestData: RequestData = {
        id: reqIdCounter++,
        label: `${method} ${sanitized.url.split("?")[0]}`,
        icon,
        status: hasError ? "failed" : "done",
        stage: 6, // Output
        duration,
        hasError,
        errorType,
        service,
        cacheStatus,
        traceId,
        timestamp: Date.now(),
        url: sanitized.url, // URL sanitizada (sem parâmetros sensíveis)
        method,
        statusCode,
        spans: createSpans(duration, hasError, service),
      };

      addRequest(requestData);
      activeRequests.delete(traceId);

      return response;
    } catch (error) {
      hasError = true;
      errorType = error instanceof Error ? error.message : "Unknown Error";
      statusCode = 0;

      const duration = Math.floor(performance.now() - startTime);
      const service = getServiceFromUrl(sanitized.url); // Usar URL sanitizada
      const icon = getIconFromUrl(sanitized.url); // Usar URL sanitizada

      const requestData: RequestData = {
        id: reqIdCounter++,
        label: `${method} ${sanitized.url.split("?")[0]}`,
        icon,
        status: "failed",
        stage: 6,
        duration,
        hasError: true,
        errorType,
        service,
        cacheStatus: "skip",
        traceId,
        timestamp: Date.now(),
        url: sanitized.url, // URL sanitizada (sem parâmetros sensíveis)
        method,
        statusCode: 0,
        spans: createSpans(duration, true, service),
      };

      addRequest(requestData);
      activeRequests.delete(traceId);

      throw error;
    }
  };
}

export function restoreRequests() {
  if (typeof window === "undefined" || !originalFetch) return;
  window.fetch = originalFetch;
  originalFetch = undefined;
}

