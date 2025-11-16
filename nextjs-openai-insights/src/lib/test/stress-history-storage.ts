"use client";

export interface StressTestResult {
  id: string;
  endpoint: string;
  requests: number;
  interval: number;
  startTime: number;
  endTime: number;
  duration: number;
  successCount: number;
  errorCount: number;
  successRate: number;
  avgLatency: number;
  minLatency: number;
  maxLatency: number;
  p95Latency: number;
  errors: Array<{
    status: number;
    message: string;
    count: number;
  }>;
}

export interface StoredStressHistoryData {
  version: number;
  tests: StressTestResult[];
  lastTest: number | null;
}

const STRESS_HISTORY_STORAGE_KEY = "insights_test_stress_history_v1";
const STRESS_HISTORY_VERSION = 1;
const MAX_TESTS = 50;

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function createInitialStressHistory(): StoredStressHistoryData {
  return {
    version: STRESS_HISTORY_VERSION,
    tests: [],
    lastTest: null,
  };
}

export function loadStoredStressHistory(): StoredStressHistoryData {
  if (!isBrowser()) return createInitialStressHistory();
  try {
    const raw = localStorage.getItem(STRESS_HISTORY_STORAGE_KEY);
    if (!raw) return createInitialStressHistory();
    const parsed = JSON.parse(raw) as StoredStressHistoryData;
    if (
      !parsed ||
      parsed.version !== STRESS_HISTORY_VERSION ||
      !Array.isArray(parsed.tests)
    ) {
      return createInitialStressHistory();
    }
    // Limitar quantidade
    if (parsed.tests.length > MAX_TESTS) {
      parsed.tests = parsed.tests.slice(-MAX_TESTS);
    }
    return parsed;
  } catch {
    return createInitialStressHistory();
  }
}

export function saveStressHistory(data: StoredStressHistoryData) {
  if (!isBrowser()) return;
  try {
    // Limitar quantidade
    if (data.tests.length > MAX_TESTS) {
      data.tests = data.tests.slice(-MAX_TESTS);
    }
    localStorage.setItem(STRESS_HISTORY_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors
  }
}

export function addStressTestResult(result: StressTestResult) {
  const data = loadStoredStressHistory();
  data.tests.push(result);
  data.lastTest = result.endTime;
  // Limitar quantidade
  if (data.tests.length > MAX_TESTS) {
    data.tests = data.tests.slice(-MAX_TESTS);
  }
  saveStressHistory(data);
}

export function clearStressHistory() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STRESS_HISTORY_STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

