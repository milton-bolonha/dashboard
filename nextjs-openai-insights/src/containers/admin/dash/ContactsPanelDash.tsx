"use client";

import { useState, useTransition } from "react";

import type { Contact } from "@/lib/types";
import { useToast } from "@/lib/state/toast-context";

interface ContactsPanelDashProps {
  contacts: Contact[];
  onContactsChanged: () => Promise<void>;
}

export function ContactsPanelDash({
  contacts,
  onContactsChanged,
}: ContactsPanelDashProps) {
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
    <section className="flex flex-col gap-5 rounded-xl border border-[#d9d9de] bg-white px-5 py-6 shadow-sm">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-[#1f2024]">Contatos mapeados</h3>
        <p className="text-sm text-[#5a5b60]">
          Registre decisores, campeões e influenciadores. Links ficam acessíveis rapidamente.
        </p>
      </div>

      <form onSubmit={handleCreate} className="flex flex-col gap-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nome"
          className="rounded-lg border border-[#dcdcde] bg-[#fdfdfd] px-4 py-2 text-sm text-[#202123] outline-none transition focus:border-[#b5b5bc]"
        />
        <input
          value={jobTitle}
          onChange={(event) => setJobTitle(event.target.value)}
          placeholder="Cargo"
          className="rounded-lg border border-[#dcdcde] bg-[#fdfdfd] px-4 py-2 text-sm text-[#202123] outline-none transition focus:border-[#b5b5bc]"
        />
        <input
          value={linkedin}
          onChange={(event) => setLinkedin(event.target.value)}
          placeholder="URL do LinkedIn"
          className="rounded-lg border border-[#dcdcde] bg-[#fdfdfd] px-4 py-2 text-sm text-[#202123] outline-none transition focus:border-[#b5b5bc]"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-md bg-[#202123] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#34343a] disabled:cursor-not-allowed disabled:bg-[#4d4e53]"
        >
          {isPending ? "Salvando..." : "Adicionar contato"}
        </button>
      </form>

      <div className="space-y-3">
        {contacts.length === 0 ? (
          <p className="text-sm text-[#5a5b60]">
            Nenhum contato salvo ainda. Comece listando decisores e apoiadores.
          </p>
        ) : (
          contacts.map((contact) => (
            <article
              key={contact.id}
              className="rounded-lg border border-[#e3e3e8] bg-[#f9f9fb] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-[#1f2024]">
                    {contact.name}
                  </h4>
                  {contact.jobTitle ? (
                    <p className="text-sm text-[#3a3a41]">{contact.jobTitle}</p>
                  ) : null}
                  {contact.linkedinUrl ? (
                    <a
                      href={contact.linkedinUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#202123] transition hover:text-black"
                    >
                      LinkedIn ↗
                    </a>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(contact.id)}
                  className="rounded-md border border-transparent px-2 py-1 text-xs text-[#a15664] transition hover:border-[#f5ccd6] hover:bg-[#fce8ee] hover:text-[#792b3c]"
                >
                  Remover
                </button>
              </div>
              <p className="mt-3 text-[11px] uppercase tracking-[0.25em] text-[#7a7a82]">
                Adicionado em {new Date(contact.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

