import type { WorkspaceSnapshot } from "@/lib/types";

/**
 * Service for workspace API operations
 * Pure functions without React dependencies - can be used in server or client
 */

export interface GenerateWorkspacePayload {
  salesRepCompany: string;
  salesRepWebsite: string;
  solution: string;
  targetCompany: string;
  targetWebsite: string;
  model?: string;
  templateId?: string;
}

export interface WorkspaceServiceError extends Error {
  status?: number;
  data?: unknown;
}

/**
 * Fetch workspace from server
 */
export async function fetchWorkspace(): Promise<WorkspaceSnapshot> {
  const response = await fetch("/api/workspace", { credentials: "include" });
  
  if (!response.ok) {
    const error: WorkspaceServiceError = new Error("Failed to load workspace");
    error.status = response.status;
    try {
      error.data = await response.json();
    } catch {
      error.data = null;
    }
    throw error;
  }
  
  return (await response.json()) as WorkspaceSnapshot;
}

/**
 * Generate new workspace
 */
export async function generateWorkspace(
  payload: GenerateWorkspacePayload
): Promise<WorkspaceSnapshot> {
  const response = await fetch("/api/workspace/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: WorkspaceServiceError = new Error(
      (errorData.error as string) ?? "Failed to generate workspace"
    );
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  return (await response.json()) as WorkspaceSnapshot;
}

/**
 * Delete workspace (server-side)
 */
export async function deleteWorkspace(sessionId: string): Promise<void> {
  const response = await fetch(`/api/workspace/${sessionId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error: WorkspaceServiceError = new Error("Failed to delete workspace");
    error.status = response.status;
    throw error;
  }
}
