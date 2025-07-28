import { clerkClient } from "@clerk/nextjs/server";
import { getCurrentAuth, checkSuperAdmin } from "./auth.js";

// Hierarquia de planos para permitir comparações
const PLAN_HIERARCHY = {
  free: 0,
  pro: 1,
  unlimited: 2,
  zeus: 99,
};

/**
 * Verifica se o plano do usuário atual atende a um requisito mínimo.
 * @param {string} userId - O ID do usuário obtido via getCurrentAuth.
 * @param {string} requiredPlan - O slug do plano mínimo necessário (ex: 'pro').
 * @returns {Promise<boolean>} - Retorna true se o usuário atender ao requisito, false caso contrário.
 */
export async function checkPlan(userId, requiredPlan) {
  try {
    // Super Admins sempre têm acesso, ignorando qualquer outra verificação.
    const superAdminCheck = await checkSuperAdmin();
    if (!superAdminCheck.error) {
      console.log("SUPER ADMIN bypass: Acesso concedido.");
      return true;
    }

    if (!userId) {
      return false; // Não autenticado
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
    // Super Admins podem ter um plano diferente para teste
    const superAdminCheck = await checkSuperAdmin();
    if (!superAdminCheck.error) {
      console.log("SUPER ADMIN bypass: Retornando plano 'zeus' mock.");
      return "zeus";
    }

    const { userId } = await getCurrentAuth();
    if (!userId) return null;

    const user = await clerkClient.users.getUser(userId);
    return user.publicMetadata?.plan || "free";
  } catch (error) {
    console.error("Erro ao buscar plano do usuário:", error);
    return null;
  }
}
