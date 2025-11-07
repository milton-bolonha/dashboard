"use client";

interface AppHeaderProps {
  companyName: string;
  companyWebsite?: string;
  onReset: () => void;
  onRefresh: () => void;
  isResetting: boolean;
  isRefreshing: boolean;
}

export function AppHeader({
  companyName,
  companyWebsite,
  onReset,
  onRefresh,
  isResetting,
  isRefreshing,
}: AppHeaderProps) {
  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-cyan-400/80">
            Insights Dashboard
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-100">{companyName}</h2>
          {companyWebsite ? (
            <a
              href={companyWebsite}
              target="_blank"
              rel="noreferrer"
              className="mt-1 inline-flex items-center gap-2 text-sm text-cyan-300 transition hover:text-cyan-200"
            >
              {companyWebsite}
              <span aria-hidden>↗</span>
            </a>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-700 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-cyan-400/60 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRefreshing ? "Atualizando..." : "Recarregar"}
          </button>
          <button
            type="button"
            onClick={onReset}
            disabled={isResetting}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isResetting ? "Limpando..." : "Limpar workspace"}
          </button>
        </div>
      </div>
    </header>
  );
}

