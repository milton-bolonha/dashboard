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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm" onClick={handleRequestClose}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-3xl border border-[#e4e4e4] bg-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 px-6 py-5">
          <div className="space-y-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#9a9a9a]">Add decision maker</p>
            <h2 className="text-xl font-semibold text-[#1f1f1f]">Who will champion this solution?</h2>
            <p className="text-sm text-[#6f6f6f]">
              Capture the key contact to unlock the account. We&apos;ll store it with this workspace.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#e4e4e4] text-[#444] transition hover:bg-[#f5f5f5]"
            aria-label="Close contact modal"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8a8a8a]">Full name</label>
            <input
              required
              value={form.name}
              onChange={(event) => handleChange(event, "name")}
              placeholder="e.g., Ana Costa — Director of Operations"
              autoFocus
              className="w-full rounded-lg border border-[#e4e4e4] bg-white px-3 py-2 text-sm text-[#1f1f1f] placeholder:text-[#a1a1a1] focus:border-black focus:outline-none focus:ring-0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8a8a8a]">Role or title</label>
            <input
              value={form.jobTitle}
              onChange={(event) => handleChange(event, "jobTitle")}
              placeholder="e.g., VP of Customer Experience"
              className="w-full rounded-lg border border-[#e4e4e4] bg-white px-3 py-2 text-sm text-[#1f1f1f] placeholder:text-[#a1a1a1] focus:border-black focus:outline-none focus:ring-0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8a8a8a]">LinkedIn</label>
            <input
              type="url"
              inputMode="url"
              value={form.linkedinUrl}
              onChange={(event) => handleChange(event, "linkedinUrl")}
              placeholder="https://www.linkedin.com/in/username"
              className="w-full rounded-lg border border-[#e4e4e4] bg-white px-3 py-2 text-sm text-[#1f1f1f] placeholder:text-[#a1a1a1] focus:border-black focus:outline-none focus:ring-0"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-xs text-[#6f6f6f]">
              Use a real contact — it keeps cadences personal and follow-ups relevant.
            </p>
            <button
              type="submit"
              disabled={isSubmitting || !form.name.trim()}
              className="inline-flex items-center justify-center rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:bg-[#9e9e9e]"
            >
              {isSubmitting ? "Saving..." : "Save contact"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

