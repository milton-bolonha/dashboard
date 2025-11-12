import { cookies } from "next/headers";
import { randomUUID } from "crypto";

import type { WorkspaceSnapshot } from "@/lib/types";

const SESSION_COOKIE = "insightsWorkspaceSession";
const CACHE_TTL_MS = 1000 * 60 * 30; // 30 minutes

const COOKIE_DEFAULT_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: CACHE_TTL_MS / 1000,
  secure: process.env.NODE_ENV !== "development",
};

const globalStore = globalThis as typeof globalThis & {
  __WORKSPACE_CACHE__?: Map<string, CacheEntry>;
};

interface CacheEntry {
  snapshot: WorkspaceSnapshot;
  updatedAt: number;
}

function getWorkspaceCache(): Map<string, CacheEntry> {
  if (!globalStore.__WORKSPACE_CACHE__) {
    globalStore.__WORKSPACE_CACHE__ = new Map();
  }
  return globalStore.__WORKSPACE_CACHE__;
}

function purgeExpiredEntries() {
  const cache = getWorkspaceCache();
  const now = Date.now();
  for (const [sessionId, entry] of cache.entries()) {
    if (now - entry.updatedAt > CACHE_TTL_MS) {
      cache.delete(sessionId);
    }
  }
}

function createDefaultWorkspace(): WorkspaceSnapshot {
  const companyId = `company_${randomUUID()}`;
  return {
    sessionId: `session_${randomUUID()}`,
    generatedAt: null,
    tilesToGenerate: 0,
    company: {
      id: companyId,
      name: "New Company",
      website: "",
      tiles: [],
      notes: [],
      contacts: [],
    },
  };
}

async function getCurrentSession() {
  purgeExpiredEntries();
  const store = await cookies();
  const sessionId = store.get(SESSION_COOKIE)?.value ?? null;
  return { store, sessionId };
}

function getFreshEntry(sessionId: string): CacheEntry | null {
  if (!sessionId) return null;
  const cache = getWorkspaceCache();
  const entry = cache.get(sessionId);
  if (!entry) return null;
  if (Date.now() - entry.updatedAt > CACHE_TTL_MS) {
    cache.delete(sessionId);
    return null;
  }
  entry.updatedAt = Date.now();
  return entry;
}

function setSessionCookie(
  store: Awaited<ReturnType<typeof cookies>>,
  sessionId: string
) {
  store.set(SESSION_COOKIE, sessionId, COOKIE_DEFAULT_OPTIONS);
}

function removeSessionCookie(store: Awaited<ReturnType<typeof cookies>>) {
  store.set(SESSION_COOKIE, "", { ...COOKIE_DEFAULT_OPTIONS, maxAge: 0 });
}

function cloneWorkspace(snapshot: WorkspaceSnapshot): WorkspaceSnapshot {
  return {
    ...snapshot,
    company: {
      ...snapshot.company,
      tiles: snapshot.company.tiles.map((tile) => ({
        ...tile,
        history: tile.history.map((entry) => ({ ...entry })),
      })),
      notes: snapshot.company.notes.map((note) => ({ ...note })),
      contacts: snapshot.company.contacts.map((contact) => ({ ...contact })),
    },
  };
}

export async function readWorkspace(): Promise<WorkspaceSnapshot | null> {
  const { sessionId } = await getCurrentSession();
  if (!sessionId) return null;
  const entry = getFreshEntry(sessionId);
  if (!entry) return null;
  return cloneWorkspace(entry.snapshot);
}

export async function writeWorkspace(
  newWorkspace: WorkspaceSnapshot
): Promise<string> {
  const cache = getWorkspaceCache();
  cache.set(newWorkspace.sessionId, {
    snapshot: cloneWorkspace(newWorkspace),
    updatedAt: Date.now(),
  });
  const { store } = await getCurrentSession();
  setSessionCookie(store, newWorkspace.sessionId);
  console.log("[cookies-store] 💾 Workspace cached in memory", {
    sessionId: newWorkspace.sessionId,
    tiles: newWorkspace.company.tiles.length,
  });
  return newWorkspace.sessionId;
}

export async function updateWorkspace(
  updater: (workspace: WorkspaceSnapshot) => WorkspaceSnapshot
): Promise<WorkspaceSnapshot> {
  const current = await readWorkspace();
  if (!current) {
    throw new Error("workspace_not_found");
  }
  const updated = updater(cloneWorkspace(current));
  await writeWorkspace(updated);
  return updated;
}

export async function clearWorkspace(): Promise<void> {
  const { store, sessionId } = await getCurrentSession();
  if (sessionId) {
    const cache = getWorkspaceCache();
    cache.delete(sessionId);
  }
  removeSessionCookie(store);
  // Note: Custom colors in localStorage are handled by the client-side reset handler
  // This keeps the separation of concerns - server clears workspace, client clears UI preferences
}

export async function touchWorkspace(): Promise<WorkspaceSnapshot | null> {
  const snapshot = await readWorkspace();
  if (!snapshot) {
    return null;
  }
  if (!snapshot.generatedAt) {
    const updated: WorkspaceSnapshot = {
      ...snapshot,
      generatedAt: new Date().toISOString(),
    };
    await writeWorkspace(updated);
    return updated;
  }
  return snapshot;
}

export async function ensureWorkspaceSession(): Promise<WorkspaceSnapshot> {
  const existing = await readWorkspace();
  if (existing) {
    return existing;
  }
  const fresh = createDefaultWorkspace();
  await writeWorkspace(fresh);
  return fresh;
}

export function clampTiles(content: string, maxChars = 320): string {
  if (content.length <= maxChars) {
    return content;
  }
  return `${content.slice(0, maxChars)}…`;
}
