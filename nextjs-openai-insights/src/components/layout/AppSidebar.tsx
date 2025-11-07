interface AppSidebarProps {
  companyName: string;
  companyWebsite?: string;
  tilesCount: number;
  notesCount: number;
  contactsCount: number;
}

export function AppSidebar({
  companyName,
  companyWebsite,
  tilesCount,
  notesCount,
  contactsCount,
}: AppSidebarProps) {
  return (
    <aside className="flex w-full flex-col gap-6 rounded-3xl border border-slate-800/70 bg-slate-900/40 p-6 shadow-inner shadow-cyan-500/5 lg:max-w-xs">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
          Workspace
        </p>
        <h3 className="mt-2 text-lg font-semibold text-slate-100">
          {companyName}
        </h3>
        {companyWebsite ? (
          <a
            href={companyWebsite}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-cyan-300 transition hover:text-cyan-200"
          >
            {companyWebsite}
          </a>
        ) : null}
      </div>

      <div className="space-y-4">
        <SidebarStat label="Tiles" value={tilesCount} />
        <SidebarStat label="Notas" value={notesCount} />
        <SidebarStat label="Contatos" value={contactsCount} />
      </div>

      <div className="rounded-2xl border border-slate-800/60 bg-slate-950/60 p-4 text-sm text-slate-300">
        Ajuste a copy da home, gere novos tiles e compare versões. Tudo fica salvo no cookie por 1 hora.
      </div>
    </aside>
  );
}

function SidebarStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-800/60 bg-slate-950/60 px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-base font-semibold text-slate-100">{value}</span>
    </div>
  );
}

