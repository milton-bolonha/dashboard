/**
 * 🔒 Workspace Validation Library
 *
 * Validação centralizada para criação de workspaces
 * Previne duplicação de nomes e garante consistência
 */

import { db } from "./db";

/**
 * Escapa caracteres especiais de regex
 * @param {string} string
 * @returns {string}
 */
function escapeRegex(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Valida nome de workspace (verifica duplicação)
 *
 * @param {string} name - Nome do workspace
 * @param {string} userId - Clerk userId
 * @returns {Promise<{valid: boolean, error?: string, suggestion?: string, existingId?: string}>}
 */
export async function validateWorkspaceName(name, userId) {
  const trimmed = name.trim();

  // 1. Validar formato
  if (!trimmed || trimmed.length < 2) {
    return {
      valid: false,
      error: "Workspace name must be at least 2 characters",
    };
  }

  if (trimmed.length > 100) {
    return {
      valid: false,
      error: "Workspace name must be less than 100 characters",
    };
  }

  // 2. Validar duplicação (case-insensitive)
  try {
    const existing = await db.findOne("workspaces", {
      name: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, "i") },
      $or: [{ ownerId: userId }, { "members.userId": userId }],
      isActive: true,
    });

    if (existing) {
      return {
        valid: false,
        error: "You already have a workspace with this name",
        suggestion: `${trimmed} (${new Date().getFullYear()})`,
        existingId: existing._id.toString(),
      };
    }

    return { valid: true };
  } catch (error) {
    console.error("❌ Error validating workspace name:", error);
    return {
      valid: false,
      error: "Error validating workspace name. Please try again.",
    };
  }
}

/**
 * Valida se usuário pode criar mais workspaces
 *
 * @param {string} userId
 * @param {object} workspace - Workspace atual (para checar limits)
 * @returns {Promise<{canCreate: boolean, error?: string, currentCount?: number, limit?: number}>}
 */
export async function canCreateWorkspace(userId, workspace = null) {
  try {
    // Buscar todos workspaces do usuário
    const userWorkspaces = await db.find("workspaces", {
      ownerId: userId,
      isActive: true,
    });

    const currentCount = userWorkspaces.length;

    // Verificar limite do plano
    // Se tem workspace, usar o limite do primeiro workspace
    // Se não tem, permitir criar o primeiro
    const limit = workspace?.limits?.maxWorkspaces || 1;

    if (currentCount >= limit) {
      return {
        canCreate: false,
        error: `Workspace limit reached. Your plan allows ${limit} workspace(s).`,
        currentCount,
        limit,
      };
    }

    return {
      canCreate: true,
      currentCount,
      limit,
    };
  } catch (error) {
    console.error("❌ Error checking workspace limit:", error);
    return {
      canCreate: true, // Permitir em caso de erro (fail-safe)
      currentCount: 0,
      limit: 999,
    };
  }
}

/**
 * Busca workspace pelo nome (case-insensitive)
 *
 * @param {string} name
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
export async function findWorkspaceByName(name, userId) {
  try {
    const trimmed = name.trim();

    const workspace = await db.findOne("workspaces", {
      name: { $regex: new RegExp(`^${escapeRegex(trimmed)}$`, "i") },
      $or: [{ ownerId: userId }, { "members.userId": userId }],
      isActive: true,
    });

    return workspace;
  } catch (error) {
    console.error("❌ Error finding workspace by name:", error);
    return null;
  }
}
