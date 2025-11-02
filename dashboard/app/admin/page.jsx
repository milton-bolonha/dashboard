import { Suspense } from "react";
import { AdminDashboardContainer } from "@/containers/AdminDashboardContainer";

// ⭐ Loading fallback para Suspense
function AdminDashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Loading dashboard...
        </p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
          Please wait while we prepare your workspace
        </p>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  // ⭐ Suspense permite streaming SSR e melhor UX durante carregamento
  // O AdminDashboardContainer usa useSearchParams() que é uma Dynamic API
  return (
    <Suspense fallback={<AdminDashboardLoading />}>
      <AdminDashboardContainer />
    </Suspense>
  );
}
