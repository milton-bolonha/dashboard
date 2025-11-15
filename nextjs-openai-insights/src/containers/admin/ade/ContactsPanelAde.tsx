"use client";

import { useEffect, useState, useTransition } from "react";
import { GripVertical, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";

import type { AdeAppearanceTokens } from "@/lib/ade-theme";
import { hexToRgbString } from "@/lib/color";
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
  const [mounted, setMounted] = useState(false);

  // Only render after mount to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Don't render until mounted and appearance is ready
  if (!mounted || !appearance) {
    return null;
  }

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

  // Use saved values from appearance directly (like AI Insight Tiles does)
  // Fallback to defaults if not available (backward compatibility)
  // Convert to RGB format for consistency - only calculate after mount
  const headingColor = hexToRgbString(appearance.headingColor || "#1f1f1f");
  const textColor = appearance.textColor || "#2c2c2c";
  const _mutedColor = appearance.mutedTextColor || "#6f6f6f";
  const cardBorder = appearance.cardBorderColor || "#d9d9d9";
  const surfaceColor = appearance.surfaceColor || "#ffffff";

  return (
    <section className="space-y-4">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h3 className="text-lg font-semibold" style={{ color: headingColor }}>
          Target contacts
        </h3>
      </header>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {contacts.length === 0 ? (
          <button
            type="button"
            onClick={onAddContact}
            className="group relative bg-white rounded-lg h-48 border-2 border-dashed border-gray-400 hover:border-gray-500 hover:bg-gray-50 transition-all duration-200 flex flex-col items-center justify-center cursor-pointer"
            style={{ backgroundColor: surfaceColor, borderColor: cardBorder }}
          >
            <div className="flex flex-col items-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-gray-300 group-hover:bg-gray-400 transition-colors flex items-center justify-center">
                <Plus className="w-6 h-6 text-gray-600 group-hover:text-gray-700" />
              </div>
              <span
                className="text-sm font-medium"
                style={{ color: textColor }}
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
              className="group relative flex h-[220px] flex-col overflow-hidden rounded-[20px] border-2 border-dashed border-gray-400 bg-white transition-all duration-200 items-center justify-center cursor-pointer hover:border-gray-500 hover:bg-gray-50"
              style={{ backgroundColor: surfaceColor, borderColor: cardBorder }}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-gray-300 group-hover:bg-gray-400 transition-colors flex items-center justify-center">
                  <Plus className="w-6 h-6 text-gray-600 group-hover:text-gray-700" />
                </div>
                <span
                  className="text-sm font-medium"
                  style={{ color: textColor }}
                >
                  Add contact
                </span>
              </div>
            </button>
            {contacts.map((contact) => {
              const insightPreview =
                contact.outreach?.contactInsights?.content ??
                "Generate outreach to unlock insights for this contact.";
              const isRegenerating = regeneratingContactId === contact.id;

              return (
                <article
                  key={contact.id}
                  className="group relative flex min-h-[220px] flex-col rounded-2xl border overflow-hidden transition"
                  style={{ borderColor: cardBorder }}
                >
                  {/* Header branco como tiles */}
                  <div
                    className="bg-white border-b pb-3 px-4 pt-4"
                    style={{ borderColor: "#e4e4e7" }}
                  >
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <h4 className="truncate text-base font-semibold text-[#1f1f1f]">
                        {contact.name}
                      </h4>
                      {contact.jobTitle ? (
                        <span className="truncate text-sm font-medium text-[#6f6f6f]">
                          {contact.jobTitle}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {/* Body cinza claro como tiles */}
                  <button
                    type="button"
                    onClick={() => onOpenContact(contact)}
                    className="flex flex-1 cursor-pointer flex-col justify-between text-left transition bg-[#f5f5f5] px-4 pb-4"
                  >
                    <p
                      className="text-sm leading-relaxed text-[#2f2f2f]"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 6,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
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
