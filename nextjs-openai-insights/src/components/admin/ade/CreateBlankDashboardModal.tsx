"use client";

import { useState } from "react";
import { ArrowRight, X } from "lucide-react";

interface CreateBlankDashboardModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { dashboardName: string }) => Promise<void>;
  isSubmitting?: boolean;
}

export function CreateBlankDashboardModal({
  open,
  onClose,
  onSubmit,
  isSubmitting = false,
}: CreateBlankDashboardModalProps) {
  const [dashboardName, setDashboardName] = useState("");
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = dashboardName.trim().length > 1;

  if (!open) return null;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    
    if (!isValid) {
      setError("Dashboard name must be at least 2 characters.");
      setTouched(true);
      return;
    }

    try {
      await onSubmit({ dashboardName: dashboardName.trim() });
      setDashboardName("");
      setTouched(false);
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "We couldn't create the dashboard. Try again shortly.",
      );
    }
  };

  const handleRequestClose = () => {
    setDashboardName("");
    setTouched(false);
    setError(null);
    onClose();
  };

  const showError = touched && !isValid;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm" 
      onClick={handleRequestClose}
    >
      <div 
        className="w-full max-w-md overflow-hidden rounded-[28px] border border-[#e4e4e4] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.2)]" 
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 px-8 py-6">
          <div className="space-y-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#9a9a9a]">
              Create new dashboard
            </p>
            <h2 className="text-2xl font-semibold text-[#1f1f1f]">
              Create Blank Dashboard
            </h2>
            <p className="text-sm text-[#6f6f6f]">
              Start with an empty dashboard and add custom prompts manually.
            </p>
          </div>
          <button
            type="button"
            onClick={handleRequestClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4e4e4] text-[#444] transition hover:bg-[#f5f5f5] cursor-pointer"
            aria-label="Close create dashboard modal"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 px-8 py-6">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold uppercase tracking-[0.28em] text-[#8a8a8a]">
              Dashboard Name
            </label>
            <input
              required
              type="text"
              value={dashboardName}
              onChange={(event) => {
                setDashboardName(event.target.value);
                setTouched(true);
              }}
              onBlur={() => setTouched(true)}
              disabled={isSubmitting}
              className="w-full rounded-lg border border-[#e4e4e4] bg-white px-3 py-2 text-sm text-[#1f1f1f] placeholder:text-[#a1a1a1] focus:border-black focus:outline-none focus:ring-0 disabled:cursor-not-allowed disabled:bg-[#f5f5f5]"
              placeholder="e.g., My Custom Dashboard"
            />
            {showError ? (
              <p className="text-xs text-[#FF5A5F]">
                Dashboard name must be at least 2 characters.
              </p>
            ) : null}
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#b42318]">
              {error}
            </div>
          ) : null}

          <div className="flex items-center justify-between">
            <p className="text-xs text-[#6f6f6f]">
              You can add custom prompts and tiles after creation.
            </p>
            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-2 text-sm font-semibold text-white transition hover:bg-[#1a1a1a] disabled:cursor-not-allowed disabled:bg-[#9e9e9e] cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white border-r-2 border-transparent" />
                  <span>Creating…</span>
                </>
              ) : (
                <>
                  <span>Create Dashboard</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

