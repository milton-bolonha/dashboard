"use client";

import { ClerkProvider, useUser } from "@clerk/nextjs";
import { Sidebar } from "../../components/ui/Sidebar";
import { TopBar } from "../../components/ui/TopBar";
import { useUserPlanVerification } from "../../hooks/useUserPlanVerification";

function DashboardContent({ children }) {
  const { user } = useUser();
  const { plans } = useUserPlanVerification();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar sempre recolhido, expande no hover */}
      <Sidebar activePlans={plans?.active} />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <TopBar user={user}>
          <div className="flex items-center space-x-4">
            {plans?.active?.length > 0 && (
              <div className="flex items-center space-x-2">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">
                  {plans.active.length} plano(s) ativo(s)
                </span>
              </div>
            )}
          </div>
        </TopBar>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }) {
  return (
    <ClerkProvider>
      <DashboardContent>{children}</DashboardContent>
    </ClerkProvider>
  );
}
