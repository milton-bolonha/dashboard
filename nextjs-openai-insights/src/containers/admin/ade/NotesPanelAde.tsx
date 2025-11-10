"use client";

import { useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";

import type { Note } from "@/lib/types";
import { useToast } from "@/lib/state/toast-context";

interface NotesPanelAdeProps {
  notes: Note[];
  onNotesChanged: () => Promise<void>;
}

export function NotesPanelAde({ notes, onNotesChanged }: NotesPanelAdeProps) {
  const { push } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

  const isEditing = editingNoteId !== null;

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
    <section className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Deal notes</h3>
          <p className="text-sm text-gray-500">
            Capture headlines, objections and next steps while triaging insights.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-gray-600">
          {notes.length} saved
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <form
          onSubmit={handleCreate}
          className="flex h-full flex-col gap-3 rounded-2xl border border-dashed border-[#d9d9d9] bg-white p-4"
        >
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8a8a8a]">
              Title
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Headline or signal"
              className="w-full rounded-lg border border-[#e4e4e4] bg-white px-3 py-2 text-sm font-medium text-[#1f1f1f] placeholder:text-[#a1a1a1] focus:border-black focus:outline-none focus:ring-0"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8a8a8a]">
              Notes
            </label>
            <textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="Add context, key stakeholders or follow-up tasks…"
              rows={4}
              className="w-full resize-none rounded-lg border border-[#e4e4e4] bg-white px-3 py-3 text-sm text-[#1f1f1f] placeholder:text-[#a1a1a1] focus:border-black focus:outline-none focus:ring-0"
            />
          </div>
          <div className="mt-auto flex items-center justify-between">
            <span className="text-xs text-[#6f6f6f]">All notes stay attached to this workspace.</span>
            <div className="flex items-center gap-3">
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
              className="inline-flex items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:bg-[#9e9e9e] whitespace-nowrap"
              >
                {isPending ? "Saving…" : isEditing ? "Save note" : "Add note"}
              </button>
            </div>
          </div>
        </form>

        {notes.length === 0 ? (
          <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-[#d9d9d9] bg-white px-4 text-center text-sm text-[#6f6f6f]">
            No notes yet. Use this space to log signals, objections and next steps while you review the tiles.
          </div>
        ) : (
          notes.map((note) => (
            <article
              key={note.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-[#ededed] bg-white"
            >
              <header className="bg-[#E87C2A] px-4 py-3 text-white">
                <h4 className="text-sm font-semibold">
                  {note.title?.length ? note.title : "Untitled note"}
                </h4>
              </header>
              <div className="flex-1 px-4 py-4">
                <p className="whitespace-pre-line text-sm text-[#3b3b3b]">
                  {note.content}
                </p>
              </div>
              <footer className="flex items-center justify-between border-t border-[#f0f0f0] px-4 py-3 text-xs text-[#6f6f6f]">
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
          ))
        )}
      </div>
    </section>
  );
}

