import { cookies } from "next/headers";
import { randomUUID } from "crypto";

import type {
  Contact,
  Note,
  Tile,
  WorkspaceSnapshot,
} from "@/lib/types";

const META_COOKIE = "insightsWorkspaceMeta";
const DATA_COOKIE = "insightsWorkspaceData";

const COOKIE_DEFAULT_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60, // 1 hour
};

interface MetaCookie {
  sessionId: string;
  companyId: string;
  companyName: string;
  companyWebsite: string;
  generatedAt: string | null;
  tilesToGenerate: number;
}

interface DataCookie {
  tiles: Tile[];
  notes: Note[];
  contacts: Contact[];
}

function safeJsonParse<T>(value: string | undefined | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn("[cookies-store] ❗ Falha ao fazer parse de cookie", error);
    return fallback;
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

function workspaceToCookies(workspace: WorkspaceSnapshot): {
  meta: MetaCookie;
  data: DataCookie;
} {
  const normalizedTiles = Array.isArray(workspace.company.tiles)
    ? workspace.company.tiles
    : [];
  const normalizedNotes = Array.isArray(workspace.company.notes)
    ? workspace.company.notes
    : [];
  const normalizedContacts = Array.isArray(workspace.company.contacts)
    ? workspace.company.contacts
    : [];

  const meta: MetaCookie = {
    sessionId: workspace.sessionId,
    companyId: workspace.company.id,
    companyName: workspace.company.name,
    companyWebsite: workspace.company.website ?? "",
    generatedAt: workspace.generatedAt,
    tilesToGenerate: workspace.tilesToGenerate ?? normalizedTiles.length,
  };

  const data: DataCookie = {
    tiles: normalizedTiles,
    notes: normalizedNotes,
    contacts: normalizedContacts,
  };

  return { meta, data };
}

function cookiesToWorkspace(meta: MetaCookie, data: DataCookie): WorkspaceSnapshot {
  return {
    sessionId: meta.sessionId,
    generatedAt: meta.generatedAt,
    tilesToGenerate: meta.tilesToGenerate,
    company: {
      id: meta.companyId,
      name: meta.companyName,
      website: meta.companyWebsite,
      tiles: Array.isArray(data.tiles) ? data.tiles : [],
      notes: Array.isArray(data.notes) ? data.notes : [],
      contacts: Array.isArray(data.contacts) ? data.contacts : [],
    },
  };
}

async function ensureState() {
  const store = cookies();
  const metaRaw = store.get(META_COOKIE)?.value ?? null;
  const dataRaw = store.get(DATA_COOKIE)?.value ?? null;

  let meta = safeJsonParse<MetaCookie | null>(metaRaw, null);
  let data = safeJsonParse<DataCookie | null>(dataRaw, null);

  if (!meta || !data) {
    const fallback = createDefaultWorkspace();
    const cookiesData = workspaceToCookies(fallback);
    store.set(META_COOKIE, JSON.stringify(cookiesData.meta), COOKIE_DEFAULT_OPTIONS);
    store.set(DATA_COOKIE, JSON.stringify(cookiesData.data), COOKIE_DEFAULT_OPTIONS);
    meta = cookiesData.meta;
    data = cookiesData.data;
  }

  return { store, meta, data };
}

export async function readWorkspace(): Promise<WorkspaceSnapshot> {
  const { meta, data } = await ensureState();
  return cookiesToWorkspace(meta, data);
}

export async function writeWorkspace(newWorkspace: WorkspaceSnapshot): Promise<void> {
  const { store } = await ensureState();
  const { meta, data } = workspaceToCookies(newWorkspace);
  store.set(META_COOKIE, JSON.stringify(meta), COOKIE_DEFAULT_OPTIONS);
  store.set(DATA_COOKIE, JSON.stringify(data), COOKIE_DEFAULT_OPTIONS);
}

export async function updateWorkspace(
  updater: (workspace: WorkspaceSnapshot) => WorkspaceSnapshot,
): Promise<WorkspaceSnapshot> {
  const current = await readWorkspace();
  const updated = updater(current);
  await writeWorkspace(updated);
  return updated;
}

export async function clearWorkspace(): Promise<void> {
  const store = cookies();
  store.set(META_COOKIE, "", { ...COOKIE_DEFAULT_OPTIONS, maxAge: 0 });
  store.set(DATA_COOKIE, "", { ...COOKIE_DEFAULT_OPTIONS, maxAge: 0 });
}

export async function touchWorkspace(): Promise<WorkspaceSnapshot> {
  return updateWorkspace((workspace) => {
    if (!workspace.generatedAt) {
      return {
        ...workspace,
        generatedAt: new Date().toISOString(),
      };
    }
    return workspace;
  });
}

export function clampTiles(content: string, maxChars = 320): string {
  if (content.length <= maxChars) {
    return content;
  }
  return `${content.slice(0, maxChars)}…`;
}

