export function FilesPlaceholderAde() {
  return (
    <section className="space-y-6">
      <header>
        <h3 className="text-lg font-semibold text-gray-900">Files & Assets</h3>
        <p className="text-sm text-gray-600">
          Upload and manage the key documents that support this workspace.
        </p>
      </header>

      <div className="flex space-x-1 rounded-full bg-gray-100 p-1 text-sm font-medium text-gray-600">
        <button className="flex items-center space-x-2 rounded-full bg-white px-3 py-2 text-gray-900 shadow-sm">
          <span>Documents</span>
        </button>
        <button className="flex items-center space-x-2 rounded-full px-3 py-2 transition hover:text-gray-900">
          <span>Images</span>
        </button>
        <button className="flex items-center space-x-2 rounded-full px-3 py-2 transition hover:text-gray-900">
          <span>Archives</span>
        </button>
      </div>

      <div className="rounded-xl border-2 border-dashed border-gray-300 p-6 text-center text-sm text-gray-600">
        Drag and drop to upload (10 MB max) — Cloudinary integration coming soon.
      </div>

      <div className="flex justify-center py-8 text-gray-500">
        No files uploaded yet.
      </div>
    </section>
  );
}

