import { cookies } from "next/headers";
import { randomUUID } from "crypto";

import type { WorkspaceSnapshot } from "@/lib/types";

const WORKSPACE_COOKIE = "insightsWorkspace";

function createDefaultWorkspace(): WorkspaceSnapshot {
  return {
    sessionId: `session_${randomUUID()}`,
    generatedAt: null,
    tilesToGenerate: 0,
    company: {
      id: `company_${randomUUID()}`,
      name: "New Company",
      website: "",
      tiles: [],
      notes: [],
      contacts: [],
    },
  };
}

export async function readWorkspace(): Promise<WorkspaceSnapshot> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(WORKSPACE_COOKIE)?.value;

  if (!raw) {
    return createDefaultWorkspace();
  }

  try {
    const data = JSON.parse(raw) as WorkspaceSnapshot;
    if (!data.company) {
      throw new Error("Missing company");
    }
    return data;
  } catch (error) {
    console.warn("[cookies-store] Failed to parse workspace cookie", error);
    return createDefaultWorkspace();
  }
}

export async function writeWorkspace(newWorkspace: WorkspaceSnapshot): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, JSON.stringify(newWorkspace), {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
  });
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
  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, "", {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 0,
  });
}

export async function touchWorkspace(): Promise<WorkspaceSnapshot> {
  return updateWorkspace((workspace) => ({
    ...workspace,
    generatedAt: workspace.generatedAt ?? new Date().toISOString(),
  }));
}

export function clampTiles(content: string, maxChars = 750): string {
  if (content.length <= maxChars) {
    return content;
  }
  return `${content.slice(0, maxChars)}…`;
}

