"use client";

import { useTransition } from "react";
import { GripVertical, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";

import type { Contact } from "@/lib/types";
import { useToast } from "@/lib/state/toast-context";

interface ContactsPanelAdeProps {
  contacts: Contact[];
  onContactsChanged: () => Promise<void>;
  onAddContact: () => void;
  onRegenerateContact: (contactId: string) => void;
  regeneratingContactId?: string | null;
  onOpenContact: (contact: Contact) => void;
}

export function ContactsPanelAde({
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

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Target contacts</h3>
          <p className="text-sm text-gray-500">
            Key decision makers and champions to accelerate your outreach.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddContact}
          className="inline-flex items-center gap-2 rounded-full bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-[#1a1a1a]"
        >
          <PlusIcon />
          Add contact
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-dashed border-[#d9d9d9] bg-white px-4 py-6 text-center text-sm text-[#6f6f6f]">
          No contacts saved yet. Use “Add contact” to capture stakeholders for this workspace.
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {contacts.map((contact) => {
            const insightPreview =
              contact.outreach?.contactInsights?.content ??
              "Generate outreach to unlock insights for this contact.";
            const isRegenerating = regeneratingContactId === contact.id;

            return (
              <article
                key={contact.id}
                className="group relative flex min-h-[220px] flex-col rounded-2xl border border-[#ededed] bg-white p-4 transition"
              >
                <div className="border-b border-[#f0f0f0] pb-3">
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

                <button
                  type="button"
                  onClick={() => onOpenContact(contact)}
                  className="flex flex-1 cursor-pointer flex-col justify-between text-left transition hover:text-[#1f1f1f]"
                >
                  <p
                    className="text-sm leading-relaxed text-[#3b3b3b]"
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
                  <div className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#303030] ring-1 ring-black/5 transition hover:text-black cursor-grab active:cursor-grabbing">
                    <GripVertical className="h-4 w-4" />
                    <span>Drag</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRegenerateContact(contact.id)}
                    disabled={isRegenerating || isPending}
                    className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#1f1f1f] ring-1 ring-black/5 transition hover:text-black disabled:cursor-not-allowed disabled:text-[#a1a1a1]"
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
                    className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#8a8a8a] ring-1 ring-black/5 transition hover:text-red-500 disabled:cursor-not-allowed"
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
        </div>
      )}
    </section>
  );
}

function PlusIcon() {
  return <Plus className="h-3.5 w-3.5" />;
}

