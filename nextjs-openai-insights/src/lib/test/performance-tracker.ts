"use client";

import type { RequestData, MetricsData } from "./metrics-storage";
import { loadStoredMetrics, updateMetrics } from "./metrics-storage";

export function calculateMetrics(requests: RequestData[]): MetricsData {
  if (requests.length === 0) {
    return {
      health: 100,
      latencyP95: 0,
      errorRate: 0,
      activeUsers: 0,
      timestamp: Date.now(),
    };
  }

  // Filtrar requisições recentes (últimas 5 minutos)
  const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
  const recentRequests = requests.filter(
    (req) => req.timestamp > fiveMinutesAgo
  );

  if (recentRequests.length === 0) {
    return {
      health: 100,
      latencyP95: 0,
      errorRate: 0,
      activeUsers: 0,
      timestamp: Date.now(),
    };
  }

  // Calcular taxa de erro
  const errorCount = recentRequests.filter((r) => r.hasError).length;
  const errorRate = (errorCount / recentRequests.length) * 100;

  // Calcular latência P95
  const latencies = recentRequests
    .filter((r) => !r.hasError)
    .map((r) => r.duration)
    .sort((a, b) => a - b);

  const p95Index = Math.floor(latencies.length * 0.95);
  const latencyP95 = latencies[p95Index] || 0;

  // Calcular health score (0-100)
  // Health diminui com erro e latência alta
  const health = Math.max(
    0,
    Math.min(
      100,
      100 - errorRate * 2 - Math.min(latencyP95 / 10, 50)
    )
  );

  // Contar usuários únicos (baseado em traceId ou sessionId)
  // Simplificado: contar requisições únicas por minuto
  const uniqueUsers = new Set(
    recentRequests.map((r) => {
      // Agrupar por minuto para contar usuários únicos
      const minute = Math.floor(r.timestamp / (60 * 1000));
      return `${minute}`;
    })
  ).size;

  return {
    health,
    latencyP95,
    errorRate,
    activeUsers: uniqueUsers,
    timestamp: Date.now(),
  };
}

export function updateMetricsFromRequests() {
  const data = loadStoredMetrics();
  const metrics = calculateMetrics(data.requests);
  updateMetrics(metrics);
  return metrics;
}

export function getTopSlowEndpoints(requests: RequestData[], limit = 5): RequestData[] {
  const slowRequests = [...requests]
    .filter((r) => !r.hasError)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, limit);
  return slowRequests;
}

export function getErrorGroups(requests: RequestData[]): Record<string, { count: number; lastTimestamp: Date }> {
  const grouped: Record<string, { count: number; lastTimestamp: Date }> = {};

  requests
    .filter((r) => r.hasError && r.errorType)
    .forEach((req) => {
      const errorKey = req.errorType || "Unknown Error";
      if (!grouped[errorKey]) {
        grouped[errorKey] = {
          count: 0,
          lastTimestamp: new Date(req.timestamp),
        };
      }
      grouped[errorKey].count++;
      const reqTime = new Date(req.timestamp);
      if (reqTime > grouped[errorKey].lastTimestamp) {
        grouped[errorKey].lastTimestamp = reqTime;
      }
    });

  return grouped;
}

