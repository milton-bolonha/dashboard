"use client";

import { useState, useTransition } from "react";

import type { Contact } from "@/lib/types";
import { useToast } from "@/lib/state/toast-context";

interface ContactsPanelProps {
  contacts: Contact[];
  onContactsChanged: () => Promise<void>;
}

export function ContactsPanel({ contacts, onContactsChanged }: ContactsPanelProps) {
  const { push } = useToast();
  const [name, setName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [linkedin, setLinkedin] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) {
      push({
        title: "Informe o nome",
        description: "Add at least the contact name.",
        variant: "destructive",
      });
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/workspace/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, jobTitle, linkedinUrl: linkedin }),
        });
        if (!response.ok) {
          if (response.status === 404) {
            push({
              title: "Sessão expirada",
              description: "Volte para a landing e gere um novo workspace.",
              variant: "destructive",
            });
            return;
          }
          throw new Error("Could not save the contact");
        }
        setName("");
        setJobTitle("");
        setLinkedin("");
        await onContactsChanged();
        push({ title: "Contato adicionado", variant: "success" });
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

  const handleDelete = (contactId: string) => {
    startTransition(async () => {
      try {
        const response = await fetch(`/api/workspace/contacts/${contactId}`, {
          method: "DELETE",
        });
        if (!response.ok) {
          if (response.status === 404) {
            push({
              title: "Sessão expirada",
              description: "Volte para a landing e gere um novo workspace.",
              variant: "destructive",
            });
            return;
          }
          throw new Error("Failed to remove contact");
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
    <section className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-slate-900">Contatos mapeados</h3>
        <p className="text-sm text-slate-500">
          Salve perfis críticos para os próximos passos do outreach.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex flex-col gap-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nome"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
        <input
          value={jobTitle}
          onChange={(event) => setJobTitle(event.target.value)}
          placeholder="Cargo"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
        <input
          value={linkedin}
          onChange={(event) => setLinkedin(event.target.value)}
          placeholder="URL do LinkedIn"
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
        >
          {isPending ? "Saving..." : "Add contact"}
        </button>
      </form>

      <div className="space-y-3">
        {contacts.length === 0 ? (
          <p className="text-sm text-slate-500">
            No contacts saved yet. Start by adding decision makers or internal champions.
          </p>
        ) : (
          contacts.map((contact) => (
            <article
              key={contact.id}
              className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-900">
                    {contact.name}
                  </h4>
                  {contact.jobTitle ? (
                    <p className="text-sm text-slate-600">{contact.jobTitle}</p>
                  ) : null}
                  {contact.linkedinUrl ? (
                    <a
                      href={contact.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-slate-600 transition hover:text-slate-900"
                    >
                      LinkedIn ↗
                    </a>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(contact.id)}
                  className="rounded-lg border border-transparent px-2 py-1 text-xs text-slate-400 transition hover:border-red-200 hover:text-red-500"
                >
                  Remover
                </button>
              </div>
              <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-slate-400">
                Adicionado em {new Date(contact.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

