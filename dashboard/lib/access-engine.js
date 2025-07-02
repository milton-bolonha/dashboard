import { db } from "./db";
import { AccessKeyHelpers } from "./access-keys";

/**
 * Access Engine - Sistema central de controle de acesso
 *
 * Este é o cérebro do sistema de permissões, responsável por:
 * - Compilar permissões de planos, features e roles
 * - Verificar acesso a recursos
 * - Gerenciar limites e créditos
 * - Fornecer informações de upgrade
 */
export class AccessEngine {
  constructor(workspace, user) {
    this.workspace = workspace;
    this.user = user;
    this.member = workspace?.members?.find((m) => m.userId === user?.id);
    this.plan = null;
    this.features = [];
    this.accessRules = [];
    this._initialized = false;
  }

  /**
   * Inicializa o engine carregando dados necessários
   */
  async initialize() {
    if (this._initialized) return;

    // Carregar plano
    if (this.workspace?.planId) {
      this.plan = await db.findOne("plans", { _id: this.workspace.planId });
    }

    // Carregar features ativas
    if (this.workspace?.purchasedFeatures) {
      const activeFeatures = this.workspace.purchasedFeatures.filter(
        (f) => f.status === "active"
      );

      const featureIds = activeFeatures.map((f) => f.featureId);
      this.features = await db.find("features", {
        _id: { $in: featureIds },
        isActive: true,
      });
    }

    // Carregar regras de acesso customizadas
    this.accessRules = await db
      .find("access_rules", {
        isActive: true,
        $or: [{ resourceType: "global" }, { workspaceId: this.workspace?._id }],
      })
      .sort({ priority: -1 }); // Maior prioridade primeiro

    // Carregar grants de chaves de acesso ativas
    this.keyGrants = await AccessKeyHelpers.getActiveGrants(
      this.workspace?._id
    );

    this._initialized = true;
  }

  /**
   * Verifica se o usuário pode executar uma ação em um recurso
   */
  async can(action, resourceType, resource = null) {
    await this.initialize();

    // Super admin pode tudo
    if (this.user?.role === "superadmin") return true;

    // Verificar se é owner do workspace
    if (this.workspace?.ownerId === this.user?.id) return true;

    // Verificar permissões baseadas em role
    const rolePermission = await this.checkRolePermission(action, resourceType);
    if (!rolePermission) return false;

    // Verificar permissões baseadas em plano
    const planPermission = await this.checkPlanPermission(action, resourceType);
    if (!planPermission) return false;

    // Verificar permissões customizadas
    const customPermission = await this.checkCustomPermission(
      action,
      resourceType,
      resource
    );
    if (customPermission === false) return false;

    // Verificar limites
    const withinLimits = await this.checkLimits(action, resourceType);
    if (!withinLimits) return false;

    // Verificar propriedade (para ações .own)
    if (action.includes(".own") && resource) {
      return (
        resource.createdBy === this.user?.id ||
        resource.userId === this.user?.id
      );
    }

    return true;
  }

  /**
   * Verifica permissão baseada em role
   */
  async checkRolePermission(action, resourceType) {
    if (!this.member) return false;

    const permission = `${resourceType}.${action}`;

    // Matriz de permissões por role
    const roleMatrix = {
      // Workspace
      "workspace.view": [
        "owner",
        "admin",
        "editor",
        "author",
        "viewer",
        "guest",
      ],
      "workspace.edit": ["owner", "admin"],
      "workspace.delete": ["owner"],

      // Sections
      "sections.create": ["owner", "admin", "editor"],
      "sections.edit": ["owner", "admin", "editor"],
      "sections.delete": ["owner", "admin"],
      "sections.view": ["owner", "admin", "editor", "author", "viewer"],

      // Items
      "items.create": ["owner", "admin", "editor", "author"],
      "items.edit.any": ["owner", "admin", "editor"],
      "items.edit.own": ["author"],
      "items.delete.any": ["owner", "admin"],
      "items.delete.own": ["editor", "author"],
      "items.view": ["owner", "admin", "editor", "author", "viewer"],

      // Content Types
      "contentTypes.create": ["owner", "admin"],
      "contentTypes.edit": ["owner", "admin"],
      "contentTypes.delete": ["owner"],

      // Billing
      "billing.view": ["owner", "admin"],
      "billing.manage": ["owner"],

      // Members
      "members.invite": ["owner", "admin"],
      "members.remove": ["owner", "admin"],
      "members.changeRole": ["owner"],

      // Settings
      "settings.view": ["owner", "admin", "editor"],
      "settings.edit": ["owner", "admin"],

      // API
      "api.generateKey": ["owner", "admin"],
      "api.read": ["owner", "admin", "editor"],
      "api.write": ["owner", "admin"],
    };

    const allowedRoles = roleMatrix[permission];
    if (!allowedRoles) return true; // Se não está na matriz, permitir por padrão

    return allowedRoles.includes(this.member.role);
  }

