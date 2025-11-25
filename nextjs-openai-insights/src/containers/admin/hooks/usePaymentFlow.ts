"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMembership, type GuestAction } from "@/lib/state/membership-context";
import { usePayment } from "@/lib/state/payment-context";
import { useToast } from "@/lib/state/toast-context";

/**
 * Payment and membership flow management
 * Handles upgrade modals, payment verification, and usage tracking
 */
export function usePaymentFlow() {
  const router = useRouter();
  const { push } = useToast();
  
  const {
    isMember,
    isGuest,
    limits,
    usage,
    evaluateUsage,
    consumeUsage,
    startCheckout,
    markMember,
    stripeCheckoutUrl,
  } = useMembership();
  
  const payment = usePayment();
  
  // Modal states
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [isPaymentEmailModalOpen, setIsPaymentEmailModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<GuestAction | null>(null);

  // Verificar status de pagamento ao carregar
  useEffect(() => {
    // Se precisa de onboarding, redirecionar
    if (payment.status === "onboarding") {
      router.push("/onboarding");
      return;
    }

    // Se pagamento está sendo verificado, aguardar
    if (payment.status === "verifying") {
      return;
    }

    // Se pagamento foi confirmado mas ainda não completou onboarding, verificar novamente
    if (payment.status === "paid" && payment.sessionId) {
      payment.completePayment(payment.sessionId);
    }
  }, [payment.status, payment.sessionId, router, payment]);

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

  // Fechar upgrade modal quando vira member
  useEffect(() => {
    if (isMember) {
      setUpgradeModalOpen(false);
      setUpgradeReason(null);
    }
  }, [isMember]);

  // Request upgrade (show modal)
  const requestUpgrade = useCallback((action: GuestAction) => {
    setUpgradeReason(action);
    setUpgradeModalOpen(true);
  }, []);

  // Check if action is allowed (for guests)
  const ensureAllowance = useCallback(
    (action: GuestAction): boolean => {
      if (isMember) return true;
      const preview = evaluateUsage(action);
      if (!preview.allowed) {
        requestUpgrade(action);
        return false;
      }
      return true;
    },
    [evaluateUsage, isMember, requestUpgrade]
  );

  // Commit usage (for guests)
  const commitUsage = useCallback(
    (action: GuestAction) => {
      if (isMember) return;
      consumeUsage(action);
    },
    [consumeUsage, isMember]
  );

  // Start checkout flow
  const handleStartCheckout = useCallback(() => {
    const opened = startCheckout();
    if (!opened) {
      push({
        title: "Configure o checkout",
        description:
          "Defina NEXT_PUBLIC_STRIPE_CHECKOUT_URL para habilitar a compra do plano.",
        variant: "destructive",
      });
    }
  }, [push, startCheckout]);

  // Confirm membership (dev/testing)
  const handleConfirmMembership = useCallback(() => {
    markMember();
    push({
      title: "Plano ativado",
      description: "Agora você tem acesso completo sem limites!",
      variant: "success",
    });
    setUpgradeModalOpen(false);
    setUpgradeReason(null);
  }, [markMember, push]);

  return {
    // State
    isMember,
    isGuest,
    limits,
    usage,
    isUpgradeModalOpen,
    isPaymentEmailModalOpen,
    upgradeReason,
    stripeCheckoutUrl,
    paymentStatus: payment.status,
    
    // Actions
    requestUpgrade,
    ensureAllowance,
    commitUsage,
    startCheckout: handleStartCheckout,
    confirmMembership: handleConfirmMembership,
    
    // Modal controls
    setUpgradeModalOpen,
    setIsPaymentEmailModalOpen,
  };
}
