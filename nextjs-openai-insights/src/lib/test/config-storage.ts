"use client";

export interface TestFilters {
  environment: "dev" | "prod";
  period: "5m" | "1h" | "24h";
  severity: "all" | "errors";
  autoRefresh: boolean;
}

export interface StressTestConfig {
  endpoint: string;
  requests: number;
  interval: number;
}

export interface StoredConfigData {
  version: number;
  filters: TestFilters;
  stressTestConfig: StressTestConfig;
}

const CONFIG_STORAGE_KEY = "insights_test_config_v1";
const CONFIG_VERSION = 1;

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function createInitialConfig(): StoredConfigData {
  return {
    version: CONFIG_VERSION,
    filters: {
      environment: "dev",
      period: "5m",
      severity: "all",
      autoRefresh: true,
    },
    stressTestConfig: {
      endpoint: "/api/generate",
      requests: 10,
      interval: 1000,
    },
  };
}

export function loadStoredConfig(): StoredConfigData {
  if (!isBrowser()) return createInitialConfig();
  try {
    const raw = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (!raw) return createInitialConfig();
    const parsed = JSON.parse(raw) as StoredConfigData;
    if (
      !parsed ||
      parsed.version !== CONFIG_VERSION ||
      !parsed.filters ||
      !parsed.stressTestConfig
    ) {
      return createInitialConfig();
    }
    return parsed;
  } catch {
    return createInitialConfig();
  }
}

export function saveConfig(data: StoredConfigData) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors
  }
}

export function updateFilters(filters: Partial<TestFilters>) {
  const data = loadStoredConfig();
  data.filters = { ...data.filters, ...filters };
  saveConfig(data);
}

export function updateStressTestConfig(config: Partial<StressTestConfig>) {
  const data = loadStoredConfig();
  data.stressTestConfig = { ...data.stressTestConfig, ...config };
  saveConfig(data);
}

