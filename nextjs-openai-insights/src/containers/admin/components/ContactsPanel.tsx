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
        description: "Adicione pelo menos o nome do contato.",
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
          throw new Error("Não foi possível salvar o contato");
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
    <section className="flex flex-col gap-5 rounded-3xl border border-slate-800/70 bg-slate-900/50 p-6 shadow-lg shadow-cyan-500/5">
      <div>
        <h3 className="text-lg font-semibold text-slate-100">Contatos mapeados</h3>
        <p className="text-sm text-slate-400">
          Salve perfis críticos para os próximos passos do outreach.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex flex-col gap-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nome"
          className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
        />
        <input
          value={jobTitle}
          onChange={(event) => setJobTitle(event.target.value)}
          placeholder="Cargo"
          className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
        />
        <input
          value={linkedin}
          onChange={(event) => setLinkedin(event.target.value)}
          placeholder="URL do LinkedIn"
          className="rounded-xl border border-slate-800 bg-slate-950/60 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Salvando..." : "Adicionar contato"}
        </button>
      </form>

      <div className="space-y-3">
        {contacts.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nenhum contato salvo ainda. Comece adicionando decisores ou campeões internos.
          </p>
        ) : (
          contacts.map((contact) => (
            <article
              key={contact.id}
              className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-slate-200">
                    {contact.name}
                  </h4>
                  {contact.jobTitle ? (
                    <p className="text-sm text-slate-400">{contact.jobTitle}</p>
                  ) : null}
                  {contact.linkedinUrl ? (
                    <a
                      href={contact.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-xs text-cyan-300 transition hover:text-cyan-200"
                    >
                      LinkedIn ↗
                    </a>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(contact.id)}
                  className="rounded-lg border border-transparent px-2 py-1 text-xs text-slate-500 transition hover:border-red-500/40 hover:text-red-300"
                >
                  Remover
                </button>
              </div>
              <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-slate-600">
                Adicionado em {new Date(contact.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

