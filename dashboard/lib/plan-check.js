import { clerkClient } from "@clerk/nextjs/server";
import { getCurrentAuth } from "./auth.js";

// Hierarquia de planos para permitir comparações
const PLAN_HIERARCHY = {
  free: 0,
  pro: 1,
  unlimited: 2,
  zeus: 99,
};

/**
 * Verifica se o plano do usuário atual atende a um requisito mínimo.
 * @param {string} requiredPlan - O slug do plano mínimo necessário (ex: 'pro').
 * @returns {Promise<boolean>} - Retorna true se o usuário atender ao requisito, false caso contrário.
 */
export async function checkPlan(requiredPlan) {
  try {
    const { userId, plan: devPlan } = await getCurrentAuth();

    if (!userId) {
      return false; // Não autenticado
    }

    // Em modo de desenvolvimento, o plano pode vir direto do auth.js
    if (devPlan) {
      const currentUserLevel = PLAN_HIERARCHY[devPlan.plan] ?? -1;
      const requiredLevel = PLAN_HIERARCHY[requiredPlan] ?? -1;
      return currentUserLevel >= requiredLevel;
    }

    // Em produção, buscar do Clerk
    const user = await clerkClient.users.getUser(userId);
    const userPlan = user.publicMetadata?.plan || "free";

    const currentUserLevel = PLAN_HIERARCHY[userPlan] ?? -1;
    const requiredLevel = PLAN_HIERARCHY[requiredPlan] ?? -1;

    return currentUserLevel >= requiredLevel;
  } catch (error) {
    console.error("Erro ao verificar plano do usuário:", error);
    return false; // Falha em um estado seguro
  }
}

/**
 * Retorna os detalhes do plano do usuário atual.
 */
export async function getUserPlan() {
  try {
    const { userId, plan: devPlan } = await getCurrentAuth();
    if (!userId) return null;
    if (devPlan) return devPlan;

    const user = await clerkClient.users.getUser(userId);
    return user.publicMetadata?.plan || "free";
  } catch (error) {
    console.error("Erro ao buscar plano do usuário:", error);
    return null;
  }
}
