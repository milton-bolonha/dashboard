"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bot,
  Copy,
  Linkedin,
  Loader2,
  RefreshCw,
  SendHorizontal,
  User,
} from "lucide-react";

import type { Contact, TileMessage } from "@/lib/types";

interface ContactDetailModalProps {
  contact: Contact;
  onClose: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
  onSubmitChat: (message: string) => Promise<void> | void;
  isChatting: boolean;
}

type OutreachKey = "contactInsights" | "emailPitch" | "coldCallScript";

const OUTREACH_METADATA: Record<OutreachKey, { title: string; description: string }> = {
  contactInsights: {
    title: "Contact insights",
    description: "Persona, responsibilities, KPIs and motivators tailored to this contact.",
  },
  emailPitch: {
    title: "Email pitch",
    description: "Personalized cold email draft referencing current goals.",
  },
  coldCallScript: {
    title: "Cold call script",
    description: "Opening hook, discovery questions and objection handling.",
  },
};

const formatTimestamp = (value?: string) => {
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
    return value ?? "N/A";
  }
};

export function ContactDetailModal({
  contact,
  onClose,
  onRegenerate,
  isRegenerating,
  onSubmitChat,
  isChatting,
}: ContactDetailModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!copiedKey) return;
    const timeout = window.setTimeout(() => setCopiedKey(null), 1600);
    return () => window.clearTimeout(timeout);
  }, [copiedKey]);

  const handleCopyText = async (content: string | undefined, key: string) => {
    if (!content?.trim().length) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopiedKey(key);
    } catch {
      setCopiedKey(null);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    window.setTimeout(onClose, 180);
  };

  const outreach = contact.outreach ?? {};

  const history = useMemo<TileMessage[]>(() => {
    if (Array.isArray(contact.chatHistory) && contact.chatHistory.length > 0) {
      return contact.chatHistory.map((entry) => ({
        ...entry,
        role:
          entry.role === "assistant" || entry.role === "system" || entry.role === "user"
            ? entry.role
            : "assistant",
      }));
    }
    const insight = contact.outreach?.contactInsights?.content;
    if (insight?.trim().length) {
      return [
        {
          id: `${contact.id}_insight_baseline`,
          role: "assistant" as const,
          content: insight,
          createdAt:
            contact.outreach?.contactInsights?.updatedAt ?? contact.createdAt,
        },
      ];
    }
    return [];
  }, [contact.chatHistory, contact.id, contact.createdAt, contact.outreach]);

  const handleSubmitChat = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = message.trim();
    if (!trimmed) return;
    await onSubmitChat(trimmed);
    setMessage("");
  };

  const renderHistoryEntry = (entry: TileMessage) => {
    const timestamp = formatTimestamp(entry.createdAt ?? contact.createdAt);
    const copyLabel = copiedKey === entry.id ? "Copied" : "Copy";

    if (entry.role === "assistant") {
      return (
        <div key={entry.id} className="flex items-start gap-3">
          <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#f2f2f2] text-[#242424]">
            <Bot className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <div className="max-w-xl rounded-2xl border border-[#efefef] bg-[#f9f9f9] px-4 py-3 shadow-sm">
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#2f2f2f]">
                {entry.content}
              </p>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#9f9f9f]">
              <span>{timestamp}</span>
              <button
                type="button"
                onClick={() => handleCopyText(entry.content, entry.id)}
                className="group inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-[#7d7d7d] transition hover:border-black/10 hover:text-black cursor-pointer"
                aria-label="Copy assistant reply"
              >
                <Copy className="h-3.5 w-3.5" />
                <span className="opacity-0 transition-opacity group-hover:opacity-100">
                  {copyLabel}
                </span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={entry.id} className="flex justify-end">
        <div className="flex max-w-xl flex-col items-end">
          <div className="w-full rounded-2xl border border-[#efefef] bg-white px-4 py-3 shadow-sm">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#1f1f1f]">
              {entry.content}
            </p>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.32em] text-[#9f9f9f]">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {timestamp}
            </span>
            <button
              type="button"
              onClick={() => handleCopyText(entry.content, entry.id)}
              className="group inline-flex items-center gap-1 rounded-full border border-transparent px-3 py-1 text-[#7d7d7d] transition hover:border-black/10 hover:text-black cursor-pointer"
              aria-label="Copy message"
            >
              <Copy className="h-3.5 w-3.5" />
              <span className="opacity-0 transition-opacity group-hover:opacity-100">
                {copyLabel}
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm"
        onClick={handleClose}
      >
        <aside
          className={`relative flex h-full w-full max-w-[760px] flex-col overflow-hidden rounded-bl-[32px] rounded-tl-[32px] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] transition-transform duration-200 ${isVisible ? "translate-x-0" : "translate-x-full"}`}
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex flex-shrink-0 items-start justify-between gap-4 px-8 py-6">
            <div className="space-y-2">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-[#9a9a9a]">
                Contact detail
              </span>
              <h2 className="text-2xl font-semibold text-[#1f1f1f]">{contact.name}</h2>
              {contact.jobTitle ? (
                <p className="text-sm text-[#6f6f6f]">{contact.jobTitle}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#757575]">
                <span>
                  Added{" "}
                  {new Date(contact.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                {contact.linkedinUrl ? (
                  <a
                    href={contact.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-[#1f1f1f] transition hover:text-black"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                    LinkedIn
                  </a>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onRegenerate}
                disabled={isRegenerating}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#e4e4e4] px-4 text-sm font-semibold text-[#1f1f1f] transition hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:text-[#a1a1a1]"
              >
                {isRegenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating…
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4" />
                    Refresh outreach
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4e4e4] text-[#2d2d2d] transition hover:bg-[#f5f5f5]"
                aria-label="Close contact modal"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto bg-white px-8 py-6">
              <div className="space-y-5">
                <div className="space-y-5">
                  {history.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-[#e4e4e4] bg-[#fafafa] px-4 py-6 text-center text-sm text-[#7a7a7a]">
                      No conversation captured yet. Send a prompt to generate tailored insights for this contact.
                    </div>
                  ) : (
                    history.map(renderHistoryEntry)
                  )}
                </div>

                {(Object.keys(OUTREACH_METADATA) as OutreachKey[]).map((key) => {
                  const tile = outreach[key];
                  const metadata = OUTREACH_METADATA[key];
                  return (
                    <section
                      key={key}
                      className="rounded-2xl border border-[#ededed] bg-white p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-[#5f5f5f]">
                            {metadata.title}
                          </h3>
                          <p className="text-sm text-[#6f6f6f]">{metadata.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyText(tile?.content, key)}
                          disabled={!tile?.content}
                          className="group inline-flex h-9 items-center gap-2 rounded-full border border-[#e4e4e4] px-3 text-xs font-semibold text-[#1f1f1f] transition hover:bg-[#f5f5f5] disabled:cursor-not-allowed disabled:text-[#a1a1a1] cursor-pointer"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          <span className="opacity-0 transition-opacity group-hover:opacity-100">
                            {copiedKey === key ? "Copied" : "Copy"}
                          </span>
                        </button>
                      </div>
                      <div className="mt-4 rounded-xl bg-[#f9f9f9] px-4 py-3 text-sm leading-relaxed text-[#2f2f2f]">
                        {tile?.content?.trim()?.length
                          ? tile.content
                          : "No insight generated yet. Refresh outreach to create this view."}
                      </div>
                      <div className="mt-3 text-[0.65rem] uppercase tracking-[0.28em] text-[#8a8a8a]">
                        Updated{" "}
                        {tile?.updatedAt
                          ? new Date(tile.updatedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "—"}
                      </div>
                    </section>
                  );
                })}
              </div>
            </div>

            <footer className="px-8 py-4">
              <form onSubmit={handleSubmitChat} className="space-y-3">
                <div className="rounded-2xl border border-[#e7e7e7] bg-[#f5f5f5] p-3 shadow-inner transition focus-within:border-[#d9d9d9] focus-within:bg-white">
                  <textarea
                    value={message}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Ask the AI to tailor messaging, summarize the latest insight, or suggest next steps…"
                    className="h-28 w-full resize-none border-none bg-transparent text-sm text-[#2d2d2d] outline-none focus:bg-white focus:ring-0"
                    disabled={isChatting}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[#7d7d7d]">
                    Insights combine AI output with your workspace notes to keep context synced.
                  </p>
                  <button
                    type="submit"
                    disabled={isChatting || message.trim().length === 0}
                    className="inline-flex h-10 items-center justify-center rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:bg-[#9e9e9e] whitespace-nowrap"
                    aria-label="Send follow-up"
                  >
                    {isChatting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span className="flex items-center gap-2">
                        Send
                        <SendHorizontal className="h-4 w-4" />
                      </span>
                    )}
                  </button>
                </div>
              </form>
            </footer>
          </div>
        </aside>
      </div>

      {copiedKey ? (
        <div className="pointer-events-none fixed bottom-10 right-8 z-[70] rounded-full bg-black px-4 py-2 text-xs font-semibold text-white shadow-lg">
          Copied!
        </div>
      ) : null}
    </>
  );
}
