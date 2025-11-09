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
    <section className="rounded-3xl border border-[#F4C8A7] bg-[#FFF3E7] p-6 shadow-[0px_12px_32px_rgba(244,200,167,0.25)]">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#B35416]">Deal notes</h3>
          <p className="text-sm text-[#966244]">
            Capture headlines, objections and next steps while triaging insights.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-white/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-[#C96A22]">
          {notes.length} saved
        </span>
      </div>

      <form onSubmit={handleCreate} className="mt-5 space-y-3">
        <div className="flex flex-col gap-3 md:flex-row">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Headline or signal"
            className="flex-1 border-b border-[#F2B385] bg-transparent px-1 py-2 text-sm font-semibold text-[#D16224] placeholder-[#D16224]/60 transition focus:border-[#F08C4D] focus:outline-none"
          />
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-full bg-[#FF7A2A] px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-[#ff6711] disabled:cursor-not-allowed disabled:bg-[#FFB794]"
          >
            {isPending ? "Saving…" : "Add note"}
          </button>
        </div>
        <textarea
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="Add context, key stakeholders or follow-up tasks…"
          rows={3}
          className="h-28 w-full resize-none rounded-2xl bg-white/70 px-4 py-3 text-sm text-[#5F3A22] shadow-inner focus:outline-none focus:ring-2 focus:ring-[#FAC197]"
        />
      </form>

      <div className="mt-6 space-y-3">
        {notes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#F3C7A5] bg-white/60 px-4 py-6 text-center text-sm text-[#A86A3A]">
            Nenhuma nota registrada ainda. Use esta área para registrar sinais importantes, objeções e próximos passos enquanto analisa os tiles.
          </div>
        ) : (
          notes.map((note) => (
            <article
              key={note.id}
              className="group flex items-start justify-between gap-4 rounded-2xl border border-[#F2C9A8] bg-white/90 px-4 py-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex-1 space-y-2">
                <h4 className="text-sm font-semibold text-[#B35416]">
                  {note.title || "Sem título"}
                </h4>
                <p className="whitespace-pre-line text-sm leading-relaxed text-[#5B442F]">
                  {note.content}
                </p>
                <span className="inline-flex items-center rounded-full bg-[#FFF1E5] px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#C96A22]">
                  Updated{" "}
                  {new Date(note.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(note.id)}
                className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-transparent text-[#A16A3E] transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                aria-label="Remover nota"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

