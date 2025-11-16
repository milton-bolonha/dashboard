"use client";

import type { StressTestResult } from "./stress-history-storage";
import { addStressTestResult } from "./stress-history-storage";

export interface StressTestOptions {
  endpoint: string;
  requests: number;
  interval: number;
  method?: string;
  body?: unknown;
  headers?: HeadersInit;
}

export interface StressTestProgress {
  completed: number;
  total: number;
  successCount: number;
  errorCount: number;
  currentLatencies: number[];
}

export async function runStressTest(
  options: StressTestOptions,
  onProgress?: (progress: StressTestProgress) => void
): Promise<StressTestResult> {
  const {
    endpoint,
    requests,
    interval,
    method = "GET",
    body,
    headers,
  } = options;

  const startTime = Date.now();
  const latencies: number[] = [];
  const errors: Map<string, { status: number; message: string; count: number }> = new Map();
  let successCount = 0;
  let errorCount = 0;

  const makeRequest = async (index: number): Promise<void> => {
    const reqStart = performance.now();
    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const reqEnd = performance.now();
      const latency = reqEnd - reqStart;
      latencies.push(latency);

      if (!response.ok) {
        errorCount++;
        const errorKey = `${response.status}: ${response.statusText}`;
        const existing = errors.get(errorKey);
        if (existing) {
          existing.count++;
        } else {
          errors.set(errorKey, {
            status: response.status,
            message: response.statusText,
            count: 1,
          });
        }
      } else {
        successCount++;
      }

      if (onProgress) {
        onProgress({
          completed: index + 1,
          total: requests,
          successCount,
          errorCount,
          currentLatencies: latencies.slice(-10), // Últimas 10 latências
        });
      }
    } catch (error) {
      errorCount++;
      const errorMessage = error instanceof Error ? error.message : "Unknown Error";
      const errorKey = `0: ${errorMessage}`;
      const existing = errors.get(errorKey);
      if (existing) {
        existing.count++;
      } else {
        errors.set(errorKey, {
          status: 0,
          message: errorMessage,
          count: 1,
        });
      }

      if (onProgress) {
        onProgress({
          completed: index + 1,
          total: requests,
          successCount,
          errorCount,
          currentLatencies: latencies.slice(-10),
        });
      }
    }
  };

  // Executar requisições com intervalo
  const promises: Promise<void>[] = [];
  for (let i = 0; i < requests; i++) {
    promises.push(
      new Promise((resolve) => {
        setTimeout(() => {
          makeRequest(i).then(resolve);
        }, i * interval);
      })
    );
  }

  await Promise.all(promises);

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Calcular estatísticas
  latencies.sort((a, b) => a - b);
  const avgLatency = latencies.length > 0
    ? latencies.reduce((a, b) => a + b, 0) / latencies.length
    : 0;
  const minLatency = latencies[0] || 0;
  const maxLatency = latencies[latencies.length - 1] || 0;
  const p95Index = Math.floor(latencies.length * 0.95);
  const p95Latency = latencies[p95Index] || 0;

  const successRate = requests > 0 ? (successCount / requests) * 100 : 0;

  const result: StressTestResult = {
    id: `stress-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    endpoint,
    requests,
    interval,
    startTime,
    endTime,
    duration,
    successCount,
    errorCount,
    successRate,
    avgLatency,
    minLatency,
    maxLatency,
    p95Latency,
    errors: Array.from(errors.values()),
  };

  addStressTestResult(result);
  return result;
}

