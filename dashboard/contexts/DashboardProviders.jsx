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

    if (isOnboarding && !currentWorkspace && workspaces.length === 0) {
      const saved = localStorage.getItem("onboarding_context");

      if (saved) {
        setAutoCreating(true);

        (async () => {
          try {
            const context = JSON.parse(saved);

            console.log(
              "🚀 Auto-criando workspace com contexto de onboarding..."
            );

            await createWorkspace({
              name: context.company,
              description: `Sales rep for ${context.solution}. Research: ${context.research}`,
              metadata: {
                solution: context.solution,
                researchTarget: context.research,
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
          } finally {
            setAutoCreating(false);
          }
        })();
      }
    }
  }, [loading, currentWorkspace, workspaces, autoCreating]);

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
