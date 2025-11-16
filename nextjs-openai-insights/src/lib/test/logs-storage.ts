"use client";

export interface LogEntry {
  timestamp: string;
  message: string;
  type: "info" | "error" | "success" | "warning" | "system";
  context?: string;
  level?: "log" | "error" | "warn" | "info";
}

export interface StoredLogsData {
  version: number;
  logs: LogEntry[];
  lastCleanup: number;
}

const LOGS_STORAGE_KEY = "insights_test_logs_v1";
const LOGS_VERSION = 1;
const MAX_LOGS = 500;
const MAX_AGE_MS = 60 * 60 * 1000; // 1 hora

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function createInitialLogs(): StoredLogsData {
  return {
    version: LOGS_VERSION,
    logs: [],
    lastCleanup: Date.now(),
  };
}

export function loadStoredLogs(): StoredLogsData {
  if (!isBrowser()) return createInitialLogs();
  try {
    const raw = localStorage.getItem(LOGS_STORAGE_KEY);
    if (!raw) return createInitialLogs();
    const parsed = JSON.parse(raw) as StoredLogsData;
    if (
      !parsed ||
      parsed.version !== LOGS_VERSION ||
      !Array.isArray(parsed.logs) ||
      typeof parsed.lastCleanup !== "number"
    ) {
      return createInitialLogs();
    }
    // Limpar logs antigos se necessário
    const now = Date.now();
    if (now - parsed.lastCleanup > MAX_AGE_MS) {
      parsed.logs = parsed.logs.filter((log) => {
        const logTime = new Date(log.timestamp).getTime();
        return now - logTime < MAX_AGE_MS;
      });
      parsed.lastCleanup = now;
    }
    // Limitar quantidade
    if (parsed.logs.length > MAX_LOGS) {
      parsed.logs = parsed.logs.slice(-MAX_LOGS);
    }
    return parsed;
  } catch {
    return createInitialLogs();
  }
}

export function saveLogs(data: StoredLogsData) {
  if (!isBrowser()) return;
  try {
    // Limpar logs antigos antes de salvar
    const now = Date.now();
    if (now - data.lastCleanup > MAX_AGE_MS) {
      data.logs = data.logs.filter((log) => {
        const logTime = new Date(log.timestamp).getTime();
        return now - logTime < MAX_AGE_MS;
      });
      data.lastCleanup = now;
    }
    // Limitar quantidade
    if (data.logs.length > MAX_LOGS) {
      data.logs = data.logs.slice(-MAX_LOGS);
    }
    localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Ignore quota errors
  }
}

export function addLog(entry: LogEntry) {
  const data = loadStoredLogs();
  data.logs.push(entry);
  // Limitar quantidade
  if (data.logs.length > MAX_LOGS) {
    data.logs = data.logs.slice(-MAX_LOGS);
  }
  saveLogs(data);
}

export function clearLogs() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(LOGS_STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

