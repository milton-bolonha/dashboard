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

    // ⭐ NOVO: Verificar guest conversion PRIMEIRO (prioridade)
    const guestId = getCookie("guest_id");
    if (guestId) {
      console.log("🔍 Guest session detectada, iniciando conversão...");
      convertGuestWorkspace(guestId);
      return; // Parar aqui - não processar onboarding normal
    }

    // Detectar onboarding flag (fluxo normal - sem guest)
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
                companyUrl: context.companyUrl, // ⭐ NOVO: URL da empresa do vendedor
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

  // ⭐ NOVO: Função para ler cookie no client
  function getCookie(name) {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  }

  // ⭐ NOVO: Converter guest workspace para usuário real
  async function convertGuestWorkspace(guestId) {
    setAutoCreating(true);

    try {
      console.log("🔄 Convertendo guest workspace para usuário...");

      const response = await fetch("/api/guest/convert", { method: "POST" });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to convert guest");
      }

      const result = await response.json();

      console.log("✅ Guest convertido com sucesso!", result.workspace);

      // Limpar cookie guest
      document.cookie = "guest_id=; Max-Age=0; Path=/";

      // Limpar localStorage se existir
      localStorage.removeItem("onboarding_context");

      // Aguardar um pouco para o workspace ser criado
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Recarregar página para WorkspaceContext buscar o novo workspace
      window.location.reload();
    } catch (err) {
      console.error("❌ Erro ao converter guest:", err);
      setError(err.message);
      setAutoCreating(false);
    }
  }

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
