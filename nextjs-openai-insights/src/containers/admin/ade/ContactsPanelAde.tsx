"use client";

import { useTransition } from "react";
import { ChevronRight, Loader2, Plus, RefreshCw, Trash2 } from "lucide-react";

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
          className="inline-flex items-center gap-2 rounded-full border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-gray-700 transition hover:border-gray-400 hover:text-gray-900"
        >
          <PlusIcon />
          Add contact
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-300 px-4 py-8 text-center text-sm text-gray-500">
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
                className="group relative flex min-h-[220px] flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-3 pb-3">
                  <div className="min-w-0 space-y-1">
                    <h4 className="truncate text-base font-semibold text-gray-900">
                      {contact.name}
                    </h4>
                    {contact.jobTitle ? (
                      <p className="truncate text-sm text-gray-500">{contact.jobTitle}</p>
                    ) : null}
                    {contact.linkedinUrl ? (
                      <a
                        href={contact.linkedinUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 transition hover:text-indigo-800"
                        onClick={(event) => event.stopPropagation()}
                      >
                        LinkedIn
                        <span aria-hidden>↗</span>
                      </a>
                    ) : null}
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-gray-600">
                      Added{" "}
                      {new Date(contact.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onRegenerateContact(contact.id)}
                      disabled={isRegenerating || isPending}
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-600 transition hover:border-gray-300 hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-60"
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
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-gray-200 text-gray-500 transition hover:border-red-200 hover:text-red-500 disabled:cursor-not-allowed"
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
                </div>

                <button
                  type="button"
                  onClick={() => onOpenContact(contact)}
                  className="flex flex-1 flex-col justify-between text-left"
                >
                  <p
                    className="text-sm leading-relaxed text-gray-700"
                    style={{
                      display: "-webkit-box",
                      WebkitLineClamp: 6,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {insightPreview}
                  </p>
                  <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 transition group-hover:text-indigo-800">
                    View outreach
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </button>

                {isRegenerating ? (
                  <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/80 backdrop-blur-sm">
                    <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
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

