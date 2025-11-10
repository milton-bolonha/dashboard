"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Copy, Linkedin, Loader2, RefreshCw } from "lucide-react";

import type { Contact, ContactOutreachTile } from "@/lib/types";

interface ContactDetailModalProps {
  contact: Contact;
  onClose: () => void;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

type OutreachKey = "contactInsights" | "emailPitch" | "coldCallScript";

const OUTREACH_METADATA: Record<
  OutreachKey,
  { title: string; description: string; accent: string }
> = {
  contactInsights: {
    title: "Contact insights",
    description:
      "Persona, responsibilities, KPIs and motivators tailored to this contact.",
    accent: "border-[#FFE1C9] bg-[#FFF7F0]",
  },
  emailPitch: {
    title: "Email pitch",
    description: "Personalized cold email draft referencing current goals.",
    accent: "border-[#D9D2FF] bg-[#F7F5FF]",
  },
  coldCallScript: {
    title: "Cold call script",
    description: "Opening hook, discovery questions and objection handling.",
    accent: "border-[#FFD3CC] bg-[#FFF4F2]",
  },
};

export function ContactDetailModal({
  contact,
  onClose,
  onRegenerate,
  isRegenerating,
}: ContactDetailModalProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!copiedKey) return;
    const timeout = window.setTimeout(() => setCopiedKey(null), 1600);
    return () => window.clearTimeout(timeout);
  }, [copiedKey]);

  const handleCopy = async (tile: ContactOutreachTile | undefined, key: string) => {
    if (!tile?.content) return;
    try {
      await navigator.clipboard.writeText(tile.content);
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

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-sm"
        onClick={handleClose}
      >
        <aside
          className={`relative flex h-full w-full max-w-[760px] flex-col overflow-hidden border-l border-[#EFEFEF] bg-white shadow-[0_20px_60px_rgba(15,23,42,0.18)] transition-transform duration-200 ${
            isVisible ? "translate-x-0" : "translate-x-full"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <header className="flex flex-shrink-0 items-start justify-between gap-4 border-b border-[#EFEFEF] px-6 py-5">
            <div className="space-y-1">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#A6A6A6]">
                Contact detail
              </span>
              <h2 className="text-2xl font-semibold text-[#1f1f1f]">{contact.name}</h2>
              {contact.jobTitle ? (
                <p className="text-sm text-[#676767]">{contact.jobTitle}</p>
              ) : null}
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#676767]">
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
                    className="inline-flex items-center gap-1 font-semibold text-[#5246E9] transition hover:text-[#362be3]"
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
                className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-[#E2E0FF] px-4 text-sm font-semibold text-[#3127ba] transition hover:border-[#C7C1FF] hover:bg-[#F3F2FF] disabled:cursor-not-allowed disabled:text-[#B4B0F8]"
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
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[#EDEDED] text-[#2d2d2d] transition hover:bg-[#f7f7f7]"
                aria-label="Close contact modal"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            </div>
          </header>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-6 py-6 bg-white">
              <div className="space-y-4">
                {(Object.keys(OUTREACH_METADATA) as OutreachKey[]).map((key) => {
                  const tile = outreach[key];
                  const metadata = OUTREACH_METADATA[key];
                  return (
                    <section
                      key={key}
                      className={`rounded-2xl border ${metadata.accent} p-5 shadow-sm`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-[#5246E9]">
                            {metadata.title}
                          </h3>
                          <p className="text-sm text-[#616161]">{metadata.description}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopy(tile, key)}
                          disabled={!tile?.content}
                          className="inline-flex h-9 items-center gap-2 rounded-full border border-[#E5E4FF] px-3 text-xs font-semibold text-[#5246E9] transition hover:bg-[#F5F4FF] disabled:cursor-not-allowed disabled:text-[#B4AEFF]"
                        >
                          <Copy className="h-3.5 w-3.5" />
                          {copiedKey === key ? "Copied" : "Copy"}
                        </button>
                      </div>
                      <div className="mt-4 rounded-xl bg-white/90 px-4 py-3 text-sm leading-relaxed text-[#2f2f2f]">
                        {tile?.content?.trim()?.length
                          ? tile.content
                          : "No insight generated yet. Refresh outreach to create this view."}
                      </div>
                      <div className="mt-3 text-[0.65rem] uppercase tracking-[0.28em] text-[#8B83F2]">
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

            <footer className="border-t border-[#EFEFEF] px-6 py-4 text-xs text-[#7d7d7d]">
              Insights combine AI output with your workspace notes to keep context synced.
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


