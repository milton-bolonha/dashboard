// Configuração de mapeamento entre Stripe Price IDs e nossos Plan IDs
// Configure aqui os IDs reais do seu Stripe Dashboard

export const STRIPE_PLAN_MAPPING = {
  // Ambiente de TESTE
  test: {
    price_test_cupido123: "cupido",
    price_test_afrodite456: "afrodite",
    price_test_zeus789: "zeus",
  },

  // Ambiente de PRODUÇÃO
  live: {
    price_live_cupido123: "cupido",
    price_live_afrodite456: "afrodite",
    price_live_zeus789: "zeus",
  },
};

// Função helper para mapear price_id para plan_id
export function mapStripePriceToPlan(priceId) {
  const environment = priceId.includes("test") ? "test" : "live";
  const mapping = STRIPE_PLAN_MAPPING[environment];

  return mapping[priceId] || null;
}

// Função helper para obter price_id de um plano
export function getPlanStripePrice(planId, isTest = true) {
  const environment = isTest ? "test" : "live";
  const mapping = STRIPE_PLAN_MAPPING[environment];

  // Procura o price_id pelo plan_id
  for (const [priceId, mappedPlanId] of Object.entries(mapping)) {
    if (mappedPlanId === planId) {
      return priceId;
    }
  }

  return null;
}

// Configuração de webhooks suportados
export const SUPPORTED_WEBHOOK_EVENTS = [
  "checkout.session.completed",
  "invoice.paid",
  "customer.subscription.deleted",
  "payment_intent.succeeded",
];

// Configuração de TTL do cache
export const CACHE_CONFIG = {
  planVerificationTTL: 24 * 60 * 60 * 1000, // 24 horas em ms
  forceVerificationInterval: 7 * 24 * 60 * 60 * 1000, // 7 dias em ms
};
