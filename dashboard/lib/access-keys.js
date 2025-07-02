import { db } from "./db";
import { ObjectId } from "mongodb";

/**
 * Serviço de Chaves de Acesso
 *
 * Sistema para gerar e gerenciar chaves que liberam acesso a planos e features
 * sem necessidade de pagamento (ideal para beta testers, promoções, etc)
 */
export class AccessKeys {
  /**
   * Gera uma nova chave de acesso
   */
  static async generateKey(config) {
    const {
      name,
      description,
      type, // 'plan', 'feature', 'addon', 'custom'
      grants,
      usage = { maxUses: 1 },
      restrictions = {},
      tags = [],
      createdBy,
    } = config;

    // Gerar código único
    const code = this.generateKeyCode(type);

    const key = {
      _id: new ObjectId().toString(),
      code,
      name,
      description,
      type,
      grants,
      usage: {
        maxUses: usage.maxUses || 1,
        currentUses: 0,
        allowMultiplePerUser: usage.allowMultiplePerUser || false,
        allowMultiplePerWorkspace: usage.allowMultiplePerWorkspace || false,
      },
      restrictions,
      activations: [],
      isActive: true,
      isPublic: restrictions.isPublic || false,
      autoExpire: true,
      tags,
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
      analytics: {
        viewCount: 0,
        attemptCount: 0,
        successCount: 0,
      },
    };

    await db.insertOne("access_keys", key);
    return key;
  }

