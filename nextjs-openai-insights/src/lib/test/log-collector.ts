"use client";

import type { LogEntry } from "./logs-storage";
import { addLog } from "./logs-storage";

let originalConsoleLog: typeof console.log | undefined;
let originalConsoleError: typeof console.error | undefined;
let originalConsoleWarn: typeof console.warn | undefined;
let originalConsoleInfo: typeof console.info | undefined;

function getLogType(level: string): LogEntry["type"] {
  if (level === "error") return "error";
  if (level === "warn") return "warning";
  if (level === "info") return "info";
  return "system";
}

function createLogEntry(
  message: string,
  level: "log" | "error" | "warn" | "info",
  context?: string
): LogEntry {
  return {
    timestamp: new Date().toISOString(),
    message,
    type: getLogType(level),
    context,
    level,
  };
}

export function interceptConsole() {
  if (typeof window === "undefined") return;
  if (originalConsoleLog) return; // Já interceptado

  originalConsoleLog = console.log.bind(console);
  originalConsoleError = console.error.bind(console);
  originalConsoleWarn = console.warn.bind(console);
  originalConsoleInfo = console.info.bind(console);

  console.log = function (...args: unknown[]) {
    if (originalConsoleLog) {
      originalConsoleLog(...args);
    }
    try {
      const message = args.map((arg) => 
        typeof arg === "object" ? JSON.stringify(arg) : String(arg)
      ).join(" ");
      addLog(createLogEntry(message, "log", "client"));
    } catch (e) {
      // Ignore errors in log collection
    }
  };

  console.error = function (...args: unknown[]) {
    if (originalConsoleError) {
      originalConsoleError(...args);
    }
    try {
      const message = args.map((arg) => 
        typeof arg === "object" ? JSON.stringify(arg) : String(arg)
      ).join(" ");
      addLog(createLogEntry(message, "error", "client"));
    } catch (e) {
      // Ignore errors in log collection
    }
  };

  console.warn = function (...args: unknown[]) {
    if (originalConsoleWarn) {
      originalConsoleWarn(...args);
    }
    try {
      const message = args.map((arg) => 
        typeof arg === "object" ? JSON.stringify(arg) : String(arg)
      ).join(" ");
      addLog(createLogEntry(message, "warn", "client"));
    } catch (e) {
      // Ignore errors in log collection
    }
  };

  console.info = function (...args: unknown[]) {
    if (originalConsoleInfo) {
      originalConsoleInfo(...args);
    }
    try {
      const message = args.map((arg) => 
        typeof arg === "object" ? JSON.stringify(arg) : String(arg)
      ).join(" ");
      addLog(createLogEntry(message, "info", "client"));
    } catch (e) {
      // Ignore errors in log collection
    }
  };
}

export function restoreConsole() {
  if (typeof window === "undefined" || !originalConsoleLog) return;
  console.log = originalConsoleLog;
  console.error = originalConsoleError!;
  console.warn = originalConsoleWarn!;
  console.info = originalConsoleInfo!;
  originalConsoleLog = undefined;
  originalConsoleError = undefined;
  originalConsoleWarn = undefined;
  originalConsoleInfo = undefined;
}

export async function fetchServerLogs(limit = 100): Promise<LogEntry[]> {
  try {
    const response = await fetch(`/api/test/logs?limit=${limit}`);
    if (!response.ok) return [];
    const data = await response.json();
    return data.logs || [];
  } catch {
    return [];
  }
}

