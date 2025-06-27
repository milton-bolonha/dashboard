/**
 * 🎯 VERIFICAÇÃO DE LIMITES DE PLANOS
 * Com bypass para desenvolvimento
 */

// Limites padrão para desenvolvimento
const DEV_LIMITS = {
  maxSections: 999,
  maxItems: 999,
  maxAddons: 999,
  maxUsers: 999,
};

// Limites por plano
const PLAN_LIMITS = {
  cupido: {
    maxSections: 5,
    maxItems: 100,
    maxAddons: 3,
    maxUsers: 1,
  },
  afrodite: {
    maxSections: 15,
    maxItems: 500,
    maxAddons: 10,
    maxUsers: 3,
  },
  zeus: {
    maxSections: -1, // Ilimitado
    maxItems: -1, // Ilimitado
    maxAddons: -1, // Ilimitado
    maxUsers: -1, // Ilimitado
  },
};

/**
 * Verifica se o usuário pode criar mais items
 * @param {string} userId - ID do usuário
 * @param {Array} userPlans - Planos ativos do usuário
 * @param {number} currentItemCount - Número atual de items
 * @returns {object} { canCreate: boolean, reason?: string, limit?: number }
 */
export async function checkItemLimit(
  userId,
  userPlans = [],
  currentItemCount = 0
) {
  // ✅ BYPASS PARA DESENVOLVIMENTO
  if (process.env.NODE_ENV === "development" || userId === "temp_user_dev") {
    console.log(`🔓 BYPASS DEV: Permitindo criação de item para ${userId}`);
    return {
      canCreate: true,
      reason: "Modo desenvolvimento - limites ignorados",
      limit: DEV_LIMITS.maxItems,
      bypassMode: true,
    };
  }

  // Se não tem planos, usar limite gratuito
  if (!userPlans || userPlans.length === 0) {
    const freeLimit = 5; // Limite gratuito
    return {
      canCreate: currentItemCount < freeLimit,
      reason:
        currentItemCount >= freeLimit ? "Limite gratuito atingido" : undefined,
      limit: freeLimit,
      planType: "free",
    };
  }

  // Encontrar o plano com maior limite
  let maxLimit = 0;
  let activePlan = null;

  for (const planId of userPlans) {
    const limits = PLAN_LIMITS[planId];
    if (limits) {
      const itemLimit = limits.maxItems;
      if (itemLimit === -1 || itemLimit > maxLimit) {
        maxLimit = itemLimit;
        activePlan = planId;
      }
    }
  }

  // Se tem plano ilimitado (-1)
  if (maxLimit === -1) {
    return {
      canCreate: true,
      reason: `Plano ${activePlan} - Ilimitado`,
      limit: -1,
      planType: activePlan,
    };
  }

  // Verificar limite
  return {
    canCreate: currentItemCount < maxLimit,
    reason:
      currentItemCount >= maxLimit
        ? `Limite do plano ${activePlan} atingido`
        : undefined,
    limit: maxLimit,
    planType: activePlan,
  };
}

/**
 * Verifica se o usuário pode criar mais sections
 */
export async function checkSectionLimit(
  userId,
  userPlans = [],
  currentSectionCount = 0
) {
  // ✅ BYPASS PARA DESENVOLVIMENTO
  if (process.env.NODE_ENV === "development" || userId === "temp_user_dev") {
    return {
      canCreate: true,
      reason: "Modo desenvolvimento",
      limit: DEV_LIMITS.maxSections,
      bypassMode: true,
    };
  }

  // Lógica similar para sections...
  return {
    canCreate: true,
    reason: "Verificação de sections não implementada ainda",
  };
}

/**
 * Obter informações dos planos do usuário
 */
export async function getUserPlanInfo(userId) {
  try {
    // Em desenvolvimento, simular planos
    if (process.env.NODE_ENV === "development") {
      return {
        plans: { active: ["afrodite"] },
        billing: { totalSpent: 127 },
        source: "dev_mode",
        bypassMode: true,
      };
    }

    // Tentar buscar dados reais do Clerk
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/billing/verify-user`,
      {
        headers: {
          Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
        },
      }
    );

    if (response.ok) {
      return await response.json();
    }

    // Fallback se API falhar
    return {
      plans: { active: [] },
      billing: { totalSpent: 0 },
      source: "fallback",
    };
  } catch (error) {
    console.warn("⚠️ Erro ao obter info de planos:", error.message);
    return {
      plans: { active: [] },
      billing: { totalSpent: 0 },
      source: "error",
    };
  }
}

/**
 * Wrapper para logs de debug
 */
export function logPlanCheck(userId, action, result) {
  console.log(`🔍 PLAN CHECK: ${action} para ${userId}:`, {
    canCreate: result.canCreate,
    reason: result.reason,
    limit: result.limit,
    planType: result.planType,
    bypassMode: result.bypassMode,
  });
}
