"use client";

import { ClerkProvider, useUser } from "@clerk/nextjs";
import { Sidebar } from "../../components/ui/Sidebar";
import { TopBar } from "../../components/ui/TopBar";
import { SectionsProvider } from "../../contexts/SectionsContext";
import { useUserPlanVerification } from "../../hooks/useUserPlanVerification";

function DashboardContent({ children }) {
  const { user } = useUser();
  const { plans } = useUserPlanVerification();

  return (
    <div className="h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Sidebar fixo */}
      <Sidebar activePlans={plans?.active} />

      {/* Main content with left margin for fixed sidebar */}
      <div className="ml-16 transition-all duration-300 flex flex-col h-full overflow-hidden">
        {/* Top bar */}
        <TopBar user={user}>
          <div className="flex items-center space-x-4">
            {plans?.active?.length > 0 && (
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600 dark:text-gray-300">
                  {plans.active.length} plano(s) ativo(s)
                </span>
              </div>
            )}
          </div>
        </TopBar>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 transition-colors p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <ClerkProvider>
      <SectionsProvider>
        <DashboardContent>{children}</DashboardContent>
      </SectionsProvider>
    </ClerkProvider>
  );
}