  /**
   * Verifica permissão baseada em plano
   */
  async checkPlanPermission(action, resourceType) {
    // Verificar se tem acesso via chave
    if (
      this.keyGrants?.customPermissions?.includes(`${resourceType}.${action}`)
    ) {
      return true;
    }

    // Se workspace tem plano via chave, carregar esse plano
    if (this.keyGrants?.plans?.length > 0 && !this.plan) {
      // Buscar o plano com maior hierarquia das chaves ativas
      const keyPlans = await db.find("plans", {
        _id: { $in: this.keyGrants.plans },
        isActive: true,
      });

      if (keyPlans.length > 0) {
        // Usar o plano com maior hierarquia
        this.plan = keyPlans.sort(
          (a, b) => (b.hierarchy || 0) - (a.hierarchy || 0)
        )[0];
      }
    }

    if (!this.plan) return false;

    const permission = `${resourceType}.${action}`;

    // Verificar se o plano tem essa permissão
    const planPermission = this.plan.permissions?.find(
      (p) => p.resource === resourceType
    );

    if (planPermission && !planPermission.actions.includes(action)) {
      return false;
    }

    // Verificar features específicas
    const featureRequired = this.getRequiredFeature(permission);
    if (featureRequired) {
      return this.hasFeature(featureRequired);
    }

    return true;
  }

  /**
   * Verifica permissões customizadas
   */
  async checkCustomPermission(action, resourceType, resource) {
    // Verificar regras de acesso customizadas
    for (const rule of this.accessRules) {
      if (rule.resourceType !== resourceType) continue;

      // Se há um resourceId específico, verificar se corresponde
      if (rule.resourceId && resource?._id !== rule.resourceId) continue;

      // Verificar condições
      const conditionsMet = await this.evaluateAccessConditions(
        rule.conditions
      );
      if (!conditionsMet) continue;

      // Verificar permissão específica
      const permission = rule.permissions?.find((p) => p.action === action);
      if (permission) {
        return permission.allowed;
      }
    }

    return null; // Nenhuma regra customizada se aplica
  }

  /**
   * Verifica limites do plano/workspace
   */
  async checkLimits(action, resourceType) {
    if (action !== "create") return true;

    const limits = this.getEffectiveLimits();
    const usage = this.workspace?.usage || {};

    switch (resourceType) {
      case "sections":
        return !limits.sections || usage.sections < limits.sections;

      case "items":
        return !limits.maxItems || usage.items < limits.maxItems;

      case "contentTypes":
        return (
          !limits.maxContentTypes || usage.contentTypes < limits.maxContentTypes
        );

      case "members":
        const currentMembers = this.workspace?.members?.length || 0;
        return (
          !limits.workspaceMembers || currentMembers < limits.workspaceMembers
        );

      default:
        return true;
    }
  }

  /**
   * Obtém limites efetivos (plano + addons)
   */
  getEffectiveLimits() {
    let limits = { ...(this.plan?.limits || {}) };

    // Aplicar modificações de features/addons
    for (const feature of this.features) {
      if (feature.config?.limitModifiers) {
        for (const [key, modifier] of Object.entries(
          feature.config.limitModifiers
        )) {
          if (modifier.operation === "add") {
            limits[key] = (limits[key] || 0) + modifier.value;
          } else if (modifier.operation === "multiply") {
            limits[key] = (limits[key] || 0) * modifier.value;
          } else if (modifier.operation === "set") {
            limits[key] = modifier.value;
          }
        }
      }
    }

    // Aplicar limites customizados do workspace
    if (this.workspace?.limits?.customLimits) {
      limits = { ...limits, ...this.workspace.limits.customLimits };
    }

    // Aplicar bonus de chaves de acesso
    if (this.keyGrants?.limitBonuses) {
      for (const [key, bonus] of Object.entries(this.keyGrants.limitBonuses)) {
        if (limits[key] !== undefined) {
          limits[key] = (limits[key] || 0) + bonus;
        }
      }
    }

    return limits;
  }

