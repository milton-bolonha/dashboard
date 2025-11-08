"use client";

interface AdminSidebarDashProps {
  companyName: string;
  tilesCount: number;
  notesCount: number;
  contactsCount: number;
}

export function AdminSidebarDash({
  companyName,
  tilesCount,
  notesCount,
  contactsCount,
}: AdminSidebarDashProps) {
  return (
    <div className="flex flex-1 flex-col justify-between px-5 py-8 text-[#3a3a41]">
      <div className="space-y-6">
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-[0.28em] text-[#6c6c73]">
            WORKSPACE
          </p>
          <h2 className="text-lg font-semibold text-[#1f2024]">
            {companyName || "Workspace"}
          </h2>
          <p className="text-sm text-[#5a5b60]">
            Visual amplo, sem bordas, inspirado no ChatGPT para leitura contínua.
          </p>
        </div>

        <nav className="space-y-2 text-sm">
          <SidebarLink label="Insights" value={tilesCount} />
          <SidebarLink label="Notas" value={notesCount} />
          <SidebarLink label="Contatos" value={contactsCount} />
        </nav>

        <div className="rounded-2xl border border-[#dddddf] bg-white p-4 text-sm shadow-sm">
          <h3 className="text-base font-semibold text-[#1f2024]">
            Upload de arquivos
          </h3>
          <p className="mt-2 text-[#57585d]">
            Integre com Cloudinary para anexar decks, PDFs ou capturas. Tudo privado.
          </p>
          <button
            type="button"
            disabled
            className="mt-3 inline-flex items-center justify-center rounded-lg bg-[#202123] px-3 py-2 text-xs font-semibold text-white opacity-60"
          >
            Em breve
          </button>
        </div>
      </div>

      <div className="space-y-2 text-xs text-[#6e6f75]">
        <p>Quer exportar? Gere um resumo completo em segundos.</p>
        <a
          className="inline-flex items-center gap-1 font-semibold text-[#202123] transition hover:text-black"
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

interface SidebarLinkProps {
  label: string;
  value: number;
}

function SidebarLink({ label, value }: SidebarLinkProps) {
  return (
    <div className="flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-[#e9e9ec]">
      <span>{label}</span>
      <span className="rounded-md bg-white px-2 py-1 text-xs font-semibold text-[#202123] shadow-sm">
        {value}
      </span>
    </div>
  );
}

