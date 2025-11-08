export function FilesPlaceholderDash() {
  return (
    <section className="rounded-xl border border-[#d9d9de] bg-white px-5 py-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-[#1f2024]">
            Arquivos & referências
          </h3>
          <p className="text-sm text-[#5a5b60]">
            Em breve você poderá anexar documentos direto por aqui com integração ao
            Cloudinary.
          </p>
        </div>
        <span className="rounded-md bg-[#202123] px-2 py-1 text-xs font-semibold text-white">
          Roadmap
        </span>
      </div>
      <div className="mt-4 rounded-lg border border-dashed border-[#e3e3e8] bg-[#f7f7f8] p-5 text-sm text-[#5a5b60]">
        Enquanto isso, mantenha links importantes nas notas ou disparos externos. Tudo
        continua salvo no cookie local.
      </div>
    </section>
  );
}

