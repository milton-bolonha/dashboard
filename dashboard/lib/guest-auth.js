/**
 * Guest Auth Helper
 * Identifica se request é de usuário autenticado OU guest
 *
 * Seguindo padrão do projeto: getCurrentAuth() para users
 */

import { getCurrentAuth } from "@/lib/auth";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

/**
 * Obtém autenticação: usuário real OU guest
 * @returns {Promise<{type: 'user'|'guest'|'anonymous', userId?: string, guestId?: string, isGuest: boolean}>}
 */
export async function getAuthOrGuest() {
  // Tentar autenticação real primeiro (padrão do projeto)
  const authData = await getCurrentAuth();

  if (authData.isAuthenticated) {
    return {
      type: "user",
      userId: authData.userId,
      isGuest: false,
      plan: authData.plan,
    };
  }

  // Fallback: Buscar guest session
  const guestId = cookies().get("guest_id")?.value;

  if (guestId && (await isValidGuestSession(guestId))) {
    return {
      type: "guest",
      guestId: guestId,
      isGuest: true,
      limits: GUEST_LIMITS,
    };
  }

  return {
    type: "anonymous",
    isGuest: true,
    userId: null,
    guestId: null,
  };
}

/**
 * Valida se guest session existe e não expirou
 */
async function isValidGuestSession(guestId) {
  try {
    const session = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!session) return false;

    // Verificar expiração
    if (new Date() > session.expires_at) {
      // Expirada - deletar
      await db.deleteOne("guest_workspaces", { guest_id: guestId });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating guest session:", error);
    return false;
  }
}

/**
 * Limites hardcoded para guests
 */
export const GUEST_LIMITS = {
  max_companies: 2,
  max_api_calls_per_day: 100,
  allowed_templates: ["template_1", "template_2"],
  blocked_features: [
    "connect_crm",
    "upload_csv",
    "bulk_prompts",
    "create_dashboard",
    "custom_templates",
    "add_team_members",
  ],
};

/**
 * Verifica se guest pode acessar uma feature
 */
export function canAccessFeature(auth, featureName) {
  // Usuário autenticado = acesso total
  if (auth.type === "user") {
    return { allowed: true };
  }

  // Guest = checar limites
  if (auth.isGuest && GUEST_LIMITS.blocked_features.includes(featureName)) {
    return {
      allowed: false,
      error: `This feature requires an account. "${featureName}" is not available in trial mode.`,
      upgrade_required: true,
    };
  }

  return { allowed: true };
}
