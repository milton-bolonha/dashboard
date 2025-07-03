"use client";

import { useUser, UserButton } from "@clerk/nextjs";
import { Sidebar } from "@/components/ui/Sidebar";
import { TopBar } from "../../components/ui/TopBar";
import { LoadingBar } from "../../components/ui/LoadingBar";
import { SectionsProvider } from "../../contexts/SectionsContext";
import { WorkspaceProvider } from "../../contexts/WorkspaceContext";
import { useUserPlanVerification } from "../../hooks/useUserPlanVerification";

// Este é o layout principal para a área autenticada do dashboard.
// Ele garante que o sidebar seja exibido em todas as páginas do dashboard.
export default function DashboardLayout({ children }) {
  const { isLoaded, isSignedIn } = useUser();
  const { plans } = useUserPlanVerification();

  if (!isLoaded) {
    // Tela de carregamento enquanto o Clerk verifica a sessão
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se o usuário não estiver logado, o middleware já o terá redirecionado.
  // Esta verificação é uma segurança adicional.
  if (!isSignedIn) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pl-16">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
