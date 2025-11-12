"use client";

import { useTransition } from "react";
import { GripVertical, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";

import type { AdeAppearanceTokens } from "@/lib/ade-theme";
import type { Contact } from "@/lib/types";
import { useToast } from "@/lib/state/toast-context";

interface ContactsPanelAdeProps {
  appearance: AdeAppearanceTokens;
  contacts: Contact[];
  onContactsChanged: () => Promise<void>;
  onAddContact: () => void;
  onRegenerateContact: (contactId: string) => void;
  regeneratingContactId?: string | null;
  onOpenContact: (contact: Contact) => void;
}

export function ContactsPanelAde({
  appearance,
  contacts,
  onContactsChanged,
  onAddContact,
  onRegenerateContact,
  regeneratingContactId,
  onOpenContact,
}: ContactsPanelAdeProps) {
  const { push } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleDelete = (contactId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/workspace/contacts/${contactId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          throw new Error("Failed to remove contact");
        }
        await onContactsChanged();
        push({ title: "Contact removed", variant: "success" });
      } catch (error) {
        push({
          title: "Removal failed",
          description:
            error instanceof Error ? error.message : "Try again shortly.",
          variant: "destructive",
        });
      }
    });
  };

  const headingColor = appearance.headingColor ?? "#1f1f1f";
  const textColor = appearance.textColor ?? "#2c2c2c";
  const mutedColor = appearance.mutedTextColor ?? "#6f6f6f";
  const cardBorder = appearance.cardBorderColor ?? "#d9d9d9";
  const surfaceColor = appearance.surfaceColor ?? "#ffffff";
  // No longer used - removed paragraph as requested

  return (
    <section className="space-y-4" suppressHydrationWarning>
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-lg font-semibold" style={{ color: headingColor || "#000000" }} suppressHydrationWarning>
          Target contacts
        </h3>
        <span
          className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em]"
          style={{ borderColor: cardBorder, color: mutedColor }}
          suppressHydrationWarning
        >
          {contacts.length} saved
        </span>
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {contacts.length === 0 ? (
          <button
            type="button"
            onClick={onAddContact}
            className="group relative bg-white rounded-lg h-48 border-2 border-dashed border-gray-400 hover:border-gray-500 hover:bg-gray-50 transition-all duration-200 flex flex-col items-center justify-center cursor-pointer"
            style={{ backgroundColor: surfaceColor, borderColor: cardBorder }}
            suppressHydrationWarning
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-300 group-hover:bg-gray-400 transition-colors flex items-center justify-center">
                <Plus className="w-6 h-6 text-gray-600 group-hover:text-gray-700" />
              </div>
              <span 
                className="text-sm font-medium" 
                style={{ color: textColor }}
                suppressHydrationWarning
              >
                Add contact
              </span>
            </div>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onAddContact}
              className="group flex min-h-[220px] flex-col justify-between rounded-2xl border-2 border-dashed px-4 py-5 text-left transition hover:border-black/40 hover:bg-black/5"
              style={{ borderColor: cardBorder, backgroundColor: surfaceColor, color: textColor }}
              suppressHydrationWarning
            >
              <div className="space-y-3">
                <span className="inline-flex items-center gap-2 rounded-full bg-black px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-white">
                  <Plus className="h-3.5 w-3.5" />
                  New contact
                </span>
              </div>
              <span 
                className="text-sm font-semibold group-hover:underline"
                style={{ color: textColor }}
                suppressHydrationWarning
              >
                Add contact
              </span>
            </button>
            {contacts.map((contact) => {
            const insightPreview =
              contact.outreach?.contactInsights?.content ??
              "Generate outreach to unlock insights for this contact.";
            const isRegenerating = regeneratingContactId === contact.id;

            return (
              <article
                key={contact.id}
                className="group relative flex min-h-[220px] flex-col rounded-2xl border p-4 transition"
                style={{ borderColor: cardBorder, backgroundColor: surfaceColor, color: textColor }}
                suppressHydrationWarning
              >
                <div className="border-b pb-3" style={{ borderColor: cardBorder }} suppressHydrationWarning>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <h4 className="truncate text-base font-semibold" style={{ color: headingColor }} suppressHydrationWarning>
                      {contact.name}
                    </h4>
                    {contact.jobTitle ? (
                      <span className="truncate text-sm font-medium" style={{ color: mutedColor }} suppressHydrationWarning>
                        {contact.jobTitle}
                      </span>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpenContact(contact)}
                  className="flex flex-1 cursor-pointer flex-col justify-between text-left transition hover:text-black"
                  style={{ color: textColor }}
                  suppressHydrationWarning
                >
                  <p
                    className="text-sm leading-relaxed"
                    suppressHydrationWarning
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 6,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      color: mutedColor,
                    }}
                  >
                    {insightPreview}
                  </p>
                  <span className="sr-only">Open contact detail</span>
                </button>

                <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
                  <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-[#303030] ring-1 ring-black/5 transition hover:text-black cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4" />
                    <span>Drag</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRegenerateContact(contact.id)}
                    disabled={isRegenerating || isPending}
                    className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#1f1f1f] ring-1 ring-black/5 transition hover:text-black disabled:cursor-not-allowed disabled:text-[#a1a1a1] cursor-pointer"
                    aria-label="Regenerate outreach"
                  >
                    {isRegenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(contact.id)}
                    className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-[#8a8a8a] ring-1 ring-black/5 transition hover:text-red-500 disabled:cursor-not-allowed cursor-pointer"
                    disabled={isPending}
                    aria-label="Remove contact"
                  >
                    {isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {isRegenerating ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-black" />
                  </div>
                ) : null}
              </article>
            );
          })}
          </>
        )}
      </div>
    </section>
  );
}

