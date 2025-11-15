import type { WorkspaceSnapshot, WorkspaceAppearance, WorkspacePromptSettings } from "@/lib/types";

/**
 * Workspace model for MongoDB
 * Maps to WorkspaceSnapshot but with MongoDB-specific fields
 */
export interface WorkspaceDocument {
  _id?: string;
  sessionId: string; // Unique session identifier
  userId?: string; // Clerk user ID (when integrated, FASE 2)
  company: {
    id: string;
    name: string;
    website?: string;
    tiles: unknown[]; // Will be typed as TileDocument[]
    notes: unknown[]; // Will be typed as NoteDocument[]
    contacts: unknown[]; // Will be typed as ContactDocument[]
  };
  generatedAt: string | null;
  tilesToGenerate: number;
  promptSettings?: WorkspacePromptSettings;
  appearance?: WorkspaceAppearance;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert WorkspaceSnapshot to WorkspaceDocument
 */
export function workspaceSnapshotToDocument(
  snapshot: WorkspaceSnapshot
): Omit<WorkspaceDocument, "_id" | "createdAt" | "updatedAt"> {
  return {
    sessionId: snapshot.sessionId,
    company: snapshot.company,
    generatedAt: snapshot.generatedAt,
    tilesToGenerate: snapshot.tilesToGenerate,
    promptSettings: snapshot.promptSettings,
    appearance: snapshot.appearance,
  };
}

/**
 * Convert WorkspaceDocument to WorkspaceSnapshot
 */
export function workspaceDocumentToSnapshot(
  doc: WorkspaceDocument
): WorkspaceSnapshot {
  return {
    sessionId: doc.sessionId,
    company: doc.company as WorkspaceSnapshot["company"],
    generatedAt: doc.generatedAt,
    tilesToGenerate: doc.tilesToGenerate,
    promptSettings: doc.promptSettings,
    appearance: doc.appearance,
  };
}

