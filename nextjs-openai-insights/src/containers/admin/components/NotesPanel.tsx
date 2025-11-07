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
        description: "Adicione um título ou conteúdo antes de salvar.",
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
          throw new Error("Não foi possível salvar a nota");
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
          throw new Error("Falha ao remover nota");
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
    <section className="flex flex-col gap-5 rounded-3xl border border-slate-800/70 bg-slate-900/50 p-6 shadow-lg shadow-cyan-500/5">
      <div>
        <h3 className="text-lg font-semibold text-slate-100">Notas rápidas</h3>
        <p className="text-sm text-slate-400">
          Capture aprendizados e próximos passos enquanto revisa os tiles.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex flex-col gap-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Título (ex: Pitch inicial)"
          className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Conteúdo da nota"
          rows={4}
          className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Salvando..." : "Adicionar nota"}
        </button>
      </form>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhuma nota registrada. Comece adicionando os principais highlights.
          </p>
        ) : (
          notes.map((note) => (
            <article
              key={note.id}
              className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">
                    {note.title || "Sem título"}
                  </h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400 whitespace-pre-line">
                    {note.content}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(note.id)}
                  className="rounded-lg border border-transparent px-2 py-1 text-xs text-slate-500 transition hover:border-red-500/40 hover:text-red-300"
                >
                  Excluir
                </button>
              </div>
              <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-slate-600">
                Atualizada em {new Date(note.updatedAt).toLocaleDateString("pt-BR")}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

