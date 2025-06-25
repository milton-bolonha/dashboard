"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { PlanCard } from "../components/billing/PlanCard";

export function BillingContainer() {
  const { user, isLoaded } = useUser();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    // Carrega planos disponíveis
    const loadPlans = async () => {
      try {
        const response = await fetch("/api/plans");
        const data = await response.json();
        setPlans(data.plans);
      } catch (error) {
        console.error("Erro ao carregar planos:", error);
      }
    };

    loadPlans();
  }, []);

  useEffect(() => {
    if (isLoaded && user) {
      const userPlan = user.unsafeMetadata?.currentPlan;
      setCurrentPlan(userPlan);
    }
  }, [isLoaded, user]);

  const handleSelectPlan = async (plan) => {
    setLoading(true);

    try {
      // Cria sessão de checkout no Stripe
      const response = await fetch("/.netlify/functions/billing-create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId: plan.stripe_price_id,
          customerId: user.unsafeMetadata?.stripeCustomerId,
          successUrl: `${window.location.origin}/dashboard/billing/success`,
          cancelUrl: `${window.location.origin}/dashboard/billing/cancel`,
        }),
      });

      const { url } = await response.json();

      // Redireciona para Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error("Erro ao criar checkout:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Escolha seu Plano de Amor 💖
        </h1>
        <p className="text-xl text-gray-600">
          Crie histórias únicas e eternize seus momentos especiais
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <PlanCard
            key={plan.id || index}
            plan={plan}
            isPopular={plan.popular}
            currentPlan={currentPlan === plan.id}
            onSelect={handleSelectPlan}
            loading={loading}
          />
        ))}
      </div>

      {currentPlan && (
        <div className="mt-12 p-6 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-2">
            Plano Atual: {currentPlan}
          </h3>
          <p className="text-green-700">
            Você tem acesso a todos os recursos do seu plano.
          </p>
        </div>
      )}
    </div>
  );
}
