import type { Document } from "mongodb";
import type {
  WorkspaceSnapshot,
  WorkspaceAppearance,
  WorkspacePromptSettings,
  Tile,
  Note,
  Contact,
} from "@/lib/types";

/**
 * Workspace model for MongoDB
 * Maps to WorkspaceSnapshot but with MongoDB-specific fields
 * Best practice: Extends Document for MongoDB compatibility
 */
export interface WorkspaceDocument extends Document {
  _id?: string;
  sessionId: string; // Unique session identifier
  userId: string; // Clerk user ID (required for security isolation)
  company: {
    id: string;
    name: string;
    website?: string;
    tiles: Tile[]; // Typed as Tile[] (matches WorkspaceSnapshot structure)
    notes: Note[]; // Typed as Note[] (matches WorkspaceSnapshot structure)
    contacts: Contact[]; // Typed as Contact[] (matches WorkspaceSnapshot structure)
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
 * Best practice: Validate input before conversion
 */
export function workspaceSnapshotToDocument(
  snapshot: WorkspaceSnapshot
): Omit<WorkspaceDocument, "_id" | "createdAt" | "updatedAt"> {
  if (!snapshot || !snapshot.sessionId) {
    throw new Error("Invalid WorkspaceSnapshot: missing sessionId");
  }
  if (!snapshot.company || !snapshot.company.id) {
    throw new Error("Invalid WorkspaceSnapshot: missing company.id");
  }

  return {
    sessionId: snapshot.sessionId,
    company: snapshot.company,
    generatedAt: snapshot.generatedAt,
    tilesToGenerate: snapshot.tilesToGenerate ?? 0,
    promptSettings: snapshot.promptSettings,
    appearance: snapshot.appearance,
  };
}

/**
 * Convert WorkspaceDocument to WorkspaceSnapshot
 * Best practice: Validate input and ensure type safety
 */
export function workspaceDocumentToSnapshot(
  doc: WorkspaceDocument
): WorkspaceSnapshot {
  if (!doc || !doc.sessionId) {
    throw new Error("Invalid WorkspaceDocument: missing sessionId");
  }
  if (!doc.company || !doc.company.id) {
    throw new Error("Invalid WorkspaceDocument: missing company.id");
  }

  return {
    sessionId: doc.sessionId,
    company: doc.company as WorkspaceSnapshot["company"],
    generatedAt: doc.generatedAt,
    tilesToGenerate: doc.tilesToGenerate,
    promptSettings: doc.promptSettings,
    appearance: doc.appearance,
  };
}

