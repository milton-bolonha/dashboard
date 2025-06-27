import { auth } from "@clerk/nextjs/server";

/**
 * Obtém o userId atual do Clerk nas APIs
 * @returns {string} userId ou lança erro se não autenticado
 */
export function getCurrentUserId() {
  const { userId } = auth();

  if (!userId) {
    throw new Error("Usuário não autenticado");
  }

  return userId;
}

/**
 * Obtém dados do usuário atual (opcional)
 * @returns {object|null} Dados do auth ou null se não autenticado
 */
export function getCurrentAuth() {
  return auth();
}

/**
 * Verifica se o usuário está autenticado
 * @returns {boolean}
 */
export function isAuthenticated() {
  const { userId } = auth();
  return !!userId;
}

/**
 * Middleware para proteger APIs que precisam de autenticação
 * @param {function} handler - Handler da API
 * @returns {function} Handler protegido
 */
export function withAuth(handler) {
  return async (request, context) => {
    try {
      console.log("🔐 withAuth: Validando autenticação...");
      const authData = auth();
      console.log("🔐 withAuth: Auth data completo:", authData);

      // DEBUG: Verificar chaves de ambiente
      console.log("🔐 withAuth: Variáveis de ambiente:", {
        hasPublicKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
        hasSecretKey: !!process.env.CLERK_SECRET_KEY,
        publicKeyPrefix:
          process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.substring(0, 10),
        secretKeyPrefix: process.env.CLERK_SECRET_KEY?.substring(0, 10),
      });

      const userId = getCurrentUserId(); // Valida se está autenticado
      console.log("🔐 withAuth: UserId obtido:", userId);

      return await handler(request, context);
    } catch (error) {
      console.error("🔐 withAuth: Erro de autenticação:", error.message);
      console.error("🔐 withAuth: Stack trace:", error.stack);

      return new Response(
        JSON.stringify({
          error: "Acesso não autorizado",
          details: error.message,
          debug: {
            hasPublicKey: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
            hasSecretKey: !!process.env.CLERK_SECRET_KEY,
            timestamp: new Date().toISOString(),
          },
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  };
}
