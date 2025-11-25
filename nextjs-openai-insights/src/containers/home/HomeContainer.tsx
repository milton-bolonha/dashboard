"use client";

import { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/lib/state/toast-context";
import {
  clearAllWorkspaces,
  rememberSessionId,
  saveWorkspace as saveCachedWorkspace,
} from "@/lib/storage/workspace-browser";
import { clearAllCompanies } from "@/lib/storage/dashboards-store";
import { LandingHeader } from "@/components/landing/LandingHeader";
import { LandingFooter } from "@/components/landing/LandingFooter";
import {
  ClassicHeroForm,
  type ClassicHeroFormSubmission,
} from "@/components/landing/ClassicHeroForm";
import { useMembership } from "@/lib/state/membership-context";
import { usePayment } from "@/lib/state/payment-context";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { PaymentEmailModal } from "@/components/ui/PaymentEmailModal";
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
    resetGuestUsage,
  } = useMembership();
  const payment = usePayment();
  const [isSubmitting] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [isPaymentEmailModalOpen, setIsPaymentEmailModalOpen] = useState(false);

  // Verificar se precisa redirecionar para onboarding
  useEffect(() => {
    if (payment.status === "onboarding") {
      router.push("/onboarding");
    }
  }, [payment.status, router]);

  // Verificar se precisa mostrar modal de email após checkout
  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    const hasCheckoutSuccess = searchParams.get("checkout") === "success";
    const hasSessionId = searchParams.get("session_id");

    // Se tem checkout=success mas não tem session_id, mostrar modal de email
    if (hasCheckoutSuccess && !hasSessionId && payment.status === "pending") {
      setIsPaymentEmailModalOpen(true);
    }
  }, [payment.status]);

  useEffect(() => {
    router.prefetch("/admin");
  }, [router]);

  const handleStartCheckout = () => {
    const opened = startCheckout();
    if (!opened) {
      push({
        title: "Configure checkout",
        description:
          "Set NEXT_PUBLIC_STRIPE_CHECKOUT_URL to enable plan purchase.",
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

    // ✅ Check limits for guests
    if (!isMember) {
      const preview = evaluateUsage("createWorkspace");
      if (!preview.allowed) {
        // ✅ Show modal instead of redirecting directly to Stripe
        setUpgradeModalOpen(true);
        return;
      }
    }

    // Mark generation start time for polling detection
    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        "last-generation-time",
        Date.now().toString()
      );
    }

    // Redirect immediately to admin
    push({
      title: "Redirecting to dashboard...",
      description: "Your insights are being generated in the background.",
      variant: "default",
    });

    // ✅ IMPORTANTE: Consumir usage ANTES de redirecionar
    // Isso garante que o usage seja salvo mesmo se o usuário sair da página
    if (!isMember) {
      console.log(
        "[HomeContainer] 📊 Consuming usage for createWorkspace (BEFORE redirect)"
      );
      const usageResult = consumeUsage("createWorkspace");
      console.log("[HomeContainer] 📊 Usage result:", usageResult);

      // Verificar se foi bloqueado
      if (!usageResult.allowed) {
        push({
          title: "Limite atingido",
          description: `Você já criou ${usageResult.used} workspaces. Faça upgrade para criar mais!`,
          variant: "destructive",
        });
        return; // Não redirecionar se bloqueado
      }
    } else {
      console.log("[HomeContainer] ⏭️ Skipping usage consumption (member)");
    }

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
        // Set generation tracking flag
        if (typeof window !== "undefined") {
          window.localStorage.setItem("generation-in-progress", "true");
          window.localStorage.setItem("generation-source", "HomeContainer");
          window.localStorage.setItem(
            "generation-timestamp",
            new Date().toISOString()
          );
        }

        console.log(
          "🎯 [GENERATION-TRACKING] HomeContainer calling /api/generate",
          {
            source: "HomeContainer.handleSubmit",
            timestamp: new Date().toISOString(),
            targetCompany: payload.targetCompany,
            templateId: payload.templateId,
            generationTimeFlag: window.localStorage.getItem(
              "last-generation-time"
            ),
          }
        );

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

        // Redirect to admin AFTER workspace is cached
        router.push("/admin");

        // Clear generation tracking flags
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("generation-in-progress");
          window.localStorage.removeItem("generation-source");
          window.localStorage.removeItem("generation-timestamp");
        }

        // Update with success message
        push({
          title: "Insights generated!",
          description:
            "Your workspace is ready. Check the tiles for new insights.",
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
    try {
      const response = await fetch("/api/workspace", { method: "DELETE" });
      if (!response.ok) {
        throw new Error("Could not reset the workspace");
      }
      clearAllWorkspaces();
      clearAllCompanies();

      // Reset guest usage limits (workspaces count, etc.)
      resetGuestUsage();

      // Clear custom color preference when resetting workspace
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("ade-base-color");
        window.localStorage.removeItem("ade-appearance-tokens");
        window.localStorage.removeItem("last-generation-time");
        // Clear generation tracking flags
        window.localStorage.removeItem("generation-in-progress");
        window.localStorage.removeItem("generation-source");
        window.localStorage.removeItem("generation-timestamp");
        console.log(
          "[HomeContainer] 🗑️ Cleared all appearance settings and generation tracking flags"
        );
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
      title: "Unlock unlimited resources",
      description:
        "Subscribe to the Pro plan to continue using without limits.",
    });
    handleStartCheckout();
  };

  const handleLogin = () => {
    if (isMember) {
      push({
        title: "Welcome back",
        description: "Loading your Pro dashboard.",
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

  const handleUpgradeCheckout = () => {
    setUpgradeModalOpen(false);
    handleStartCheckout();
  };

  const handleMarkMember = () => {
    setUpgradeModalOpen(false);
    push({
      title: "Welcome!",
      description: "Enjoy unlimited access to all features.",
      variant: "success",
    });
  };

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

      {/* Upgrade Modal */}
      <UpgradeModal
        open={isUpgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        onCheckout={handleUpgradeCheckout}
        onMarkMember={handleMarkMember}
        stripeCheckoutUrl={process.env.NEXT_PUBLIC_STRIPE_CHECKOUT_URL}
        usage={{
          tileChat: 0,
          contactChat: 0,
          regenerate: 0,
          createContact: 0,
          createWorkspace: 0,
        }}
        limits={limits}
        lastAction="createWorkspace"
      />

      {/* Payment Email Modal - aparece quando volta do Stripe sem session_id */}
      <PaymentEmailModal
        open={isPaymentEmailModalOpen}
        onClose={() => setIsPaymentEmailModalOpen(false)}
      />

      {isHelpOpen ? (
        <Fragment>
          <div
            className="fixed inset-0 z-60 bg-black/30 backdrop-blur-sm transition-opacity"
            aria-hidden="true"
            onClick={closeHelp}
          />
          <section
            className="fixed bottom-14 right-8 z-70 w-full max-w-md rounded-2xl border border-slate-200 bg-white/95 p-6 shadow-2xl backdrop-blur"
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
                  Need a push? 🚀
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Explore the documentation, review templates, or chat with AI
                  to refine your bulk prompts.
                </p>
              </div>
              <button
                type="button"
                onClick={closeHelp}
                className="rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500 transition hover:bg-slate-100"
              >
                Close
              </button>
            </div>
            <ul className="mt-4 space-y-3 text-sm text-slate-600">
              <li>
                • Read the complete new flow in <strong>novo-fluxo.md</strong>{" "}
                file to understand each step.
              </li>
              <li>
                • Want hands-on? Generate a template CSV with the "Upload CSV"
                button and reuse it in the dashboard.
              </li>
              <li>
                • Configure agents and variables to customize prompts before
                sending to GPT-5.
              </li>
            </ul>
          </section>
        </Fragment>
      ) : null}
    </div>
  );
}
