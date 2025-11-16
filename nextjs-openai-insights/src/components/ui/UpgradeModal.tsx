"use client";

import { ArrowRight, CheckCircle2, Lock, Sparkles, X } from "lucide-react";

import type { GuestAction } from "@/lib/state/membership-context";

interface UpgradeModalProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
  onMarkMember: () => void;
  stripeCheckoutUrl?: string;
  usage: Record<GuestAction, number>;
  limits: Record<GuestAction, number>;
  lastAction: GuestAction | null;
}

const ACTION_LABELS: Record<
  GuestAction,
  { title: string; description: string }
> = {
  tileChat: {
    title: "AI Tile Chat",
    description: "Chat with generated insights and refine unlimited responses.",
  },
  contactChat: {
    title: "Contact Chat",
    description:
      "Continue conversations with stakeholders and record learnings.",
  },
  regenerate: {
    title: "AI Regenerations",
    description: "Update tiles and contacts as many times as needed.",
  },
  createContact: {
    title: "Contact Creation",
    description: "Map entire decision committees without limits.",
  },
  createWorkspace: {
    title: "Generated Workspaces",
    description: "Create dossiers for as many companies as desired.",
  },
};

const FEATURE_LIST = [
  "Multiple workspaces with saved history",
  "AI chats with full attachments",
  "Tile and contact regenerations",
  "Premium exports (CSV, PDF) and custom dashboards",
] as const;

function formatLimit(used: number, limit: number): string {
  if (!Number.isFinite(limit)) return "∞";
  return `${used}/${limit}`;
}

export function UpgradeModal({
  open,
  onClose,
  onCheckout,
  onMarkMember,
  stripeCheckoutUrl,
  usage,
  limits,
  lastAction,
}: UpgradeModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/60 backdrop-blur-sm sm:items-center"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg translate-y-0 rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              <Lock className="h-4 w-4" />
              Pro Plan Required
            </p>
            <h3 className="mt-2 text-xl font-semibold text-slate-900">
              Unlock the full dashboard
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Upgrade to continue using without limits.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-800 cursor-pointer"
            aria-label="Fechar modal de upgrade"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-6 px-6 py-6">
          <section className="space-y-4 rounded-2xl border border-slate-200 p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Sparkles className="h-4 w-4 text-amber-500" />
              Pro Plan Includes:
            </h4>
            <ul className="space-y-2 text-sm text-slate-600">
              {FEATURE_LIST.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-1 h-4 w-4 text-emerald-500" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </section>

          <footer className="flex flex-col gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onMarkMember}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900 cursor-pointer"
              >
                I already have the plan
              </button>
              <button
                type="button"
                onClick={onCheckout}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-black/85 cursor-pointer"
              >
                <span>
                  {stripeCheckoutUrl
                    ? "Unlock unlimited access"
                    : "Subscribe to Pro Plan"}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
