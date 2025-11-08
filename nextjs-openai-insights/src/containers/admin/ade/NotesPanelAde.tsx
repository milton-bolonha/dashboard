"use client";

import { useState, useTransition } from "react";

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
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Notas</h3>
        <button
          type="button"
          disabled
          className="flex h-16 w-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-500 transition hover:border-gray-400"
        >
          Nova nota (em breve)
        </button>
      </div>

      <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-2">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Título"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none transition focus:border-gray-500"
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Conteúdo"
          rows={3}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none transition focus:border-gray-500 md:col-span-2"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:bg-gray-600"
        >
          {isPending ? "Salvando..." : "Adicionar nota"}
        </button>
      </form>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhuma nota registrada. Capture os principais pontos enquanto revisa os tiles.
          </p>
        ) : (
          notes.map((note) => (
            <article
              key={note.id}
              className="rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">
                    {note.title || "Sem título"}
                  </h4>
                  <p className="mt-2 whitespace-pre-line text-sm text-gray-600">
                    {note.content}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(note.id)}
                  className="text-xs text-gray-500 transition hover:text-red-500"
                >
                  Remover
                </button>
              </div>
              <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-gray-500">
                Atualizada em {new Date(note.updatedAt).toLocaleDateString("pt-BR")}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

