"use client";

import type { ReactNode } from "react";

interface AdminHeaderClassicProps {
  workspaceName: string;
  companyName: string;
  companyWebsite?: string;
  onRefresh: () => void;
  onReset: () => void;
  isRefreshing: boolean;
  isResetting: boolean;
  actionSlot?: ReactNode;
}

export function AdminHeaderClassic({
  workspaceName,
  companyName,
  companyWebsite,
  onRefresh,
  onReset,
  isRefreshing,
  isResetting,
  actionSlot,
}: AdminHeaderClassicProps) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-6 md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.45em] text-slate-500">
          {workspaceName || "Workspace"}
        </p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-900">
          <h1 className="text-2xl font-semibold">{companyName || "Company"}</h1>
          {companyWebsite ? (
            <a
              href={companyWebsite}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 transition hover:border-slate-300 hover:text-slate-900"
            >
              {companyWebsite}
              <span aria-hidden>↗</span>
            </a>
          ) : null}
        </div>
        <p className="text-sm text-slate-500">
          Resumo da empresa, insights recentes e anotações importantes.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {actionSlot}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span aria-hidden>⟳</span>
          {isRefreshing ? "Atualizando..." : "Atualizar"}
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={isResetting}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-500"
        >
          <span aria-hidden>🧹</span>
          {isResetting ? "Limpando..." : "Limpar workspace"}
        </button>
      </div>
    </div>
  );
}

