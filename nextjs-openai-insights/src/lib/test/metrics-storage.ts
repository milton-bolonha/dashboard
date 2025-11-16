"use client";

export interface RequestData {
  id: number;
  label: string;
  icon: string;
  status: "pending" | "running" | "done" | "failed";
  stage: number;
  user?: { id: string; email: string; country: string };
  duration: number;
  hasError: boolean;
  errorType: string | null;
  service: string;
  cacheStatus: "hit" | "miss" | "skip";
  traceId: string;
  timestamp: number;
  url?: string;
  method?: string;
  statusCode?: number;
  spans?: Array<{
    id: string;
    service: string;
    duration: number;
    status: "ok" | "error";
  }>;
}

export interface MetricsData {
  health: number;
  latencyP95: number;
  errorRate: number;
  activeUsers: number;
  timestamp: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
}

export interface StoredMetricsData {
  version: number;
  lastReset: number;
  requests: RequestData[];
  metrics: MetricsData | null;
  cacheStats: CacheStats;
}

const METRICS_STORAGE_KEY = "insights_test_metrics_v1";
const METRICS_VERSION = 1;
const MAX_REQUESTS = 200;
const MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 horas

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function createInitialMetrics(): StoredMetricsData {
  return {
    version: METRICS_VERSION,
    lastReset: Date.now(),
    requests: [],
    metrics: null,
    cacheStats: { hits: 0, misses: 0 },
  };
}

export function loadStoredMetrics(): StoredMetricsData {
  if (!isBrowser()) return createInitialMetrics();
  try {
    const raw = localStorage.getItem(METRICS_STORAGE_KEY);
    if (!raw) return createInitialMetrics();
    const parsed = JSON.parse(raw) as StoredMetricsData;
    if (
      !parsed ||
      parsed.version !== METRICS_VERSION ||
      typeof parsed.lastReset !== "number" ||
      !Array.isArray(parsed.requests)
    ) {
      return createInitialMetrics();
    }
    // Limpar requisições antigas
    const now = Date.now();
    parsed.requests = parsed.requests.filter(
      (req) => now - req.timestamp < MAX_AGE_MS
    );
    // Limitar quantidade
    if (parsed.requests.length > MAX_REQUESTS) {
      parsed.requests = parsed.requests.slice(-MAX_REQUESTS);
    }
    return parsed;
  } catch {
    return createInitialMetrics();
  }
}

export function saveMetrics(data: StoredMetricsData) {
  if (!isBrowser()) return;
  try {
    // Limpar requisições antigas antes de salvar
    const now = Date.now();
    data.requests = data.requests.filter(
      (req) => now - req.timestamp < MAX_AGE_MS
    );
    // Limitar quantidade
    if (data.requests.length > MAX_REQUESTS) {
      data.requests = data.requests.slice(-MAX_REQUESTS);
    }
    localStorage.setItem(METRICS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors
  }
}

export function addRequest(request: RequestData) {
  const data = loadStoredMetrics();
  data.requests.push(request);
  // Limitar quantidade
  if (data.requests.length > MAX_REQUESTS) {
    data.requests = data.requests.slice(-MAX_REQUESTS);
  }
  saveMetrics(data);
}

export function updateMetrics(metrics: MetricsData) {
  const data = loadStoredMetrics();
  data.metrics = metrics;
  saveMetrics(data);
}

export function updateCacheStats(stats: Partial<CacheStats>) {
  const data = loadStoredMetrics();
  data.cacheStats = { ...data.cacheStats, ...stats };
  saveMetrics(data);
}

export function clearMetrics() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(METRICS_STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

