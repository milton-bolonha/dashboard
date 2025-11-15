"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/lib/state/toast-context";
import {
  clearAllWorkspaces,
  rememberSessionId,
  saveWorkspace as saveCachedWorkspace,
} from "@/lib/storage/workspace-browser";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import {
  ClassicHeroForm,
  type ClassicHeroFormSubmission,
} from "@/components/landing/ClassicHeroForm";
import { useMembership } from "@/lib/state/membership-context";
import "@/components/landing/landing.css";

export function HomeContainer() {
  const router = useRouter();
  const { push } = useToast();
  const {
    isMember,
    limits,
    evaluateUsage,
    consumeUsage,
    startCheckout,
  } = useMembership();
  const [isSubmitting] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  useEffect(() => {
    router.prefetch("/admin");
  }, [router]);

  const handleStartCheckout = () => {
    const opened = startCheckout();
    if (!opened) {
      push({
        title: "Configure o checkout",
        description:
          "Defina NEXT_PUBLIC_STRIPE_CHECKOUT_URL para habilitar a compra do plano.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async ({
    company,
    companyWebsite,
    solution,
    researchTarget,
    researchWebsite,
    templateId,
    model,
    promptAgent,
    responseLength,
    promptVariables,
    bulkPrompts,
  }: ClassicHeroFormSubmission) => {
    if (isSubmitting) return;

    if (!isMember) {
      const preview = evaluateUsage("createWorkspace");
      if (!preview.allowed) {
        push({
          title: "Limite de visitante atingido",
          description: `Plano gratuito permite gerar até ${limits.createWorkspace} workspaces por dia. Faça upgrade para continuar.`,
          variant: "destructive",
        });
        handleStartCheckout();
        return;
      }
    }

    // Mark generation start time for polling detection
    if (typeof window !== "undefined") {
      window.localStorage.setItem("last-generation-time", Date.now().toString());
    }

    // Redirect immediately to admin
    push({
      title: "Redirecting to dashboard...",
      description: "Your insights are being generated in the background.",
      variant: "default",
    });

    router.push("/admin");

    // Start generation in background
    const generateInBackground = async () => {
      const targetUrl = "/api/generate";
      const payload = {
        salesRepCompany: company,
        salesRepWebsite: companyWebsite,
        solution,
        targetCompany: researchTarget,
        targetWebsite: researchWebsite,
        templateId,
        model,
        promptAgent,
        responseLength,
        promptVariables,
        bulkPrompts,
      };

      try {
        const response = await fetch(targetUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => null);

        if (!response.ok) {
          console.error("[HomeContainer] ❌ Generation request failed:", {
            status: response.status,
            statusText: response.statusText,
          });
          push({
            title: "Generation failed",
            description:
              (data?.error as string) ?? "Failed to start insight generation.",
            variant: "destructive",
          });
          return;
        }

        if (data?.sessionId) {
          rememberSessionId(data.sessionId);
        }
        if (data?.workspace) {
          saveCachedWorkspace(data.workspace.sessionId, data.workspace);
          console.log("[HomeContainer] ✅ Workspace cached:", {
            sessionId: data.workspace.sessionId,
            tilesCount: data.workspace.company?.tiles?.length || 0,
          });
        }
        console.log("[HomeContainer] ✅ Generation request accepted");

        if (!isMember) {
          consumeUsage("createWorkspace");
        }

        // Update with success message
        push({
          title: "Insights generated!",
          description: "Your workspace is ready. Check the tiles for new insights.",
          variant: "success",
        });

      } catch (error) {
        console.error("[HomeContainer] 🚨 Generation request threw", error);
        push({
          title: "Generation failed",
          description:
            error instanceof Error
              ? error.message
              : "Please try again in a few moments.",
          variant: "destructive",
        });
      }
    };

    // Start background generation
    generateInBackground();
  };

  const handleResetWorkspace = async () => {
    // Clear appearance tokens from localStorage when resetting
    if (typeof window !== "undefined") {
      try {
        window.localStorage.removeItem("ade-appearance-tokens");
        console.log("[HomeContainer] 🗑️ Cleared appearance tokens from localStorage (reset)");
      } catch (e) {
        console.warn("[HomeContainer] ⚠️ Failed to clear appearance tokens:", e);
      }
    }
    try {
      const response = await fetch("/api/workspace", { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Could not reset the workspace");
      }
      clearAllWorkspaces();
      
      // Clear custom color preference when resetting workspace
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("ade-base-color");
        window.localStorage.removeItem("last-generation-time");
        console.log("[HomeContainer] 🗑️ Cleared custom color and generation timestamp");
      }
      
      push({
        title: "Workspace cleared",
        description: "Submit the form again to generate a fresh workspace.",
        variant: "success",
      });
    } catch (error) {
      push({
        title: "Reset failed",
        description:
          error instanceof Error
            ? error.message
            : "Please try again in a few moments.",
        variant: "destructive",
      });
    }
  };

  const requestVisitorUpgrade = () => {
    push({
      title: "Desbloqueie recursos ilimitados",
      description: "Assine o plano Pro para continuar usando sem limites.",
    });
    handleStartCheckout();
  };

  const handleLogin = () => {
    if (isMember) {
      push({
        title: "Bem-vindo de volta",
        description: "Carregando seu dashboard Pro.",
        variant: "success",
      });
      router.push("/admin");
      return;
    }
    requestVisitorUpgrade();
  };

  const handleSignUp = () => {
    handleStartCheckout();
  };

  const openHelp = () => setIsHelpOpen(true);
  const closeHelp = () => setIsHelpOpen(false);

  return (
    <div className="home-page">
      <LandingHeader
        onLogin={handleLogin}
        onSignUp={handleSignUp}
        onHelpClick={openHelp}
      />
      <main className="flex-1">
        <ClassicHeroForm
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          onReset={handleResetWorkspace}
        />
      </main>
      <LandingFooter onHelpClick={openHelp} />

      {isHelpOpen ? (
        <Fragment>
          <div
            className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
            onClick={closeHelp}
          />
          <section
            className="fixed bottom-14 right-8 z-[70] w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-2xl backdrop-blur"
            role="dialog"
            aria-modal="true"
            aria-labelledby="home-help-heading"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="home-help-heading"
                  className="text-lg font-semibold text-slate-900"
                >
                  Precisa de um empurrão? 🚀
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Explore a documentação, revise os templates ou fale com a IA
                  para refinar seus prompts em massa.
                </p>
              </div>
              <button
                type="button"
                onClick={closeHelp}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100"
              >
                Fechar
              </button>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>
                • Leia o novo fluxo completo no arquivo <strong>novo-fluxo.md</strong> para entender cada etapa.
              </li>
              <li>
                • Quer hands-on? Gere um CSV modelo com o botão “Upload CSV” e
                reutilize no dashboard.
              </li>
              <li>
                • Configure agentes e variáveis para personalizar os prompts
                antes de mandar para o GPT-5.
              </li>
            </ul>
          </section>
        </Fragment>
      ) : null}
    </div>
  );
}
