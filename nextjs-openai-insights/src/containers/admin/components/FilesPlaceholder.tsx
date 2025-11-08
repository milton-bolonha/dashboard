export function FilesPlaceholder() {
  return (
    <section className="flex flex-col gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Arquivos & Assets
          </h3>
          <p className="text-sm text-slate-500">
            Conecte-se ao Cloudinary para organizar pitches, PDFs e screenshots.
          </p>
        </div>
        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
          Roadmap
        </span>
      </div>
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-500">
        Uploads privados em breve. Enquanto isso, mantenha os arquivos chave no seu drive
        favorito e linke nas notas.
      </div>
      <a
        href="https://cloudinary.com/"
        target="_blank"
        rel="noreferrer"
        className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
      >
        Explorar Cloudinary ↗
      </a>
    </section>
  );
}

