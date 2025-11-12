"use client";

import { useState, useTransition } from "react";

import type { Note } from "@/lib/types";
import { useToast } from "@/lib/state/toast-context";

interface NotesPanelProps {
  notes: Note[];
  onNotesChanged: () => Promise<void>;
}

export function NotesPanel({ notes, onNotesChanged }: NotesPanelProps) {
  const { push } = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!title.trim() && !content.trim()) {
      push({
        title: "Preencha a nota",
        description: "Add a title or content before saving.",
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
          if (response.status === 404) {
            push({
              title: "Sessão expirada",
              description: "Volte para a landing e gere um novo workspace.",
              variant: "destructive",
            });
            return;
          }
          throw new Error("Could not save the note");
        }
        setTitle("");
        setContent("");
        await onNotesChanged();
        push({ title: "Nota registrada", variant: "success" });
      } catch (error) {
        push({
          title: "Erro ao salvar",
          description:
            error instanceof Error ? error.message : "Tente novamente.",
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
          if (response.status === 404) {
            push({
              title: "Sessão expirada",
              description: "Volte para a landing e gere um novo workspace.",
              variant: "destructive",
            });
            return;
          }
          throw new Error("Failed to remove note");
        }
        await onNotesChanged();
        push({ title: "Nota removida", variant: "success" });
      } catch (error) {
        push({
          title: "Erro ao remover",
          description:
            error instanceof Error ? error.message : "Tente novamente.",
          variant: "destructive",
        });
      }
    });
  };

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Notas rápidas</h3>
        <p className="text-sm text-slate-500">
          Capture aprendizados e próximos passos enquanto revisa os tiles.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex flex-col gap-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Título (ex: Pitch inicial)"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Note content"
          rows={4}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
        >
          {isPending ? "Saving..." : "Add note"}
        </button>
      </form>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-slate-500">
            No notes recorded. Start by adding the main highlights.
          </p>
        ) : (
          notes.map((note) => (
            <article
              key={note.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    {note.title || "Sem título"}
                  </h4>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                    {note.content}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(note.id)}
                  className="rounded-lg border border-transparent px-2 py-1 text-xs text-slate-400 transition hover:border-red-200 hover:text-red-500"
                >
                  Excluir
                </button>
              </div>
              <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                Atualizada em {new Date(note.updatedAt).toLocaleDateString("pt-BR")}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

