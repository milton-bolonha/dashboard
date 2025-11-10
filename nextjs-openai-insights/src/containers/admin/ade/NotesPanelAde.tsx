"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

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
        const response = await fetch("/api/workspace/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, content }),
        });
        if (!response.ok) {
          throw new Error("Unable to save the note right now.");
        }
        setTitle("");
        setContent("");
        await onNotesChanged();
        push({ title: "Note saved", variant: "success" });
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

      <form
        onSubmit={handleCreate}
        className="space-y-3 rounded-xl border border-dashed border-gray-300 bg-white/70 p-4"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Headline or signal"
            className="flex-1 rounded-md border border-gray-200 px-3 py-2 text-sm font-medium text-gray-800 transition focus:border-gray-400 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-full bg-orange-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Saving…" : "Add note"}
          </button>
        </div>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Add context, key stakeholders or follow-up tasks…"
          rows={3}
          className="w-full resize-none rounded-md border border-gray-200 px-3 py-3 text-sm text-gray-700 transition focus:border-gray-400 focus:outline-none"
        />
      </form>

      {notes.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
          No notes yet. Use this space to log signals, objections and next steps while you review the tiles.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {notes.map((note) => (
            <article
              key={note.id}
              className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <header className="bg-[#E87C2A] px-4 py-3 text-white">
                <h4 className="text-sm font-semibold">
                  {note.title?.length ? note.title : "Untitled note"}
                </h4>
              </header>
              <div className="flex-1 px-4 py-4">
                <p className="whitespace-pre-line text-sm text-gray-700">
                  {note.content}
                </p>
              </div>
              <footer className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-xs text-gray-500">
                <span>
                  Updated{" "}
                  {new Date(note.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(note.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-gray-500 transition hover:border-red-200 hover:text-red-500"
                  aria-label="Remove note"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

