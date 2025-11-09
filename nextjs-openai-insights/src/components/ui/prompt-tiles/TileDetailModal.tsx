import { useState } from "react";
import { X, SendHorizontal } from "lucide-react";

import type { Tile, TileMessage } from "@/lib/types";

interface TileDetailModalProps {
  tile: Tile;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
  isSubmitting: boolean;
}

function labelForRole(role: TileMessage["role"]) {
  switch (role) {
    case "assistant":
      return "AI analyst";
    case "system":
      return "Context";
    default:
      return "You";
  }
}

export function TileDetailModal({
  tile,
  onClose,
  onSubmit,
  isSubmitting,
}: TileDetailModalProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    await onSubmit(trimmed);
    setMessage("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur">
      <div className="relative flex h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-orange-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-orange-100 bg-gradient-to-r from-orange-500 to-amber-400 px-8 py-6 text-white">
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-[0.3em] text-white/70">
              Prompt template · {tile.templateTileId ?? "custom"}
            </span>
            <h2 className="text-2xl font-semibold leading-tight">{tile.title}</h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/80">
              <span className="rounded-full border border-white/30 px-3 py-1 font-medium uppercase tracking-widest">
                {tile.model}
              </span>
              <span>
                Created {new Date(tile.createdAt).toLocaleString("en-US")}
              </span>
              <span>
                Updated {new Date(tile.updatedAt).toLocaleString("en-US")}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/30 bg-white/10 p-2 text-white transition hover:bg-white hover:text-orange-500"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex flex-1 flex-col gap-6 overflow-y-auto px-8 py-6">
          <section className="rounded-2xl border border-orange-100 bg-orange-50/60 p-5">
            <h3 className="text-sm font-semibold text-orange-700">
              Prompt sent to OpenAI
            </h3>
            <pre className="mt-2 whitespace-pre-wrap text-sm text-orange-800">
              {tile.prompt}
            </pre>
          </section>

          <section className="flex flex-col gap-4">
            <h3 className="text-base font-semibold text-slate-800">
              Conversation
            </h3>
            <div className="space-y-4">
              {tile.history.map((entry) => (
                <article
                  key={entry.id}
                  className={`rounded-2xl border px-4 py-3 ${
                    entry.role === "assistant"
                      ? "border-orange-200 bg-orange-50"
                      : entry.role === "user"
                      ? "border-slate-200 bg-white"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                      {labelForRole(entry.role)}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(entry.createdAt).toLocaleString("en-US")}
                    </span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                    {entry.content}
                  </p>
                </article>
              ))}
            </div>
          </section>
        </div>

        <footer className="border-t border-orange-100 bg-white px-8 py-5">
          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-3"
          >
            <div className="flex-1">
              <label htmlFor="tile-follow-up" className="sr-only">
                Ask a follow-up question
              </label>
              <textarea
                id="tile-follow-up"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Ask the AI to go deeper, request missing data, or suggest next steps…"
                className="h-24 w-full rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
                disabled={isSubmitting}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting || message.trim().length === 0}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500 text-white shadow-md transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-orange-300"
              aria-label="Send follow-up"
            >
              {isSubmitting ? (
                <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
              ) : (
                <SendHorizontal className="h-5 w-5" />
              )}
            </button>
          </form>
        </footer>
      </div>
    </div>
  );
}

