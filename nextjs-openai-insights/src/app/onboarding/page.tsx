"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePayment } from "@/lib/state/payment-context";
import { useUser } from "@clerk/nextjs";
import { loadCompaniesWithDashboards } from "@/lib/storage/dashboards-store";

export default function OnboardingPage() {
  const router = useRouter();
  const { status, email: paymentEmail, completePayment } = usePayment();
  const { user, isLoaded } = useUser();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preencher email do pagamento ou do Clerk
  useEffect(() => {
    if (paymentEmail) {
      setEmail(paymentEmail);
    } else if (user?.emailAddresses?.[0]?.emailAddress) {
      setEmail(user.emailAddresses[0].emailAddress);
    }

    if (user?.firstName || user?.lastName) {
      setName(`${user.firstName || ""} ${user.lastName || ""}`.trim());
    }
  }, [paymentEmail, user]);

  // Se já tem conta Clerk e está logado, pode pular onboarding
  useEffect(() => {
    if (isLoaded && user && status === "paid") {
      // Usuário já tem conta e pagou, pode ir direto pro admin
      router.push("/admin");
    }
  }, [isLoaded, user, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim() || !email.trim()) {
      setError("Por favor, preencha todos os campos");
      return;
    }

    setIsSubmitting(true);

    try {
      // Se não tem conta Clerk, precisa criar
      if (!user) {
        // Redirecionar para sign-up com email pré-preenchido
        const signUpUrl = `/sign-up?email=${encodeURIComponent(
          email
        )}&name=${encodeURIComponent(name)}&onboarding=true`;
        router.push(signUpUrl);
        return;
      }

      // Se já tem conta, completar pagamento
      const success = await completePayment();

      if (success) {
        // ✅ Após completar pagamento, migrar dados do localStorage para MongoDB
        try {
          console.log("[Onboarding] 🔄 Starting data migration...");

          // Carregar dados do localStorage
          const companiesData = loadCompaniesWithDashboards();

          console.log("[Onboarding] 📊 Companies to migrate:", {
            count: companiesData.length,
            companies: companiesData.map((c) => ({ id: c.id, name: c.name })),
          });

          // Chamar API de migração
          const migrationResponse = await fetch("/api/migration/migrate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              companiesData,
              sessionId: null, // Migrar todos os workspaces
            }),
          });

          const migrationResult = await migrationResponse.json();

          if (migrationResult.success) {
            console.log("[Onboarding] ✅ Migration completed:", {
              workspacesMigrated: migrationResult.workspacesMigrated,
              companiesMigrated: migrationResult.companiesMigrated,
            });
          } else {
            console.warn(
              "[Onboarding] ⚠️ Migration had errors:",
              migrationResult.errors
            );
            // Não bloquear o fluxo se migração falhar parcialmente
          }
        } catch (migrationError) {
          console.error("[Onboarding] ❌ Migration error:", migrationError);
          // Não bloquear o fluxo se migração falhar
        }

        // Redirecionar será feito pelo PaymentContext
        router.push("/admin");
      } else {
        setError("Erro ao completar pagamento. Tente novamente.");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Se não está em estado de onboarding ou paid, redirecionar
  if (status !== "onboarding" && status !== "paid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
          <h1 className="mb-4 text-2xl font-bold text-slate-900">
            Acesso não autorizado
          </h1>
          <p className="mb-6 text-slate-600">
            Você precisa completar o pagamento antes de acessar o onboarding.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full rounded-lg bg-black px-4 py-2 text-white transition hover:bg-black/85 cursor-pointer"
          >
            Voltar para início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          Bem-vindo! 🎉
        </h1>
        <p className="mb-6 text-slate-600">
          Complete seu cadastro para começar a usar todas as funcionalidades.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Nome completo
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-black focus:outline-none"
              placeholder="Seu nome completo"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!!paymentEmail} // Desabilitar se veio do pagamento
              className="w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:border-black focus:outline-none disabled:bg-slate-100 disabled:cursor-not-allowed"
              placeholder="seu@email.com"
            />
            {paymentEmail && (
              <p className="mt-1 text-xs text-slate-500">
                Email confirmado pelo pagamento
              </p>
            )}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-lg bg-black px-4 py-2 font-semibold text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting
              ? "Processando..."
              : user
              ? "Continuar"
              : "Criar conta"}
          </button>
        </form>

        {user && (
          <p className="mt-4 text-center text-sm text-slate-500">
            Você já está logado como {user.emailAddresses[0]?.emailAddress}
          </p>
        )}
      </div>
    </div>
  );
}
