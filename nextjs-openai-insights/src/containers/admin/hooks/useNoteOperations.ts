"use client";

import { useMemo, useCallback } from "react";
import type { Note } from "@/lib/types";
import type { Dashboard } from "@/lib/types/dashboard";
import { noteService } from "@/lib/services";
import { useToast } from "@/lib/state/toast-context";

export interface CreateNotePayload {
  title: string;
  content: string;
}

export interface UpdateNotePayload {
  title?: string;
  content?: string;
}

/**
 * Note operations hook with dashboard isolation
 * All operations validate that notes belong to the active dashboard
 */
export function useNoteOperations(
  currentCompany: { id: string } | null,
  currentDashboard: Dashboard | null,
  onRefresh: () => void
) {
  const { push } = useToast();

  // Get notes from current dashboard
  const notes = useMemo(() => {
    return currentDashboard?.notes ?? [];
  }, [currentDashboard?.notes]);

  // Create note
  const createNote = useCallback(
    async (payload: CreateNotePayload) => {
      if (!currentCompany || !currentDashboard) {
        push({
          title: "No dashboard loaded",
          description: "Please select a dashboard before creating notes.",
          variant: "destructive",
        });
        return;
      }

      try {
        await noteService.createNote({
          title: payload.title.trim(),
          content: payload.content.trim(),
          dashboardId: currentDashboard.id,
        });

        onRefresh();
        push({
          title: "Note created",
          variant: "success",
        });
      } catch (err) {
        push({
          title: "Failed to create note",
          description: err instanceof Error ? err.message : "Please try again.",
          variant: "destructive",
        });
      }
    },
    [currentCompany, currentDashboard, onRefresh, push]
  );

  // Update note
  const updateNote = useCallback(
    async (noteId: string, payload: UpdateNotePayload) => {
      if (!currentCompany || !currentDashboard) {
        push({
          title: "No dashboard loaded",
          description: "Please select a dashboard before updating notes.",
          variant: "destructive",
        });
        return;
      }

      try {
        await noteService.updateNote(noteId, payload);
        onRefresh();
        push({
          title: "Note updated",
          variant: "success",
        });
      } catch (err) {
        push({
          title: "Failed to update note",
          description: err instanceof Error ? err.message : "Please try again.",
          variant: "destructive",
        });
      }
    },
    [currentCompany, currentDashboard, onRefresh, push]
  );

  // Delete note
  const deleteNote = useCallback(
    async (noteId: string) => {
      if (!currentCompany || !currentDashboard) {
        push({
          title: "No dashboard loaded",
          description: "Please select a dashboard before deleting notes.",
          variant: "destructive",
        });
        return;
      }

      try {
        await noteService.deleteNote(noteId);
        onRefresh();
        push({
          title: "Note deleted",
          variant: "success",
        });
      } catch (err) {
        push({
          title: "Failed to delete note",
          description: err instanceof Error ? err.message : "Please try again.",
          variant: "destructive",
        });
      }
    },
    [currentCompany, currentDashboard, onRefresh, push]
  );

  return {
    notes,
    
    // Actions
    createNote,
    updateNote,
    deleteNote,
    
    // Handlers ready for components
    handlers: {
      onCreate: createNote,
      onUpdate: updateNote,
      onDelete: deleteNote,
    },
  };
}
