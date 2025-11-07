import { Suspense } from "react";

import { AdminContainer } from "@/containers/admin/AdminContainer";

function AdminFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-6 py-4 text-sm text-slate-400">
        Carregando workspace...
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<AdminFallback />}>
      <AdminContainer />
    </Suspense>
  );
}

