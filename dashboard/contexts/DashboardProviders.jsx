"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { WorkspaceProvider, useWorkspace } from "./WorkspaceContext";
import { SectionsProvider } from "./SectionsContext";

// Component interno para auto-criar workspace após onboarding
function OnboardingAutoCreate({ children }) {
  const router = useRouter();
  const { workspaces, currentWorkspace, createWorkspace, loading } =
    useWorkspace();
  const [autoCreating, setAutoCreating] = useState(false);

  useEffect(() => {
    if (loading || autoCreating) return;
    if (typeof window === "undefined") return;

    // Detectar onboarding flag
    const params = new URLSearchParams(window.location.search);
    const isOnboarding = params.get("onboarding") === "true";
    const saved = localStorage.getItem("onboarding_context");

    // ⭐ NOVO: Criar workspace se tem contexto de onboarding, independente de já ter workspaces
    if (isOnboarding && saved) {
      setAutoCreating(true);

      (async () => {
        try {
          const context = JSON.parse(saved);

          console.log(
            "🚀 Auto-criando workspace com contexto de onboarding..."
          );

          await createWorkspace({
            name: context.company || "My Workspace",
            description: `Sales rep for ${context.solution}. Research: ${context.research}`,
            metadata: {
              onboarding: {
                salesRepAt: context.company,
                sellingSolutionsFor: context.solution,
                researchTarget: context.research,
              },
              createdVia: "landing-onboarding",
            },
          });

          // Limpar
          localStorage.removeItem("onboarding_context");

          // Remover query param
          router.replace("/dashboard");

          console.log("✅ Workspace criado automaticamente via onboarding!");
        } catch (err) {
          console.error("❌ Failed to auto-create workspace:", err);
          setAutoCreating(false);
        } finally {
          setAutoCreating(false);
        }
      })();
    }
  }, [loading, workspaces, autoCreating, createWorkspace, router]);

  if (autoCreating) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Creating your workspace...</p>
        </div>
      </div>
    );
  }

  return children;
}

export function DashboardProviders({ children }) {
  return (
    <WorkspaceProvider>
      <OnboardingAutoCreate>
        <SectionsProvider>{children}</SectionsProvider>
      </OnboardingAutoCreate>
    </WorkspaceProvider>
  );
}
