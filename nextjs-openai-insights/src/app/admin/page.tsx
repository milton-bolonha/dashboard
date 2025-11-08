import { Suspense } from "react";

import { AdminContainer } from "@/containers/admin/AdminContainer";
import { AdminThemeProvider } from "@/lib/state/admin-theme-context";

function AdminFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#fcfcf9] text-slate-600">
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-4 text-sm shadow-sm">
        Carregando workspace...
      </div>
    </div>
  );
}

export default function AdminPage() {
  return (
    <AdminThemeProvider>
      <Suspense fallback={<AdminFallback />}>
        <AdminContainer />
      </Suspense>
    </AdminThemeProvider>
  );
}

