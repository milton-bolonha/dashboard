"use client";

import { useState, useTransition } from "react";

import type { Contact } from "@/lib/types";
import { useToast } from "@/lib/state/toast-context";

interface ContactsPanelAdeProps {
  contacts: Contact[];
  onContactsChanged: () => Promise<void>;
}

export function ContactsPanelAde({
  contacts,
  onContactsChanged,
}: ContactsPanelAdeProps) {
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
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Contatos</h3>
        <button
          type="button"
          disabled
          className="flex items-center space-x-2 rounded-md border-2 border-dashed border-gray-300 px-3 py-2 text-xs text-gray-500 transition hover:border-gray-400"
        >
          <span>Adicionar contato (em breve)</span>
        </button>
      </div>

      <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nome"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none transition focus:border-gray-500"
        />
        <input
          value={jobTitle}
          onChange={(event) => setJobTitle(event.target.value)}
          placeholder="Cargo"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none transition focus:border-gray-500"
        />
        <input
          value={linkedin}
          onChange={(event) => setLinkedin(event.target.value)}
          placeholder="LinkedIn"
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm outline-none transition focus:border-gray-500"
        />
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:bg-gray-600 md:col-span-3"
        >
          {isPending ? "Salvando..." : "Adicionar contato"}
        </button>
      </form>

      <div className="space-y-3">
        {contacts.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhum contato salvo ainda. Mapeie decisores e ponteiros para acelerar o outreach.
          </p>
        ) : (
          contacts.map((contact) => (
            <article
              key={contact.id}
              className="flex items-start justify-between rounded-lg border border-gray-200 bg-gray-50 p-4"
            >
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-gray-900">{contact.name}</h4>
                {contact.jobTitle ? (
                  <p className="text-sm text-gray-600">{contact.jobTitle}</p>
                ) : null}
                {contact.linkedinUrl ? (
                  <a
                    href={contact.linkedinUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-semibold text-gray-600 transition hover:text-gray-900"
                  >
                    LinkedIn ↗
                  </a>
                ) : null}
              </div>
              <button
                type="button"
                onClick={() => handleDelete(contact.id)}
                className="text-xs text-gray-500 transition hover:text-red-500"
              >
                Remover
              </button>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

