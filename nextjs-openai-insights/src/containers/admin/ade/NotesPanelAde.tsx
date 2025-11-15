"use client";

import { useEffect, useState, useTransition } from "react";
import { Pencil, Trash2, Plus } from "lucide-react";

import type { AdeAppearanceTokens } from "@/lib/ade-theme";
import { hexToRgbString } from "@/lib/color";
import type { Note } from "@/lib/types";
import { useToast } from "@/lib/state/toast-context";

interface NotesPanelAdeProps {
  appearance: AdeAppearanceTokens;
  notes: Note[];
  onNotesChanged: () => Promise<void>;
}

export function NotesPanelAde({ appearance, notes, onNotesChanged }: NotesPanelAdeProps) {
  const { push } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Only render after mount to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted and appearance is ready
  if (!mounted || !appearance) {
    return null;
  }

  const isEditing = editingNoteId !== null;
  // Use saved values from appearance directly (like AI Insight Tiles does)
  // Fallback to defaults if not available (backward compatibility)
  // Convert to RGB format for consistency - only calculate after mount
  const headingColor = hexToRgbString(appearance.headingColor || "#1f1f1f");
  const textColor = appearance.textColor || "#2c2c2c";
  const mutedColor = appearance.mutedTextColor || "#6f6f6f";
  const cardBorder = appearance.cardBorderColor || "#d9d9d9";
  const surfaceColor = appearance.surfaceColor || "#ffffff";

  const resetForm = () => {
    setTitle("");
    setContent("");
    setEditingNoteId(null);
    setShowForm(false);
  };

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() && !content.trim()) {
      push({
        title: "Add a note first",
        description: "Include a title or body before saving a note.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        const endpoint = isEditing
          ? `/api/workspace/notes/${editingNoteId}`
          : "/api/workspace/notes";
        const method = isEditing ? "PATCH" : "POST";
        const response = await fetch(endpoint, {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });
        if (!response.ok) {
          throw new Error("Unable to save the note right now.");
        }
        resetForm();
        await onNotesChanged();
        push({
          title: isEditing ? "Note updated" : "Note saved",
          variant: "success",
        });
      } catch (error) {
        push({
          title: "Save failed",
          description:
            error instanceof Error ? error.message : "Try again in a few moments.",
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = (noteId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/workspace/notes/${noteId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Unable to remove the note right now.");
        }
        if (editingNoteId === noteId) {
          resetForm();
        }
        await onNotesChanged();
        push({ title: "Note removed", variant: "success" });
      } catch (error) {
        push({
          title: "Removal failed",
          description:
            error instanceof Error ? error.message : "Try again in a few moments.",
          variant: "destructive",
        });
      }
    });
  };

  const handleEdit = (note: Note) => {
    setEditingNoteId(note.id);
    setTitle(note.title ?? "");
    setContent(note.content ?? "");
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-lg font-semibold" style={{ color: headingColor }}>
          Deal notes
        </h3>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Add Note button (similar to Add Prompt, Add Contact) */}
        {!showForm && !isEditing && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="group relative flex h-[220px] flex-col overflow-hidden rounded-[20px] border-2 border-dashed transition-all duration-200 flex-col items-center justify-center cursor-pointer hover:border-gray-500"
            style={{
              backgroundColor: surfaceColor || "#ffffff",
              borderColor: cardBorder || "#d9d9d9",
            }}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-300 group-hover:bg-gray-400 transition-colors flex items-center justify-center">
                <Plus className="w-6 h-6 text-gray-600 group-hover:text-gray-700" />
              </div>
              <span className="text-sm font-medium" style={{ color: textColor || "#2c2c2c" }}>
                Add Note
              </span>
            </div>
          </button>
        )}

        {/* Form (shown when showForm is true or when editing) */}
        {(showForm || isEditing) && (
          <form
            onSubmit={handleCreate}
            className="flex h-full flex-col gap-3 rounded-2xl border border-dashed p-4 bg-white"
            style={{ borderColor: cardBorder }}
          >
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: mutedColor }}>
                  Title
                </label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Headline or signal"
                  className="w-full rounded-lg border px-3 py-2 text-sm font-medium focus:border-black focus:outline-none focus:ring-0 bg-white"
                  style={{
                    borderColor: cardBorder,
                    color: "#1f1f1f",
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: mutedColor }}>
                  Notes
                </label>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Capture context, signals or next steps…"
                  rows={4}
                  className="w-full resize-none rounded-lg border px-3 py-3 text-sm focus:border-black focus:outline-none focus:ring-0 bg-white"
                  style={{
                    borderColor: cardBorder,
                    color: "#1f1f1f",
                  }}
                />
              </div>
              <div className="mt-auto flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f6f6f] transition hover:text-black cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending || (!title.trim() && !content.trim())}
                  className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:bg-black/40 whitespace-nowrap cursor-pointer"
                >
                  {isPending ? "Saving…" : isEditing ? "Save note" : "Add note"}
                </button>
              </div>
            </form>
        )}

        {/* Existing notes */}
        {notes.map((note) => (
            <article
              key={note.id}
              className="flex flex-col overflow-hidden rounded-2xl border"
              style={{ 
                borderColor: cardBorder || "#d9d9d9", 
                backgroundColor: surfaceColor || "#ffffff" 
              }}
            >
              <header className="bg-[#E87C2A] px-4 py-3 text-white">
                <h4 className="text-sm font-semibold">
                  {note.title?.length ? note.title : "Untitled note"}
                </h4>
              </header>
              <div className="flex-1 px-4 py-4 bg-white">
                <p className="whitespace-pre-line text-sm" style={{ color: textColor || "#2c2c2c" }}>
                  {note.content}
                </p>
              </div>
              <footer
                className="flex items-center justify-between border-t px-4 py-3 text-xs"
                style={{ 
                  borderColor: cardBorder || "#d9d9d9", 
                  color: mutedColor || "#6f6f6f" 
                }}
              >
                <span>
                  Updated{" "}
                  {new Date(note.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleEdit(note)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#8a8a8a] ring-1 ring-black/5 transition hover:text-black"
                    aria-label="Edit note"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(note.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[#8a8a8a] ring-1 ring-black/5 transition hover:text-red-500"
                    aria-label="Remove note"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </footer>
            </article>
        ))}
      </div>
    </section>
  );
}
