// Mapeamento Stripe Price IDs -> Planos/Addons Internos
export const stripePriceMap = {
  // Planos Mensais
  price_starter_monthly: { type: "plan", id: "starter", interval: "month" },
  price_business_monthly: { type: "plan", id: "business", interval: "month" },
  price_enterprise_monthly: {
    type: "plan",
    id: "enterprise",
    interval: "month",
  },

  // Planos Anuais
  price_starter_yearly: { type: "plan", id: "starter", interval: "year" },
  price_business_yearly: { type: "plan", id: "business", interval: "year" },
  price_enterprise_yearly: { type: "plan", id: "enterprise", interval: "year" },

  // Addons Avulsos
  price_ai_text_generator: {
    type: "addon",
    id: "ai_text_generator",
    recurring: true,
  },
  price_advanced_formula: {
    type: "addon",
    id: "advanced_formula",
    recurring: true,
  },
  price_cloudinary_pro: {
    type: "addon",
    id: "cloudinary_pro",
    recurring: true,
  },
  price_extra_workspace: {
    type: "addon",
    id: "extra_workspace",
    recurring: false,
  },

  // Pacotes de Créditos
  price_ai_credits_100: { type: "credits", id: "ai_credits", amount: 100 },
  price_ai_credits_500: { type: "credits", id: "ai_credits", amount: 500 },
  price_export_credits_50: {
    type: "credits",
    id: "export_credits",
    amount: 50,
  },
};

// Função helper para buscar mapping por ID do Stripe
export function getStripeMapping(stripePriceId) {
  return stripePriceMap[stripePriceId] || null;
}

// Função para validar se um price ID existe
export function isValidStripePriceId(stripePriceId) {
  return stripePriceId in stripePriceMap;
}
