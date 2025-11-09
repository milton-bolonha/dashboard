"use client";

import { useState } from "react";
import { X } from "lucide-react";

interface AddContactModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    jobTitle: string;
    linkedinUrl: string;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

const defaultState = {
  name: "",
  jobTitle: "",
  linkedinUrl: "",
};

export function AddContactModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
}: AddContactModalProps) {
  const [form, setForm] = useState(defaultState);

  if (!open) return null;

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    field: keyof typeof defaultState,
  ) => {
    const { value } = event.target;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    await onSubmit(form);
    setForm(defaultState);
  };

  const handleRequestClose = () => {
    setForm(defaultState);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm"
      onClick={handleRequestClose}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#C7C1FF] bg-white shadow-[0px_24px_60px_rgba(110,99,255,0.35)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#E4E2FF] bg-gradient-to-r from-[#E4E2FF] via-[#F5F4FF] to-[#FFFFFF] px-6 py-5">
          <div>
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.28em] text-[#534AE5]">
              Add decision maker
            </p>
            <h2 className="text-xl font-semibold text-[#2F2A94]">
              Who will champion this solution?
            </h2>
            <p className="text-sm text-[#6B63C7]">
              Capture the key contact to unlock the account. We&apos;ll store it with
              this workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D4D1FF] text-[#544AE6] transition hover:bg-[#ECEBFF]"
            aria-label="Fechar modal de contato"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6B63C7]">
              Nome completo
            </label>
            <input
              required
              value={form.name}
              onChange={(event) => handleChange(event, "name")}
              placeholder="Ex.: Ana Costa — Diretora de Operações"
              autoFocus
              className="mt-2 w-full border-b border-[#C7C1FF] bg-transparent px-1 py-2 text-sm text-[#2F2A94] placeholder-[#6B63C7]/70 focus:border-[#544AE6] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6B63C7]">
              Cargo
            </label>
            <input
              value={form.jobTitle}
              onChange={(event) => handleChange(event, "jobTitle")}
              placeholder="Ex.: VP of Customer Experience"
              className="mt-2 w-full border-b border-[#C7C1FF] bg-transparent px-1 py-2 text-sm text-[#2F2A94] placeholder-[#6B63C7]/70 focus:border-[#544AE6] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-[#6B63C7]">
              LinkedIn
            </label>
            <input
              type="url"
              inputMode="url"
              value={form.linkedinUrl}
              onChange={(event) => handleChange(event, "linkedinUrl")}
              placeholder="https://www.linkedin.com/in/username"
              className="mt-2 w-full border-b border-[#C7C1FF] bg-transparent px-1 py-2 text-sm text-[#2F2A94] placeholder-[#6B63C7]/70 focus:border-[#544AE6] focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-between">
            <p className="text-xs text-[#6B63C7]">
              Use um contacto real — isso facilita cadências personalizadas e follow-ups.
            </p>
            <button
              type="submit"
              disabled={isSubmitting || !form.name.trim()}
              className="inline-flex items-center rounded-full bg-[#5246E9] px-5 py-2 text-sm font-semibold text-white shadow-lg transition hover:bg-[#4337d8] disabled:cursor-not-allowed disabled:bg-[#B4AEFF]"
            >
              {isSubmitting ? "Salvando..." : "Salvar contato"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

