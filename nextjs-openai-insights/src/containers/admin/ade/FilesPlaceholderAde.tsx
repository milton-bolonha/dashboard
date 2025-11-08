export function FilesPlaceholderAde() {
  return (
    <section className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Files & Assets
        </h3>
        <p className="text-sm text-gray-600">
          Upload e gerencie documentos importantes deste workspace.
        </p>
      </div>

      <div className="flex space-x-1 rounded-lg bg-gray-100 p-1 text-sm font-medium text-gray-600">
        <button className="flex items-center space-x-2 rounded-md bg-white px-3 py-2 text-gray-900 shadow-sm">
          <span>Documents</span>
        </button>
        <button className="flex items-center space-x-2 rounded-md px-3 py-2 transition hover:text-gray-900">
          <span>Images</span>
        </button>
        <button className="flex items-center space-x-2 rounded-md px-3 py-2 transition hover:text-gray-900">
          <span>Archives</span>
        </button>
      </div>

      <div className="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">
        Upload arrastando e soltando aqui (10 MB máx) — integração Cloudinary chegando.
      </div>

      <div className="flex justify-center py-8 text-gray-500">
        Nenhum arquivo enviado ainda.
      </div>
    </section>
  );
}

