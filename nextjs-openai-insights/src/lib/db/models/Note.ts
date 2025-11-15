import type { Document } from "mongodb";
import type { Note } from "@/lib/types";

/**
 * Note model for MongoDB (standalone collection)
 * Used when notes are stored separately from dashboards
 * Best practice: Extends Document for MongoDB compatibility
 */
export interface NoteDocument extends Document, Omit<Note, "createdAt" | "updatedAt"> {
  _id?: string;
  dashboardId: string; // Reference to dashboard
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert Note to NoteDocument
 * Best practice: Validate input before conversion
 */
export function noteToDocument(
  note: Note,
  dashboardId: string
): Omit<NoteDocument, "_id" | "createdAt" | "updatedAt"> {
  if (!note || !note.id) {
    throw new Error("Invalid note: missing id");
  }
  if (!dashboardId) {
    throw new Error("Invalid dashboardId: cannot be empty");
  }

  return {
    ...note,
    dashboardId,
  };
}

/**
 * Convert NoteDocument to Note
 * Best practice: Validate and handle Date conversion safely
 */
export function noteDocumentToNote(doc: NoteDocument): Note {
  if (!doc || !doc.id) {
    throw new Error("Invalid NoteDocument: missing id");
  }

  return {
    ...doc,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : new Date(doc.createdAt).toISOString(),
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : new Date(doc.updatedAt).toISOString(),
  };
}

