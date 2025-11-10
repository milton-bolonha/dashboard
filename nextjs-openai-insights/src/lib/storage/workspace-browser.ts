"use client";

import type { WorkspaceSnapshot } from "@/lib/types";

const STORAGE_PREFIX = "insights_workspace_";
const INDEX_KEY = "insights_workspace_index";
const LAST_SESSION_KEY = "insights_workspace_last";
const DEFAULT_MAX_WORKSPACES = 5;

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

function getIndex(): string[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(INDEX_KEY);
    const parsed = raw ? (JSON.parse(raw) as string[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistIndex(index: string[]) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(INDEX_KEY, JSON.stringify(index));
  } catch {
    // Ignore quota errors silently
  }
}

function storageKey(sessionId: string) {
  return `${STORAGE_PREFIX}${sessionId}`;
}

export function loadWorkspace(sessionId: string): WorkspaceSnapshot | null {
  if (!isBrowser()) return null;
  try {
    const raw = localStorage.getItem(storageKey(sessionId));
    return raw ? (JSON.parse(raw) as WorkspaceSnapshot) : null;
  } catch {
    return null;
  }
}

export function saveWorkspace(
  sessionId: string,
  snapshot: WorkspaceSnapshot,
  options?: { maxEntries?: number }
) {
  if (!isBrowser()) return;
  const maxEntries = options?.maxEntries ?? DEFAULT_MAX_WORKSPACES;
  try {
    localStorage.setItem(storageKey(sessionId), JSON.stringify(snapshot));
    localStorage.setItem(LAST_SESSION_KEY, sessionId);
  } catch {
    // Ignore quota errors
  }

  const index = getIndex().filter((id) => id !== sessionId);
  index.unshift(sessionId);
  persistIndex(index.slice(0, maxEntries));
  pruneWorkspaces(maxEntries);
}

export function deleteWorkspace(sessionId: string) {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(storageKey(sessionId));
  } catch {
    // ignore
  }
  const index = getIndex().filter((id) => id !== sessionId);
  persistIndex(index);
}

export function pruneWorkspaces(maxEntries: number = DEFAULT_MAX_WORKSPACES) {
  if (!isBrowser()) return;
  const index = getIndex();
  const retained = new Set(index.slice(0, maxEntries));
  for (const id of index.slice(maxEntries)) {
    try {
      localStorage.removeItem(storageKey(id));
    } catch {
      // ignore
    }
  }
  persistIndex(Array.from(retained));
}

export function getLastSessionId(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(LAST_SESSION_KEY);
}

export function rememberSessionId(sessionId: string) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(LAST_SESSION_KEY, sessionId);
  } catch {
    // ignore
  }
  const index = getIndex().filter((id) => id !== sessionId);
  index.unshift(sessionId);
  persistIndex(index);
}

export function listStoredSessionIds(): string[] {
  return getIndex();
}

export function listStoredWorkspaces(
  limit: number = DEFAULT_MAX_WORKSPACES
): Array<{ sessionId: string; snapshot: WorkspaceSnapshot }> {
  if (!isBrowser()) return [];
  const index = getIndex().slice(0, limit);
  const entries: Array<{ sessionId: string; snapshot: WorkspaceSnapshot }> = [];

  index.forEach((sessionId) => {
    const snapshot = loadWorkspace(sessionId);
    if (snapshot) {
      entries.push({ sessionId, snapshot });
    }
  });

  return entries;
}

export function clearAllWorkspaces() {
  if (!isBrowser()) return;
  const index = getIndex();
  index.forEach((sessionId) => {
    try {
      localStorage.removeItem(storageKey(sessionId));
    } catch {
      // ignore
    }
  });
  try {
    localStorage.removeItem(INDEX_KEY);
    localStorage.removeItem(LAST_SESSION_KEY);
  } catch {
    // ignore
  }
}