  /**
   * Ativa uma chave para um workspace
   */
  static async activateKey(
    code,
    userId,
    workspaceId,
    userEmail,
    metadata = {}
  ) {
    try {
      // Buscar chave
      const key = await db.findOne("access_keys", {
        code: code.toUpperCase(),
        isActive: true,
      });

      if (!key) {
        throw new Error("Chave não encontrada ou inativa");
      }

      // Incrementar analytics
      await db.updateOne(
        "access_keys",
        { _id: key._id },
        { $inc: { "analytics.attemptCount": 1 } }
      );

      // Verificar restrições
      const validation = await this.validateKeyUsage(
        key,
        userId,
        workspaceId,
        userEmail
      );
      if (!validation.valid) {
        throw new Error(validation.reason);
      }

      // Verificar se já foi usada por este workspace
      if (!key.usage.allowMultiplePerWorkspace) {
        const existingActivation = key.activations.find(
          (a) => a.workspaceId === workspaceId && a.status === "active"
        );
        if (existingActivation) {
          throw new Error("Esta chave já foi usada neste workspace");
        }
      }

      // Verificar se já foi usada por este usuário
      if (!key.usage.allowMultiplePerUser) {
        const existingUserActivation = key.activations.find(
          (a) => a.userId === userId && a.status === "active"
        );
        if (existingUserActivation) {
          throw new Error("Você já usou esta chave");
        }
      }

      // Calcular data de expiração
      let expiresAt = null;
      if (key.grants.planDuration || key.grants.featureDuration) {
        const duration = key.grants.planDuration || key.grants.featureDuration;
        expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + duration);
      }

      // Criar ativação
      const activation = {
        userId,
        workspaceId,
        userEmail,
        activatedAt: new Date(),
        expiresAt,
        status: "active",
        ip: metadata.ip,
        userAgent: metadata.userAgent,
      };

      // Atualizar chave
      await db.updateOne(
        "access_keys",
        { _id: key._id },
        {
          $push: { activations: activation },
          $inc: {
            "usage.currentUses": 1,
            "analytics.successCount": 1,
          },
          $set: { updatedAt: new Date() },
        }
      );

      // Aplicar grants ao workspace
      await this.applyGrantsToWorkspace(key, workspaceId, userId, expiresAt);

      return {
        success: true,
        key: key,
        activation: activation,
        grants: key.grants,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Aplica os grants da chave ao workspace
   */
  static async applyGrantsToWorkspace(key, workspaceId, userId, expiresAt) {
    const activeKey = {
      keyId: key._id,
      code: key.code,
      type: key.type,
      activatedAt: new Date(),
      expiresAt: expiresAt,
      activatedBy: userId,
      grants: key.grants,
      status: "active",
    };

    // Adicionar chave ativa ao workspace
    await db.updateOne(
      "workspaces",
      { _id: workspaceId },
      { $push: { activeKeys: activeKey } }
    );

    // Se for chave de plano, atualizar planId
    if (key.type === "plan" && key.grants.planId) {
      await db.updateOne(
        "workspaces",
        { _id: workspaceId },
        {
          $set: {
            planId: key.grants.planId,
            planStatus: "active",
          },
        }
      );
    }

    // Se for feature, adicionar às purchasedFeatures
    if (key.type === "feature" && key.grants.featureIds) {
      const purchasedFeatures = key.grants.featureIds.map((featureId) => ({
        featureId,
        purchaseType: "access_key",
        amount: 0,
        currency: "BRL",
        purchasedAt: new Date(),
        activatedAt: new Date(),
        expiresAt: expiresAt,
        status: "active",
        // Marcar como ativada por chave
        accessKey: {
          keyId: key._id,
          code: key.code,
        },
      }));

      await db.updateOne(
        "workspaces",
        { _id: workspaceId },
        { $push: { purchasedFeatures: { $each: purchasedFeatures } } }
      );
    }
  }

  /**
   * Valida se uma chave pode ser usada
   */
  static async validateKeyUsage(key, userId, workspaceId, userEmail) {
    // Verificar se atingiu limite de usos
    if (key.usage.currentUses >= key.usage.maxUses) {
      return { valid: false, reason: "Chave atingiu limite máximo de usos" };
    }

    // Verificar período de validade
    const now = new Date();
    if (
      key.restrictions.validFrom &&
      now < new Date(key.restrictions.validFrom)
    ) {
      return { valid: false, reason: "Chave ainda não é válida" };
    }

    if (
      key.restrictions.validUntil &&
      now > new Date(key.restrictions.validUntil)
    ) {
      return { valid: false, reason: "Chave expirada" };
    }

    // Verificar emails permitidos
    if (key.restrictions.allowedEmails?.length > 0) {
      if (!key.restrictions.allowedEmails.includes(userEmail)) {
        return {
          valid: false,
          reason: "Seu email não tem permissão para usar esta chave",
        };
      }
    }

    // Verificar domínios permitidos
    if (key.restrictions.allowedDomains?.length > 0) {
      const emailDomain = userEmail.split("@")[1];
      if (!key.restrictions.allowedDomains.includes(emailDomain)) {
        return {
          valid: false,
          reason: "Seu domínio de email não tem permissão para usar esta chave",
        };
      }
    }

    return { valid: true };
  }

  /**
   * Verifica chaves ativas de um workspace
   */
  static async getActiveKeys(workspaceId) {
    const workspace = await db.findOne("workspaces", { _id: workspaceId });
    if (!workspace?.activeKeys) return [];

    // Filtrar chaves ainda ativas
    const now = new Date();
    return workspace.activeKeys.filter((key) => {
      if (key.status !== "active") return false;
      if (key.expiresAt && now > new Date(key.expiresAt)) {
        // Marcar como expirada
        this.expireKey(workspaceId, key.keyId);
        return false;
      }
      return true;
    });
  }

  /**
   * Expira uma chave em um workspace
   */
  static async expireKey(workspaceId, keyId) {
    await db.updateOne(
      "workspaces",
      {
        _id: workspaceId,
        "activeKeys.keyId": keyId,
      },
      {
        $set: {
          "activeKeys.$.status": "expired",
        },
      }
    );

    // Atualizar também na chave original
    await db.updateOne(
      "access_keys",
      {
        _id: keyId,
        "activations.workspaceId": workspaceId,
      },
      {
        $set: {
          "activations.$.status": "expired",
        },
      }
    );
  }

  /**
   * Revoga uma chave (remove acesso)
   */
  static async revokeKey(keyId, reason = "Revogada pelo administrador") {
    // Marcar chave como inativa
    await db.updateOne(
      "access_keys",
      { _id: keyId },
      {
        $set: {
          isActive: false,
          revokedAt: new Date(),
          revokeReason: reason,
        },
      }
    );

    // Marcar todas as ativações como revogadas
    await db.updateMany(
      "access_keys",
      {
        _id: keyId,
        "activations.status": "active",
      },
      {
        $set: {
          "activations.$.status": "revoked",
        },
      }
    );

    // Remover dos workspaces
    await db.updateMany(
      "workspaces",
      { "activeKeys.keyId": keyId },
      {
        $set: {
          "activeKeys.$.status": "revoked",
        },
      }
    );
  }

  /**
   * Gera código único para a chave
   */
  static generateKeyCode(type) {
    const prefix =
      {
        plan: "PLAN",
        feature: "FEAT",
        addon: "ADDON",
        custom: "CUST",
      }[type] || "KEY";

    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();

    return `${prefix}${year}-${random}`;
  }

  /**
   * Lista chaves com filtros
   */
  static async listKeys(filters = {}) {
    const query = {};

    if (filters.type) query.type = filters.type;
    if (filters.isActive !== undefined) query.isActive = filters.isActive;
    if (filters.createdBy) query.createdBy = filters.createdBy;
    if (filters.tags?.length > 0) query.tags = { $in: filters.tags };

    const keys = await db.find("access_keys", query).sort({ createdAt: -1 });

    return keys;
  }

  /**
   * Obter estatísticas de uma chave
   */
  static async getKeyStats(keyId) {
    const key = await db.findOne("access_keys", { _id: keyId });
    if (!key) return null;

    const activeActivations = key.activations.filter(
      (a) => a.status === "active"
    ).length;
    const expiredActivations = key.activations.filter(
      (a) => a.status === "expired"
    ).length;
    const revokedActivations = key.activations.filter(
      (a) => a.status === "revoked"
    ).length;

    return {
      key: key.name,
      code: key.code,
      type: key.type,
      totalActivations: key.activations.length,
      activeActivations,
      expiredActivations,
      revokedActivations,
      usageRate: (key.usage.currentUses / key.usage.maxUses) * 100,
      analytics: key.analytics,
      createdAt: key.createdAt,
    };
  }

  /**
   * Processa expiração automática de chaves
   * (Executar via cron job)
   */
  static async processExpiredKeys() {
    const now = new Date();

    // Buscar workspaces com chaves que podem ter expirado
    const workspaces = await db.find("workspaces", {
      "activeKeys.expiresAt": { $lt: now },
      "activeKeys.status": "active",
    });

    let processedCount = 0;

    for (const workspace of workspaces) {
      for (const activeKey of workspace.activeKeys) {
        if (
          activeKey.status === "active" &&
          activeKey.expiresAt &&
          new Date(activeKey.expiresAt) < now
        ) {
          await this.expireKey(workspace._id, activeKey.keyId);
          processedCount++;
        }
      }
    }

    return { processedCount };
  }
}

/**
 * Helper functions para integração com Access Engine
 */
export class AccessKeyHelpers {
  /**
   * Obter grants de chaves ativas para um workspace
   */
  static async getActiveGrants(workspaceId) {
    const activeKeys = await AccessKeys.getActiveKeys(workspaceId);

    const grants = {
      plans: [],
      features: [],
      customPermissions: [],
      limitBonuses: {},
    };

    for (const key of activeKeys) {
      if (key.type === "plan" && key.grants.planId) {
        grants.plans.push(key.grants.planId);
      }

      if (key.type === "feature" && key.grants.featureIds) {
        grants.features.push(...key.grants.featureIds);
      }

      if (key.grants.customPermissions) {
        grants.customPermissions.push(...key.grants.customPermissions);
      }

      if (key.grants.limitBonus) {
        for (const [limit, bonus] of Object.entries(key.grants.limitBonus)) {
          grants.limitBonuses[limit] =
            (grants.limitBonuses[limit] || 0) + bonus;
        }
      }
    }

    return grants;
  }

  /**
   * Verificar se workspace tem acesso via chave
   */
  static async hasKeyAccess(workspaceId, type, resourceId) {
    const grants = await this.getActiveGrants(workspaceId);

    switch (type) {
      case "plan":
        return grants.plans.includes(resourceId);

      case "feature":
        return grants.features.includes(resourceId);

      case "permission":
        return grants.customPermissions.includes(resourceId);

      default:
        return false;
    }
  }
}
