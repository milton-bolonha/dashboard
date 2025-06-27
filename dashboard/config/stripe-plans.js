// Configuração de mapeamento entre Stripe Price IDs e nossos Plan IDs
// INSTRUÇÃO: Configure aqui os IDs reais do seu Stripe Dashboard

export const STRIPE_PLAN_MAPPING = {
  // Ambiente de TESTE
  test: {
    // ⚠️ SUBSTITUA pelos IDs reais do Stripe (mode test)
    price_test_cupido123: "cupido", // ← Substitua price_test_cupido123
    price_test_afrodite456: "afrodite", // ← Substitua price_test_afrodite456
    price_test_zeus789: "zeus", // ← Substitua price_test_zeus789
  },

  // Ambiente de PRODUÇÃO
  live: {
    // ⚠️ SUBSTITUA pelos IDs reais do Stripe (mode live)
    price_live_cupido123: "cupido", // ← Substitua price_live_cupido123
    price_live_afrodite456: "afrodite", // ← Substitua price_live_afrodite456
    price_live_zeus789: "zeus", // ← Substitua price_live_zeus789
  },
};

// ⚠️ EXEMPLO DE COMO FICARÁ APÓS CONFIGURAR:
// export const STRIPE_PLAN_MAPPING = {
//   test: {
//     price_1OH8K2B3XdP9WqkF8D7uJxH4: "cupido",     // ← ID real do Stripe
//     price_1OH8K2B3XdP9WqkF8D7uJxH5: "afrodite",   // ← ID real do Stripe
//     price_1OH8K2B3XdP9WqkF8D7uJxH6: "zeus",       // ← ID real do Stripe
//   },
//   live: {
//     price_1OH8K2B3XdP9WqkF8D7uJxH7: "cupido",     // ← ID real do Stripe
//     price_1OH8K2B3XdP9WqkF8D7uJxH8: "afrodite",   // ← ID real do Stripe
//     price_1OH8K2B3XdP9WqkF8D7uJxH9: "zeus",       // ← ID real do Stripe
//   },
// };

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
