import { auth } from "@clerk/nextjs/server";

/**
 * ✅ DEV MODE REALISTA
 * - Usa usuário real do Clerk
 * - Simula plano ativo para desenvolvimento
 * - Mantém segurança mas permite desenvolvimento
 */

// 🎯 CONFIGURAÇÃO: ID do seu usuário Clerk para desenvolvimento
const DEV_USER_ID = process.env.DEV_USER_ID || "your_clerk_user_id_here";
const DEV_MODE = process.env.NODE_ENV === "development";

// 🎭 SIMULAÇÃO: Plano ativo para desenvolvimento
const DEV_USER_PLAN = {
  plan: "zeus", // Plano premium para testes
  active: true,
  limits: {
    maxSections: 999,
    maxItems: 999,
    maxAddons: 999,
    maxUsers: 999,
  },
  features: ["all"],
};

/**
 * Obtém o userId atual com suporte a desenvolvimento
 */
export async function getCurrentUserId() {
  try {
    const { userId } = await auth();

    if (userId) {
      console.log(`🔐 User autenticado: ${userId}`);
      return userId;
    }

    // 🔧 DEV MODE: Se não autenticado mas em dev, usar usuário configurado
    if (DEV_MODE && DEV_USER_ID && DEV_USER_ID !== "your_clerk_user_id_here") {
      console.log(
        `🎭 DEV MODE: Simulando usuário ${DEV_USER_ID} com plano ${DEV_USER_PLAN.plan}`
      );
      return DEV_USER_ID;
    }

    throw new Error("Usuário não autenticado");
  } catch (error) {
    throw new Error("Usuário não autenticado");
  }
}

/**
 * Obtém dados de autenticação sem forçar erro (CORRIGIDO - agora usa await)
 */
export async function getCurrentAuth() {
  try {
    const { userId } = await auth();

    if (userId) {
      return {
        userId,
        isAuthenticated: true,
        plan: null, // Será buscado do banco/Stripe em produção
      };
    }

    // 🔧 DEV MODE: Retornar dados simulados
    if (DEV_MODE && DEV_USER_ID && DEV_USER_ID !== "your_clerk_user_id_here") {
      return {
        userId: DEV_USER_ID,
        isAuthenticated: true,
        plan: DEV_USER_PLAN,
        isDev: true,
      };
    }

    return { userId: null, isAuthenticated: false };
  } catch (error) {
    console.warn("🔧 Auth fallback ativado:", error.message);

    // 🔧 DEV MODE: Fallback para desenvolvimento
    if (DEV_MODE && DEV_USER_ID && DEV_USER_ID !== "your_clerk_user_id_here") {
      return {
        userId: DEV_USER_ID,
        isAuthenticated: true,
        plan: DEV_USER_PLAN,
        isDev: true,
      };
    }

    return { userId: null, isAuthenticated: false };
  }
}

/**
 * Middleware de autenticação para APIs
 */
export function withAuth(handler) {
  return async (request, params) => {
    try {
      const userId = await getCurrentUserId();

      // ✅ Usuário autenticado ou em dev mode
      return await handler(request, params, { userId });
    } catch (error) {
      console.error("🔐 withAuth: Erro de autenticação:", error.message);
      return new Response(
        JSON.stringify({ error: "Usuário não autenticado" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  };
}

/**
 * Simula dados de plano para desenvolvimento
 */
export function getDevUserPlan() {
  return DEV_USER_PLAN;
}

/**
 * Verifica se está em modo de desenvolvimento
 */
export function isDevMode() {
  return DEV_MODE;
}
