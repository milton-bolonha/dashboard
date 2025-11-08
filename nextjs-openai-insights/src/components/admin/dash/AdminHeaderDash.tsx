"use client";

import type { ReactNode } from "react";

interface AdminHeaderDashProps {
  companyName: string;
  companyWebsite?: string;
  onRefresh: () => void;
  onReset: () => void;
  isRefreshing: boolean;
  isResetting: boolean;
  actionSlot?: ReactNode;
}

export function AdminHeaderDash({
  companyName,
  companyWebsite,
  onRefresh,
  onReset,
  isRefreshing,
  isResetting,
  actionSlot,
}: AdminHeaderDashProps) {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-[#202123]">
          {companyName || "Workspace"}
        </h1>
        {companyWebsite ? (
          <a
            href={companyWebsite}
            target="_blank"
            rel="noreferrer"
            className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-[#4f4f54] transition hover:text-[#111]"
          >
            {companyWebsite}
            <span aria-hidden>↗</span>
          </a>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {actionSlot}
        <button
          type="button"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-[#d9d9de] bg-white px-4 py-2 text-sm font-medium text-[#202123] shadow-sm transition hover:border-[#b5b5bc] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span aria-hidden>⟳</span>
          {isRefreshing ? "Atualizando..." : "Atualizar"}
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={isResetting}
          className="inline-flex items-center gap-2 rounded-lg bg-[#202123] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2f3033] disabled:cursor-not-allowed disabled:bg-[#3b3b3f]"
        >
          <span aria-hidden>🧹</span>
          {isResetting ? "Limpando..." : "Limpar"}
        </button>
      </div>
    </div>
  );
}

