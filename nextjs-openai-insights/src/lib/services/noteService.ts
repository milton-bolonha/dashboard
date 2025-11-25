import type { Note } from "@/lib/types";

/**
 * Service for note API operations
 * Pure functions without React dependencies
 */

export interface CreateNotePayload {
  title: string;
  content: string;
  dashboardId: string;
}

export interface UpdateNotePayload {
  title?: string;
  content?: string;
}

export interface NoteServiceError extends Error {
  status?: number;
  data?: unknown;
}

/**
 * Create a new note
 */
export async function createNote(payload: CreateNotePayload): Promise<Note> {
  const response = await fetch("/api/workspace/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: payload.title.trim(),
      content: payload.content.trim(),
      dashboardId: payload.dashboardId,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: NoteServiceError = new Error(
      (errorData.error as string) ?? "Failed to create note"
    );
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  const data = await response.json();
  return data.note as Note;
}

/**
 * Update an existing note
 */
export async function updateNote(
  noteId: string,
  payload: UpdateNotePayload
): Promise<Note> {
  const response = await fetch(`/api/workspace/notes/${noteId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: NoteServiceError = new Error(
      (errorData.error as string) ?? "Failed to update note"
    );
    error.status = response.status;
    error.data = errorData;
    throw error;
  }

  const data = await response.json();
  return data.note as Note;
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<void> {
  const response = await fetch(`/api/workspace/notes/${noteId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error: NoteServiceError = new Error("Failed to delete note");
    error.status = response.status;
    throw error;
  }
}
