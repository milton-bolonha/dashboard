"use client";

import { useUser } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";

export function useUserPlanVerification() {
  const { user, isLoaded } = useUser();
  const [verificationStatus, setVerificationStatus] = useState({
    isVerifying: false,
    isInitialized: false,
    lastVerified: null,
    plans: { active: [], expired: [] },
    source: null,
    error: null,
    mongoUser: null,
  });

  const verifyUserPlans = useCallback(
    async (force = false) => {
      if (!isLoaded || !user) return;

      setVerificationStatus((prev) => ({
        ...prev,
        isVerifying: true,
        error: null,
      }));

      try {
        console.log("🔍 Iniciando verificação de planos + sync MongoDB...");

        // 1. Verificar planos no Stripe/Clerk
        const planResponse = await fetch("/api/billing/verify-user", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!planResponse.ok) {
          throw new Error(
            `Erro na verificação de planos: ${planResponse.status}`
          );
        }

        const planData = await planResponse.json();
        console.log("✅ Planos verificados:", planData);

        // 2. Sincronizar usuário com MongoDB
        const userResponse = await fetch("/api/users/sync", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ action: "sync_current_user" }),
        });

        let mongoUser = null;
        if (userResponse.ok) {
          const userData = await userResponse.json();
          mongoUser = userData.user;
          console.log("✅ Usuário sincronizado com MongoDB");
        } else {
          console.warn("⚠️ Falha na sincronização com MongoDB");
        }

        setVerificationStatus({
          isVerifying: false,
          isInitialized: true,
          lastVerified: planData.lastVerified,
          plans: planData.plans,
          source: planData.source,
          error: null,
          mongoUser,
        });

        // Se houve atualização significativa, pode forçar reload
        if (planData.needsUpdate && planData.source === "stripe_sync") {
          console.log(
            "🔄 Dados atualizados do Stripe, recarregando contexto..."
          );
          // Opcional: recarregar dados do Clerk
          setTimeout(() => window.location.reload(), 1000);
        }
      } catch (error) {
        console.error("❌ Erro na verificação completa:", error);
        setVerificationStatus((prev) => ({
          ...prev,
          isVerifying: false,
          isInitialized: true,
          error: error.message,
        }));
      }
    },
    [isLoaded, user]
  );

  // Função para buscar transações do usuário
  const getUserTransactions = useCallback(
    async (options = {}) => {
      if (!user) return null;

      try {
        const { limit = 10, skip = 0, status, type } = options;
        const params = new URLSearchParams({
          limit: limit.toString(),
          skip: skip.toString(),
        });

        if (status) params.append("status", status);
        if (type) params.append("type", type);

        const response = await fetch(`/api/billing/transactions?${params}`);

        if (!response.ok) {
          throw new Error(`Erro ao buscar transações: ${response.status}`);
        }

        return await response.json();
      } catch (error) {
        console.error("❌ Erro ao buscar transações:", error);
        return null;
      }
    },
    [user]
  );

  // Função para forçar sincronização completa
  const forceSyncAll = useCallback(async () => {
    if (!user) return;

    setVerificationStatus((prev) => ({ ...prev, isVerifying: true }));

    try {
      // Sincronizar usuário
      const userResponse = await fetch("/api/users/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "sync_current_user" }),
      });

      // Verificar planos
      const planResponse = await fetch("/api/billing/verify-user?force=true");

      if (userResponse.ok && planResponse.ok) {
        const userData = await userResponse.json();
        const planData = await planResponse.json();

        setVerificationStatus((prev) => ({
          ...prev,
          isVerifying: false,
          mongoUser: userData.user,
          plans: planData.plans,
          lastVerified: planData.lastVerified,
          source: "forced_sync",
        }));

        console.log("✅ Sincronização completa realizada");
      }
    } catch (error) {
      console.error("❌ Erro na sincronização forçada:", error);
      setVerificationStatus((prev) => ({ ...prev, isVerifying: false }));
    }
  }, [user]);

  // Verificação automática no mount/login
  useEffect(() => {
    if (isLoaded && user && !verificationStatus.isInitialized) {
      console.log("🚀 Verificação automática + MongoDB sync iniciada");
      verifyUserPlans();
    }
  }, [isLoaded, user, verificationStatus.isInitialized, verifyUserPlans]);

  // Expor planos do unsafeMetadata também (para fallback)
  const clerkPlans = user?.unsafeMetadata?.plans || { active: [], expired: [] };
  const clerkBilling = user?.unsafeMetadata?.billing || {};

  return {
    // Status da verificação
    isVerifying: verificationStatus.isVerifying,
    isInitialized: verificationStatus.isInitialized,
    error: verificationStatus.error,

    // Dados dos planos (priorizando dados verificados)
    plans:
      verificationStatus.plans.active.length > 0
        ? verificationStatus.plans
        : clerkPlans,

    // Metadados da verificação
    lastVerified: verificationStatus.lastVerified || clerkPlans.lastVerified,
    source: verificationStatus.source,

    // Dados de billing do Clerk
    billing: clerkBilling,

    // Dados do MongoDB
    mongoUser: verificationStatus.mongoUser,

    // Métodos
    manualVerify: () => verifyUserPlans(true),
    forceSyncAll,
    getUserTransactions,

    // Helpers úteis
    hasActivePlans: () => {
      const activePlans =
        verificationStatus.plans.active.length > 0
          ? verificationStatus.plans.active
          : clerkPlans.active || [];
      return activePlans.length > 0;
    },

    hasPlan: (planId) => {
      const activePlans =
        verificationStatus.plans.active.length > 0
          ? verificationStatus.plans.active
          : clerkPlans.active || [];
      return activePlans.includes(planId);
    },

    needsVerification: () => {
      const lastVerified =
        verificationStatus.lastVerified || clerkPlans.lastVerified;
      if (!lastVerified) return true;

      const timeDiff = Date.now() - new Date(lastVerified).getTime();
      return timeDiff > 24 * 60 * 60 * 1000; // 24h
    },

    // Stats úteis
    getTotalSpent: () => {
      return (
        verificationStatus.mongoUser?.totalSpent || clerkBilling.totalSpent || 0
      );
    },

    getLastPayment: () => {
      return (
        verificationStatus.mongoUser?.lastPayment || clerkBilling.lastPayment
      );
    },
  };
}

// Hook simplificado para apenas verificar se tem planos
export function useHasPlans() {
  const { plans, isInitialized } = useUserPlanVerification();

  return {
    hasPlans: plans.active?.length > 0,
    activePlans: plans.active || [],
    isLoading: !isInitialized,
  };
}

// Hook para verificar plano específico
export function useHasPlan(planId) {
  const { plans, isInitialized } = useUserPlanVerification();

  return {
    hasPlan: plans.active?.includes(planId) || false,
    isLoading: !isInitialized,
  };
}

// Hook para dados de billing
export function useUserBilling() {
  const {
    mongoUser,
    billing,
    getUserTransactions,
    getTotalSpent,
    getLastPayment,
    isInitialized,
  } = useUserPlanVerification();

  return {
    totalSpent: getTotalSpent(),
    lastPayment: getLastPayment(),
    mongoData: mongoUser,
    clerkData: billing,
    getUserTransactions,
    isLoading: !isInitialized,
  };
}
