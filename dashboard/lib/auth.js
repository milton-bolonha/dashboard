import * as ClerkServer from "@clerk/nextjs/server";
import { createRemoteJWKSet, jwtVerify } from "jose";

const clerkFrontendApi = process.env.NEXT_PUBLIC_CLERK_FRONTEND_API;

if (!clerkFrontendApi) {
  throw new Error(
    "FATAL: A variável de ambiente NEXT_PUBLIC_CLERK_FRONTEND_API não está definida. A autenticação não pode funcionar. Por favor, adicione-a ao seu arquivo .env.local."
  );
}

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

// URL para buscar as chaves públicas de assinatura do Clerk.
// Isso é necessário para verificar a autenticidade do JWT com a biblioteca 'jose'.
const JWKS = createRemoteJWKSet(
  new URL(`${clerkFrontendApi}/.well-known/jwks.json`)
);

/**
 * Obtém o usuário autenticado, com um fallback robusto e seguro.
 * Tenta obter o userId usando o método padrão auth().
 * Se falhar, usa 'jose' para verificar e decodificar o token JWT.
 * @returns {Promise<{userId: string|null, session: object|null, claims: object|null, error?: string, status?: number}>}
 */
export async function getAuthenticatedUser() {
  try {
    const authObject = await ClerkServer.auth();

    if (authObject && authObject.userId) {
      console.log("getAuthenticatedUser: Sucesso via auth()");
      return {
        userId: authObject.userId,
        session: authObject.session,
        claims: authObject.sessionClaims,
      };
    }

    // --- Início do Fallback JWT com 'jose' ---
    console.warn(
      "getAuthenticatedUser: auth() falhou. Tentando fallback com verificação JWT via 'jose'."
    );
    const { getToken, session } = ClerkServer.auth();
    const token = await getToken();

    if (!token) {
      console.error(
        "getAuthenticatedUser (Fallback): Nenhum token encontrado."
      );
      return { error: "Unauthorized: No session token", status: 401 };
    }

    const { payload } = await jwtVerify(token, JWKS);
    const userIdFromToken = payload.sub;

    if (!userIdFromToken) {
      console.error(
        "getAuthenticatedUser (Fallback): Não foi possível verificar o token JWT."
      );
      return {
        error: "Unauthorized: Invalid session token",
        status: 401,
      };
    }

    console.log(
      `getAuthenticatedUser: Sucesso via Fallback JWT. userId: ${userIdFromToken}`
    );

    const manualClient = ClerkServer.createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    const user = await manualClient.users.getUser(userIdFromToken);
    const claims = user.privateMetadata || {};

    return {
      userId: userIdFromToken,
      session: session,
      claims: claims,
    };
    // --- Fim do Fallback JWT ---
  } catch (error) {
    console.error("Erro fatal em getAuthenticatedUser:", error.message);
    if (error.code === "ERR_JWKS_REMOTE_FAILED") {
      console.error(
        "Falha ao buscar JWKS. Verifique a variável de ambiente NEXT_PUBLIC_CLERK_FRONTEND_API."
      );
      return { error: "Auth configuration error", status: 500 };
    }
    return { error: "Internal Server Error", status: 500 };
  }
}

/**
 * Função de verificação de Super Admin que usa nossa função robusta.
 * @returns {Promise<{userId: string|null, error?: string, status?: number}>}
 */
export async function checkSuperAdmin() {
  const authData = await getAuthenticatedUser();

  if (authData.error) {
    return { error: authData.error, status: authData.status };
  }

  const { userId } = authData;

  try {
    const manualClient = ClerkServer.createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    const user = await manualClient.users.getUser(userId);

    // Log para depuração final
    console.log(
      "checkSuperAdmin: Metadados privados do usuário:",
      JSON.stringify(user.privateMetadata, null, 2)
    );

    const isSuperAdmin = user.privateMetadata?.role === "superadmin";

    if (!isSuperAdmin) {
      console.error(
        `checkSuperAdmin: User ${userId} is not a super admin. Role encontrada nos metadados: ${user.privateMetadata?.role}`
      );
      return { error: "Forbidden - Super admin only", status: 403 };
    }

    console.log(
      `checkSuperAdmin: Acesso de Super Admin concedido para ${userId}.`
    );
    return { userId };
  } catch (error) {
    console.error(
      `checkSuperAdmin: Erro ao buscar usuário ${userId} da API do Clerk:`,
      error
    );
    return { error: "Internal Server Error during user fetch", status: 500 };
  }
}

/**
 * Obtém o userId atual com suporte a desenvolvimento
 */
export async function getCurrentUserId() {
  try {
    const { userId } = await ClerkServer.auth();

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
    const { userId } = await ClerkServer.auth();

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
