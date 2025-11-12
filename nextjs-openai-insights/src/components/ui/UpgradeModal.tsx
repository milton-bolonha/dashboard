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

const ACTION_LABELS: Record<GuestAction, { title: string; description: string }> = {
  tileChat: {
    title: "AI Tile Chat",
    description: "Chat with generated insights and refine unlimited responses.",
  },
  contactChat: {
    title: "Contact Chat",
    description: "Continue conversations with stakeholders and record learnings.",
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
  "Unlimited workspaces with saved history",
  "Unlimited AI chats with full attachments",
  "Always available tile and contact regenerations",
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
            {lastAction ? (
              <p className="mt-1 text-sm text-slate-600">
                You&apos;ve reached the free limit for{" "}
                <span className="font-semibold">
                  {ACTION_LABELS[lastAction]?.title ?? "this feature"}
                </span>
                . Upgrade to continue using without limits.
              </p>
            ) : (
              <p className="mt-1 text-sm text-slate-600">
                Continue where you left off by subscribing to the Pro plan.
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:border-slate-300 hover:text-slate-800"
            aria-label="Fechar modal de upgrade"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="space-y-6 px-6 py-6">
          <div className="grid gap-6 md:grid-cols-2">
            <section className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <h4 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
                Current Guest Mode Limits
              </h4>
              <ul className="space-y-3">
                {(Object.keys(limits) as GuestAction[]).map((action) => {
                  const limit = limits[action];
                  const used = usage[action] ?? 0;
                  const percentage =
                    !Number.isFinite(limit) ? 0 : Math.min((used / limit) * 100, 100);
                  return (
                    <li key={action}>
                      <div className="flex items-center justify-between text-sm font-medium text-slate-700">
                        <span>{ACTION_LABELS[action].title}</span>
                        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                          {formatLimit(used, limit)}
                        </span>
                      </div>
                      <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className="h-full rounded-full bg-slate-900 transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

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
          </div>

          <footer className="flex flex-col gap-3 border-t border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-slate-500">
              Stripe-hosted checkout. Cancel anytime.
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={onMarkMember}
                className="inline-flex items-center justify-center rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
              >
                I already have the plan
              </button>
              <button
                type="button"
                onClick={onCheckout}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white transition hover:bg-black/85"
              >
                <span>
                  {stripeCheckoutUrl ? "Unlock unlimited access" : "Configure Stripe"}
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
