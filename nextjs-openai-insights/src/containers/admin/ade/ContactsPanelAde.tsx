"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";

import type { Contact } from "@/lib/types";
import { useToast } from "@/lib/state/toast-context";

interface ContactsPanelAdeProps {
  contacts: Contact[];
  onContactsChanged: () => Promise<void>;
  onAddContact: () => void;
}

export function ContactsPanelAde({
  contacts,
  onContactsChanged,
  onAddContact,
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
          throw new Error("Falha ao remover contato");
        }
        await onContactsChanged();
        push({ title: "Contato removido", variant: "success" });
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
    <section className="rounded-3xl border border-[#CDC4FF] bg-[#F6F4FF] p-6 shadow-[0px_10px_30px_rgba(139,126,255,0.15)]">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#4138A3]">Target contacts</h3>
          <p className="text-sm text-[#6B63C7]">
            Registre decisores e ponteiros para acelerar cadências multicanal.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddContact}
          className="inline-flex items-center rounded-full bg-[#5246E9] px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-white shadow-lg transition hover:bg-[#4337d8]"
        >
          + Add contact
        </button>
      </div>

      <div className="mt-6 space-y-3">
        {contacts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#B6AEFF] bg-white/70 px-4 py-6 text-center text-sm text-[#5B53B9]">
            Nenhum contato salvo. Use o botão “Add contact” para trazer decisores,
            mobilizadores internos e aliados que possam acelerar a conversa.
          </div>
        ) : (
          contacts.map((contact) => (
            <article
              key={contact.id}
              className="flex items-start justify-between gap-4 rounded-2xl border border-[#C7C1FF] bg-white/90 px-4 py-4 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-[#443BAE]">{contact.name}</h4>
                {contact.jobTitle ? (
                  <p className="text-sm text-[#6B63C7]">{contact.jobTitle}</p>
                ) : null}
                {contact.linkedinUrl ? (
                  <a
                    href={contact.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-[#4338D0] transition hover:text-[#2c20b6]"
                  >
                    <span>LinkedIn</span>
                    <span aria-hidden>↗</span>
                  </a>
                ) : null}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#9189F8]">
                  Added{" "}
                  {new Date(contact.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => handleDelete(contact.id)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-transparent text-[#7A72E7] transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed"
                  disabled={isPending}
                  aria-label="Remover contato"
                >
                  {isPending ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

