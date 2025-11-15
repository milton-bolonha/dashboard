import type { Note } from "@/lib/types";

/**
 * Note model for MongoDB (standalone collection)
 * Used when notes are stored separately from dashboards
 */
export interface NoteDocument extends Omit<Note, "createdAt" | "updatedAt"> {
  _id?: string;
  dashboardId: string; // Reference to dashboard
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert Note to NoteDocument
 */
export function noteToDocument(
  note: Note,
  dashboardId: string
): Omit<NoteDocument, "_id" | "createdAt" | "updatedAt"> {
  return {
    ...note,
    dashboardId,
  };
}

/**
 * Convert NoteDocument to Note
 */
export function noteDocumentToNote(doc: NoteDocument): Note {
  return {
    ...doc,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

