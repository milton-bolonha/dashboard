"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";

import type { AdeAppearanceTokens } from "@/lib/ade-theme";
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

  const isEditing = editingNoteId !== null;
  const headingColor = appearance.headingColor ?? "#1f1f1f";
  const textColor = appearance.textColor ?? "#2c2c2c";
  const mutedColor = appearance.mutedTextColor ?? "#6f6f6f";
  const cardBorder = appearance.cardBorderColor ?? "#d9d9d9";
  const surfaceColor = appearance.surfaceColor ?? "#ffffff";

  const resetForm = () => {
    setTitle("");
    setContent("");
    setEditingNoteId(null);
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
    <section className="space-y-4" suppressHydrationWarning>
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-lg font-semibold" style={{ color: headingColor || "#000000" }} suppressHydrationWarning>
          Deal notes
        </h3>
        <span
          className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em]"
          style={{ borderColor: cardBorder, color: mutedColor }}
          suppressHydrationWarning
        >
          {notes.length} saved
        </span>
      </header>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {notes.length === 0 ? (
          <article className="flex flex-col overflow-hidden rounded-2xl border" style={{ borderColor: cardBorder, backgroundColor: surfaceColor }} suppressHydrationWarning>
            <header className="bg-[#E87C2A] text-white p-3">
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Note title"
                className="w-full bg-transparent text-white placeholder-white/70 text-sm font-semibold"
                type="text"
              />
            </header>
            <div className="flex-1 p-4 bg-white">
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Note content"
                rows={3}
                className="w-full text-sm text-gray-700 mb-2 resize-none"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={() => handleCreate({} as React.FormEvent<HTMLFormElement>)}
                  disabled={isPending || (!title.trim() && !content.trim())}
                  className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Create Note
                </button>
              </div>
            </div>
          </article>
        ) : (
          <>
            <form
              onSubmit={handleCreate}
              className="flex h-full flex-col gap-3 rounded-2xl border border-dashed p-4"
              style={{ borderColor: cardBorder, backgroundColor: surfaceColor }}
              suppressHydrationWarning
            >
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: mutedColor }} suppressHydrationWarning>
                  Title
                </label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Headline or signal"
                  className="w-full rounded-lg border px-3 py-2 text-sm font-medium focus:border-black focus:outline-none focus:ring-0"
                  suppressHydrationWarning
                  style={{
                    borderColor: cardBorder,
                    color: textColor,
                    backgroundColor: surfaceColor,
                  }}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.28em]" style={{ color: mutedColor }} suppressHydrationWarning>
                  Notes
                </label>
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Capture context, signals or next steps…"
                  rows={4}
                  className="w-full resize-none rounded-lg border px-3 py-3 text-sm focus:border-black focus:outline-none focus:ring-0"
                  suppressHydrationWarning
                  style={{
                    borderColor: cardBorder,
                    color: textColor,
                    backgroundColor: surfaceColor,
                  }}
                />
              </div>
              <div className="mt-auto flex items-center justify-end gap-3">
                {isEditing ? (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="text-xs font-semibold uppercase tracking-[0.24em] text-[#6f6f6f] transition hover:text-black"
                  >
                    Cancel
                  </button>
                ) : null}
                <button
                  type="submit"
                  disabled={isPending}
                  className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-black/90 disabled:cursor-not-allowed disabled:bg-black/40 whitespace-nowrap"
                >
                  {isPending ? "Saving…" : isEditing ? "Save note" : "Add note"}
                </button>
              </div>
            </form>
            {notes.map((note) => (
            <article
              key={note.id}
              className="flex flex-col overflow-hidden rounded-2xl border"
              style={{ borderColor: cardBorder, backgroundColor: surfaceColor }}
              suppressHydrationWarning
            >
              <header className="bg-[#E87C2A] px-4 py-3 text-white">
                <h4 className="text-sm font-semibold">
                  {note.title?.length ? note.title : "Untitled note"}
                </h4>
              </header>
              <div className="flex-1 px-4 py-4">
                <p className="whitespace-pre-line text-sm" style={{ color: textColor }} suppressHydrationWarning>
                  {note.content}
                </p>
              </div>
              <footer
                className="flex items-center justify-between border-t px-4 py-3 text-xs"
                style={{ borderColor: cardBorder, color: mutedColor }}
                suppressHydrationWarning
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
          </>
        )}
      </div>
    </section>
  );
}
