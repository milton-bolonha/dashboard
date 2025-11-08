"use client";

interface AdminSidebarClassicProps {
  companyName: string;
  tilesCount: number;
  notesCount: number;
  contactsCount: number;
}

export function AdminSidebarClassic({
  companyName,
  tilesCount,
  notesCount,
  contactsCount,
}: AdminSidebarClassicProps) {
  return (
    <div className="flex flex-1 flex-col justify-between px-6 py-8">
      <div className="space-y-8">
        <div className="space-y-3">
          <span className="inline-flex items-center rounded-full bg-slate-900 px-3 py-1 text-xs font-medium tracking-[0.35em] text-white/80">
            WORKSPACE
          </span>
          <h2 className="text-xl font-semibold text-slate-900">
            {companyName || "Workspace"}
          </h2>
          <p className="text-sm text-slate-500">
            Acompanhe seus insights, notas e contatos em um só lugar. Tudo salvo nos
            cookies — rápido e sem fricção.
          </p>
        </div>

        <div className="space-y-4">
          <SidebarMetric label="Insights" value={tilesCount} hint="Tiles gerados" />
          <SidebarMetric label="Notas" value={notesCount} hint="Anotações rápidas" />
          <SidebarMetric
            label="Contatos"
            value={contactsCount}
            hint="Pessoas-chave mapeadas"
          />
        </div>

        <div className="space-y-4 rounded-3xl bg-slate-900 p-5 text-white">
          <h3 className="text-lg font-semibold">Upload de arquivos</h3>
          <p className="text-sm text-white/80">
            Ative o upload pelo Cloudinary para anexar PDFs, decks e capturas. Mantemos
            tudo privado por padrão.
          </p>
          <button
            type="button"
            disabled
            className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 opacity-70"
          >
            Em breve
          </button>
        </div>
      </div>

      <div className="space-y-3 text-sm text-slate-400">
        <p>
          Precisa migrar esse workspace para produção? Gere um link compartilhável ou
          exporte os tiles em segundos.
        </p>
        <a
          className="inline-flex items-center gap-2 font-semibold text-slate-700 transition hover:text-slate-900"
          href="https://cloudinary.com/"
          target="_blank"
          rel="noreferrer"
        >
          Cloudinary ↗
        </a>
      </div>
    </div>
  );
}

interface SidebarMetricProps {
  label: string;
  value: number;
  hint: string;
}

function SidebarMetric({ label, value, hint }: SidebarMetricProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          {label}
        </p>
        <p className="text-sm text-slate-500">{hint}</p>
      </div>
      <span className="text-2xl font-semibold text-slate-900">{value}</span>
    </div>
  );
}

