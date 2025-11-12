"use client";

import { useState, useTransition } from "react";

import type { Note } from "@/lib/types";
import { useToast } from "@/lib/state/toast-context";

interface NotesPanelDashProps {
  notes: Note[];
  onNotesChanged: () => Promise<void>;
}

export function NotesPanelDash({ notes, onNotesChanged }: NotesPanelDashProps) {
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
    <section className="flex flex-col gap-5 rounded-xl border border-[#d9d9de] bg-white px-5 py-6 shadow-sm">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-[#1f2024]">Notas rápidas</h3>
        <p className="text-sm text-[#5a5b60]">
          Capture insights durante a análise. Tudo fica salvo instantaneamente nos cookies.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex flex-col gap-3">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Título"
          className="rounded-lg border border-[#dcdcde] bg-[#fdfdfd] px-4 py-2 text-sm text-[#202123] outline-none transition focus:border-[#b5b5bc]"
        />
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Note content"
          rows={4}
          className="rounded-lg border border-[#dcdcde] bg-[#fdfdfd] px-4 py-3 text-sm text-[#202123] outline-none transition focus:border-[#b5b5bc]"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md bg-[#202123] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#34343a] disabled:cursor-not-allowed disabled:bg-[#4d4e53]"
        >
          {isPending ? "Saving..." : "Add note"}
        </button>
      </form>

      <div className="space-y-3">
        {notes.length === 0 ? (
          <p className="text-sm text-[#5a5b60]">
            No notes recorded. Start by adding the main highlights.
          </p>
        ) : (
          notes.map((note) => (
            <article
              key={note.id}
              className="rounded-lg border border-[#e3e3e8] bg-[#f9f9fb] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-[#1f2024]">
                    {note.title || "Sem título"}
                  </h4>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-[#3a3a41]">
                    {note.content}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(note.id)}
                  className="rounded-md border border-transparent px-2 py-1 text-xs text-[#a15664] transition hover:border-[#f5ccd6] hover:bg-[#fce8ee] hover:text-[#792b3c]"
                >
                  Excluir
                </button>
              </div>
              <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-[#7a7a82]">
                Atualizada em {new Date(note.updatedAt).toLocaleDateString("pt-BR")}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