  /**
   * Verifica se tem uma feature específica
   */
  hasFeature(featureSlug) {
    // Verificar se tem acesso via chave
    if (this.keyGrants?.features?.includes(featureSlug)) {
      return true;
    }

    // Verificar no plano
    if (
      this.plan?.features?.some((f) => f.featureId === featureSlug && f.enabled)
    ) {
      return true;
    }

    // Verificar nas features compradas
    return this.features.some((f) => f.slug === featureSlug);
  }

  /**
   * Avalia condições de acesso
   */
  async evaluateAccessConditions(conditions) {
    if (!conditions) return true;

    // Visibilidade
    switch (conditions.visibility) {
      case "public":
        return true;

      case "authenticated":
        return !!this.user;

      case "workspace_member":
        return !!this.member;

      case "custom":
        if (conditions.customRule) {
          return this.evaluateCustomRule(conditions.customRule);
        }
        break;
    }

    // Roles permitidos
    if (conditions.allowedRoles?.length > 0) {
      if (!this.member || !conditions.allowedRoles.includes(this.member.role)) {
        return false;
      }
    }

    // Planos permitidos
    if (conditions.allowedPlans?.length > 0) {
      if (!this.plan || !conditions.allowedPlans.includes(this.plan._id)) {
        return false;
      }
    }

    // Features requeridas
    if (conditions.requiredFeatures?.length > 0) {
      for (const feature of conditions.requiredFeatures) {
        if (!this.hasFeature(feature)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Avalia regra customizada (JavaScript expression)
   */
  evaluateCustomRule(rule) {
    try {
      // Criar contexto seguro para avaliação
      const context = {
        user: this.user,
        workspace: this.workspace,
        member: this.member,
        plan: this.plan,
        features: this.features,
      };

      // Avaliar expressão de forma segura
      // NOTA: Em produção, usar uma biblioteca como vm2 ou sandboxed execution
      const func = new Function(...Object.keys(context), `return ${rule}`);
      return func(...Object.values(context));
    } catch (error) {
      console.error("Erro ao avaliar regra customizada:", error);
      return false;
    }
  }

  /**
   * Obtém feature requerida para uma permissão
   */
  getRequiredFeature(permission) {
    const featureMap = {
      "export.pdf": "export_pdf",
      "export.xlsx": "export_excel",
      "analytics.view": "analytics",
      "api.write": "api_full_access",
      "sections.createPublic": "public_sections",
      // ... adicionar mais mapeamentos conforme necessário
    };

    return featureMap[permission];
  }

  /**
   * Verifica acesso a uma section específica
   */
  async canAccessSection(section, action = "view") {
    await this.initialize();

    // Verificar permissão base
    if (!(await this.can(action, "sections", section))) {
      return false;
    }

    // Verificar configurações de acesso da section
    if (!section.access) return true;

    const { visibility } = section.access;

    switch (visibility) {
      case "public":
        if (action === "view") return true;
        if (
          action === "create" &&
          section.access.publicSettings?.allowAnonymousCreate
        ) {
          return true;
        }
        break;

      case "authenticated":
        if (!this.user) return false;
        break;

      case "workspace_member":
        if (!this.member) return false;
        break;

      case "role_based":
        if (
          !this.member ||
          !section.access.allowedRoles?.includes(this.member.role)
        ) {
          return false;
        }
        break;

      case "plan_based":
        if (!this.plan) return false;

        // Verificar plano mínimo
        if (section.access.minimumPlan) {
          const minimumHierarchy = await this.getPlanHierarchy(
            section.access.minimumPlan
          );
          const currentHierarchy = this.plan.hierarchy || 0;
          if (currentHierarchy < minimumHierarchy) return false;
        }

        // Verificar planos específicos
        if (section.access.allowedPlans?.length > 0) {
          if (!section.access.allowedPlans.includes(this.plan._id)) {
            return false;
          }
        }
        break;

      case "custom":
        if (section.access.customRuleId) {
          const rule = await db.findOne("access_rules", {
            _id: section.access.customRuleId,
          });
          if (rule) {
            return this.evaluateAccessConditions(rule.conditions);
          }
        }
        break;
    }

    // Verificar monetização
    if (section.monetization?.isPaid && action !== "view") {
      // Verificar se o usuário comprou acesso à section
      // TODO: Implementar verificação de compra
      return false;
    }

    return true;
  }

  /**
   * Obtém hierarquia de um plano
   */
  async getPlanHierarchy(planId) {
    const plan = await db.findOne("plans", { _id: planId });
    return plan?.hierarchy || 0;
  }

  /**
   * Verifica e consome créditos
   */
  async consumeCredits(type, amount = 1) {
    const credits = await db.findOne("usage_credits", {
      workspaceId: this.workspace._id,
      type: type,
    });

    if (!credits) return false;

    const available =
      credits.credits.total + credits.credits.bonus - credits.credits.used;
    if (available < amount) return false;

    // Consumir créditos
    await db.updateOne(
      "usage_credits",
      { _id: credits._id },
      {
        $inc: { "credits.used": amount },
        $push: {
          usage: {
            date: new Date(),
            amount: amount,
            description: `Consumo automático - ${type}`,
            userId: this.user.id,
          },
        },
      }
    );

    return true;
  }

  /**
   * Obtém informações de upgrade para uma feature
   */
  async getUpgradeOptions(permission) {
    await this.initialize();

    const options = [];

    // Verificar planos que têm essa permissão
    const plans = await db.find("plans", {
      isActive: true,
      hierarchy: { $gt: this.plan?.hierarchy || 0 },
    });

    for (const plan of plans) {
      const hasPermission = plan.permissions?.some(
        (p) =>
          p.resource === permission.split(".")[0] &&
          p.actions.includes(permission.split(".")[1])
      );

      if (hasPermission) {
        options.push({
          type: "plan_upgrade",
          plan: plan,
          message: `Faça upgrade para ${plan.name} para acessar este recurso`,
        });
      }
    }

    // Verificar features/addons que liberam essa permissão
    const featureSlug = this.getRequiredFeature(permission);
    if (featureSlug) {
      const feature = await db.findOne("features", {
        slug: featureSlug,
        isActive: true,
      });

      if (feature && feature.accessType !== "included_in_plan") {
        options.push({
          type: "addon_purchase",
          feature: feature,
          message: `Compre o addon ${feature.name} para acessar este recurso`,
        });
      }
    }

    return options;
  }

  /**
   * Obtém mensagem de acesso negado
   */
  async getAccessDeniedMessage(action, resourceType, resource = null) {
    // Verificar se há mensagem customizada
    if (resource?.access?.deniedMessage) {
      return resource.access.deniedMessage;
    }

    // Mensagens padrão por tipo de negação
    const permission = `${resourceType}.${action}`;

    // Verificar limites
    if (action === "create") {
      const limits = this.getEffectiveLimits();
      const usage = this.workspace?.usage || {};

      switch (resourceType) {
        case "sections":
          if (limits.sections && usage.sections >= limits.sections) {
            return `Limite de ${limits.sections} seções atingido. Faça upgrade para criar mais.`;
          }
          break;

        case "items":
          if (limits.maxItems && usage.items >= limits.maxItems) {
            return `Limite de ${limits.maxItems} itens atingido.`;
          }
          break;
      }
    }

    // Verificar role
    if (!(await this.checkRolePermission(action, resourceType))) {
      return `Seu papel (${this.member?.role}) não tem permissão para ${action} ${resourceType}.`;
    }

    // Verificar plano
    if (!(await this.checkPlanPermission(action, resourceType))) {
      return `Esta ação requer um plano superior. Faça upgrade para continuar.`;
    }

    return "Acesso negado. Você não tem permissão para realizar esta ação.";
  }
}

/**
 * Factory function para criar AccessEngine
 */
export async function createAccessEngine(workspaceId, userId) {
  const workspace = await db.findOne("workspaces", { _id: workspaceId });
  const user = { id: userId }; // Expandir com dados do Clerk se necessário

  const engine = new AccessEngine(workspace, user);
  await engine.initialize();

  return engine;
}
