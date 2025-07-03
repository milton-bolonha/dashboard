"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Sidebar } from "@/components/ui/Sidebar";
import { TopBar } from "@/components/ui/TopBar";
import { DashboardProviders } from "@/contexts/DashboardProviders";

// Este é o layout principal para a área autenticada do dashboard.
// Ele garante que o sidebar e o topbar sejam exibidos em todas as páginas do dashboard.
export default function DashboardLayout({ children }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  if (!isLoaded) {
    // Tela de carregamento enquanto o Clerk verifica a sessão
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Se o usuário não estiver logado, o middleware já o terá redirecionado.
  // Esta verificação é uma segurança adicional.
  if (!isSignedIn) {
    return null;
  }

  const mainContentMargin = isCollapsed && !isHovered ? "ml-16" : "ml-64";

  return (
    <DashboardProviders>
      <div className="h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          isHovered={isHovered}
          setIsHovered={setIsHovered}
        />
        <div
          className={`flex flex-col flex-1 transition-all duration-300 ${mainContentMargin}`}
        >
          <TopBar user={user} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </DashboardProviders>
  );
}
