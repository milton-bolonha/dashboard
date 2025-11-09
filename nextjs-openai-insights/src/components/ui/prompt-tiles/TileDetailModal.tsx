import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Copy,
  SendHorizontal,
  User,
} from "lucide-react";

import type { Tile, TileMessage } from "@/lib/types";

interface TileDetailModalProps {
  tile: Tile;
  onClose: () => void;
  onSubmit: (message: string) => Promise<void>;
  isSubmitting: boolean;
}

export function TileDetailModal({
  tile,
  onClose,
  onSubmit,
  isSubmitting,
}: TileDetailModalProps) {
  const [message, setMessage] = useState("");
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1500);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  const history = useMemo<TileMessage[]>(() => {
    if (Array.isArray(tile.history) && tile.history.length > 0) {
      return tile.history;
    }
    return [
      {
        id: `${tile.id}_prompt`,
        role: "user",
        content: tile.prompt,
        createdAt: tile.createdAt,
      },
      {
        id: `${tile.id}_assistant`,
        role: "assistant",
        content: tile.content,
        createdAt: tile.updatedAt,
      },
    ].filter((entry) => entry.content && entry.content.trim().length > 0);
  }, [tile.content, tile.createdAt, tile.history, tile.id, tile.prompt, tile.updatedAt]);

  const formatTimestamp = (value: string | undefined) => {
    if (!value) return "N/A";
    try {
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value));
    } catch {
      return value;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    await onSubmit(trimmed);
    setMessage("");
  };

  const handleRequestClose = () => {
    setIsVisible(false);
    window.setTimeout(onClose, 180);
  };

  const handleCopyPrompt = async () => {
    if (!tile.prompt || tile.prompt.trim().length === 0) return;
    try {
      await navigator.clipboard.writeText(tile.prompt);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const renderHistoryEntry = (entry: TileMessage) => {
    const timestamp = formatTimestamp(entry.createdAt ?? tile.updatedAt);
    if (entry.role === "assistant") {
      return (
        <div key={entry.id} className="flex items-start gap-3">
          <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#FFE7D6] text-[#E76F25]">
            <Bot className="h-4 w-4" />
          </div>
          <div className="max-w-xl rounded-2xl rounded-bl-md border border-orange-200 bg-white px-4 py-3 shadow-sm">
            <p className="text-sm leading-relaxed text-[#2f2f2f] whitespace-pre-wrap">
              {entry.content}
            </p>
            <span className="mt-2 block text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#b97a42]">
              {timestamp}
            </span>
          </div>
        </div>
      );
    }

    if (entry.role === "system") {
      return (
        <div key={entry.id} className="flex justify-center">
          <div className="rounded-full bg-[#FFF1E7] px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#c96418]">
            {entry.content}
          </div>
        </div>
      );
    }

    return (
      <div key={entry.id} className="flex justify-end">
        <div className="max-w-xl rounded-2xl rounded-br-md border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <p className="text-sm leading-relaxed text-[#1f1f1f] whitespace-pre-wrap">
            {entry.content}
          </p>
          <span className="mt-2 flex items-center justify-end gap-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#a1a1a1]">
            <User className="h-3 w-3" />
            {timestamp}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm"
      onClick={handleRequestClose}
    >
      <aside
        className={`relative flex h-full w-full max-w-[780px] flex-col overflow-hidden border-l border-orange-200 bg-white shadow-[0_20px_60px_rgba(17,24,39,0.2)] transition-transform duration-200 ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-orange-100 bg-gradient-to-r from-[#FFE8DA] via-[#FFF4EC] to-[#FFE0CC] px-6 py-5">
          <div className="space-y-2">
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[#EB6A1F]">
              Insight detail · {tile.templateTileId ?? "custom"}
            </span>
            <h2 className="text-2xl font-semibold text-[#1f1f1f] leading-tight">
              {tile.title}
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#6d6d6d]">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#FFE7D6] px-3 py-1 font-semibold uppercase tracking-[0.3em] text-[#EA6C1F]">
                {tile.model}
              </span>
              {tile.category ? (
                <span className="rounded-full bg-[#F5F5F5] px-3 py-1 font-semibold uppercase tracking-[0.3em] text-[#5d5d5d]">
                  {tile.category}
                </span>
              ) : null}
              <span>Created {formatTimestamp(tile.createdAt)}</span>
              <span>Updated {formatTimestamp(tile.updatedAt)}</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#F4C7A6] bg-white text-[#E46B1F] transition hover:bg-[#FFE8D5]"
            aria-label="Close detail modal"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        </header>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto bg-[#FFF8F3] px-6 py-6">
            <div className="space-y-5">
              {history.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-orange-200 bg-white/70 px-4 py-6 text-center text-sm text-[#a86a3a]">
                  No conversation captured for this tile yet. Generate follow-up prompts to
                  build a thread.
                </div>
              ) : (
                history.map(renderHistoryEntry)
              )}
            </div>

            <section className="mt-8 rounded-2xl border border-orange-200 bg-white/95 p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.32em] text-[#EA6C1F]">
                    Prompt sent to OpenAI
                  </h3>
                  <p className="text-[12px] text-[#80634e]">
                    This is the exact instruction used to generate the latest response.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="inline-flex items-center gap-2 rounded-full border border-[#F3C8A9] px-3 py-1 text-xs font-semibold text-[#C55E16] transition hover:bg-[#FFF2E5] disabled:opacity-60"
                  disabled={!tile.prompt}
                >
                  <Copy className="h-3 w-3" />
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>
              <pre className="mt-3 max-h-64 overflow-y-auto whitespace-pre-wrap rounded-xl bg-[#FFF3E4] px-4 py-3 text-[13px] leading-relaxed text-[#5a3112]">
                {tile.prompt && tile.prompt.trim().length > 0
                  ? tile.prompt
                  : "Prompt details are not available for this session."}
              </pre>
            </section>
          </div>

          <footer className="border-t border-orange-100 bg-white px-6 py-4">
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <label htmlFor="tile-follow-up" className="sr-only">
                Ask a follow-up question
              </label>
              <div className="rounded-2xl border border-orange-200 bg-[#FFF8F3] shadow-inner">
                <textarea
                  id="tile-follow-up"
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Ask the AI to deepen this insight, request missing data, or craft follow-up messaging…"
                  className="h-28 w-full resize-none rounded-2xl border-none bg-transparent px-4 py-3 text-sm text-[#2d2d2d] outline-none focus:ring-2 focus:ring-orange-300"
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-xs text-[#9c9c9c]">
                  Follow-up prompts keep the same context and generate additional insights instantly.
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting || message.trim().length === 0}
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[#FF7A2A] text-white shadow-lg transition hover:bg-[#ff6811] disabled:cursor-not-allowed disabled:bg-[#FFB694]"
                  aria-label="Send follow-up"
                >
                  {isSubmitting ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white" />
                  ) : (
                    <SendHorizontal className="h-5 w-5" />
                  )}
                </button>
              </div>
            </form>
          </footer>
        </div>
      </aside>
    </div>
  );
}

