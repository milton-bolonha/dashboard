/**
 * Schemas do Dashboard Engine MVP
 * Objetos JavaScript simples para validação e estrutura
 */

export const UserSchema = {
  name: "users",
  fields: {
    name: { type: "string", required: true },
    email: { type: "string", required: true, unique: true },
    password: { type: "string", required: true }, // hash
    role: {
      type: "string",
      enum: ["superadmin", "owner", "admin", "editor", "viewer"],
      default: "viewer",
    },
    licenseId: { type: "objectId", ref: "licenses" },
    avatar: { type: "string" },
    isActive: { type: "boolean", default: true },
    lastLogin: { type: "date" },
  },
};

export const PlanSchema = {
  _id: { type: "string", default: () => new ObjectId().toString() },
  name: { type: "string", required: true }, // Ex: "Starter", "Business"
  slug: { type: "string", required: true, unique: true }, // Ex: "starter", "business"
  description: { type: "string" },
  stripePriceIds: {
    monthly: { type: "string" }, // ID do preço mensal no Stripe
    yearly: { type: "string" }, // ID do preço anual no Stripe
  },
  features: [
    {
      featureId: { type: "string", ref: "features" },
      enabled: { type: "boolean", default: true },
      limits: { type: "object" }, // Limites específicos para esta feature neste plano
    },
  ],
  limits: {
    workspaces: { type: "number", default: 1 },
    workspaceMembers: { type: "number", default: 5 },
    sections: { type: "number", default: 10 },
    itemsPerSection: { type: "number", default: 100 },
    storage: { type: "number", default: 1073741824 }, // 1GB em bytes
    apiCalls: { type: "number", default: 1000 },
    customLimits: { type: "object" }, // Limites customizados
  },
  permissions: [
    {
      resource: { type: "string" }, // Ex: "billing", "users", "sections"
      actions: [{ type: "string" }], // Ex: ["view", "create", "edit", "delete"]
    },
  ],
  hierarchy: { type: "number", default: 0 }, // 0 = free, 1 = starter, 2 = business, etc
  isActive: { type: "boolean", default: true },
  isDefault: { type: "boolean", default: false }, // Plano padrão para novos usuários
  metadata: { type: "object" }, // Dados extras customizados
  createdAt: { type: "date", default: Date.now },
  updatedAt: { type: "date", default: Date.now },
};

export const LicenseSchema = {
  name: "licenses",
  fields: {
    userId: { type: "objectId", ref: "users", required: true },
    planId: { type: "objectId", ref: "plans", required: true },
    status: {
      type: "string",
      enum: ["active", "inactive", "suspended", "expired"],
      default: "active",
    },
    startDate: { type: "date", required: true },
    endDate: { type: "date" },
    billingMethod: {
      type: "string",
      enum: ["manual", "stripe"],
      default: "manual",
    },
    stripeSubscriptionId: { type: "string" },
  },
};

export const ContentTypeSchema = {
  name: "contentTypes",
  fields: {
    name: { type: "string", required: true },
    slug: { type: "string", required: true },
    userId: { type: "string", required: true }, // ← TRIANGULAÇÃO: Clerk User ID
    workspaceId: { type: "objectId", ref: "workspaces", required: true }, // ← WORKSPACE
    description: { type: "string" },
    icon: { type: "string", default: "folder" },
    views: {
      type: "array",
      default: ["list", "grid"],
      items: { type: "string", enum: ["list", "grid"] },
    },
    addons: {
      type: "array",
      default: [],
      items: {
        id: { type: "string", required: true },
        name: { type: "string", required: true },
        type: {
          type: "string",
          enum: [
            "textInput",
            "textarea",
            "imageUpload",
            "cloudinaryUpload", // ← Upload único via Cloudinary
            "cloudinaryGallery", // ← NOVO: Galeria múltipla via Cloudinary
            "dateInput",
            "selectInput",
            "numberInput",
            "checkboxInput",
          ],
          required: true,
        },
        required: { type: "boolean", default: false },
        config: { type: "object", default: {} }, // Configurações específicas do addon
        placeholder: { type: "string" }, // ← NOVO: Placeholder customizado
        helpText: { type: "string" }, // ← NOVO: Texto de ajuda
        validation: {
          // ← NOVO: Validações customizadas
          minLength: { type: "number" },
          maxLength: { type: "number" },
          pattern: { type: "string" }, // regex
          required: { type: "boolean", default: false },
        },
      },
    },
    createdBy: { type: "objectId", ref: "users" },
    status: {
      type: "string",
      enum: ["published", "draft"],
      default: "draft",
    },
  },
  indexes: [
    // Índice composto para garantir slug único por usuário
    { fields: { userId: 1, slug: 1 }, unique: true },
  ],
};

export const SectionSchema = {
  name: "sections",
  fields: {
    name: { type: "string", required: true },
    slug: { type: "string", required: true },
    description: { type: "string" },
    strategy: {
      type: "string",
      enum: ["collection", "singleton", "grouping"],
      default: "collection",
    },
    // Controle de exposição pública de itens desta Section
    exposureMode: {
      type: "string",
      enum: ["all", "single"],
      default: "all",
    },
    exposureSelection: {
      type: "string",
      enum: ["random", "latest"],
      default: "random",
    },
    contentTypeId: { type: "string", ref: "content_types" },
    userId: { type: "string", required: true },
    workspaceId: { type: "objectId", ref: "workspaces", required: true },
    settings: { type: "object" },
    publicAccess: { type: "object" },
    icon: { type: "string", default: "folder" },
    order: { type: "number", default: 0 },
    status: {
      type: "string",
      enum: ["published", "draft"],
      default: "draft",
    },
  },
};

export const ItemSchema = {
  name: "items",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    sectionId: { type: "objectId", ref: "sections", required: true },
    userId: { type: "string", required: true }, // ← TRIANGULAÇÃO: Clerk User ID
    workspaceId: { type: "objectId", ref: "workspaces", required: true }, // ← WORKSPACE
    data: { type: "object", default: {} }, // dados dos addons
    status: {
      type: "string",
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    createdBy: { type: "objectId", ref: "users" },
    publishedAt: { type: "date" },
  },
  indexes: [
    // Índice composto para garantir slug único por usuário e section
    { fields: { userId: 1, sectionId: 1, slug: 1 }, unique: true },
  ],
};

export const WorkspaceSchema = {
  name: "workspaces",
  fields: {
    name: { type: "string", required: true },
    slug: { type: "string", required: true },
    ownerId: { type: "string", required: true }, // Clerk User ID
    description: { type: "string" },

    // Billing & Plans - Dinâmico
    planId: { type: "string", ref: "plans" }, // Referência ao plano no MongoDB
    planStatus: {
      type: "string",
      enum: ["active", "canceled", "past_due", "trialing"],
      default: "active",
    },

    // IDs do Stripe para rastreamento completo
    stripe: {
      customerId: { type: "string" }, // cus_xxx
      subscriptionId: { type: "string" }, // sub_xxx
      priceId: { type: "string" }, // price_xxx (do plano atual)
      productId: { type: "string" }, // prod_xxx
      paymentMethodId: { type: "string" }, // pm_xxx

      // Status da última sincronização
      lastSync: { type: "date" },
      syncStatus: {
        type: "string",
        enum: ["synced", "pending", "error"],
        default: "pending",
      },
      syncError: { type: "string" },

      // Metadata adicional
      subscriptionItems: [
        {
          // Para tracking de múltiplos items
          id: { type: "string" }, // si_xxx
          priceId: { type: "string" }, // price_xxx
          quantity: { type: "number", default: 1 },
        },
      ],

      // Histórico de invoices
      lastInvoiceId: { type: "string" }, // in_xxx
      lastPaymentIntentId: { type: "string" }, // pi_xxx
      lastChargeId: { type: "string" }, // ch_xxx
    },

    // Retrocompatibilidade (deprecated - usar stripe.customerId e stripe.subscriptionId)
    stripeCustomerId: { type: "string" },
    stripeSubscriptionId: { type: "string" },

    trialEndsAt: { type: "date" },

    // Features compradas separadamente
    purchasedFeatures: [
      {
        featureId: { type: "string", ref: "features" },

        // IDs do Stripe para rastreamento
        stripe: {
          priceId: { type: "string" }, // price_xxx
          productId: { type: "string" }, // prod_xxx
          subscriptionId: { type: "string" }, // sub_xxx (se recorrente)
          subscriptionItemId: { type: "string" }, // si_xxx
          paymentIntentId: { type: "string" }, // pi_xxx (se one-time)
          invoiceId: { type: "string" }, // in_xxx
          checkoutSessionId: { type: "string" }, // cs_xxx
        },

        // Detalhes da compra
        purchaseType: {
          type: "string",
          enum: ["one_time", "subscription", "usage_based"],
          default: "one_time",
        },
        amount: { type: "number" }, // Valor pago
        currency: { type: "string", default: "BRL" },

        // Datas
        purchasedAt: { type: "date", default: () => new Date() },
        activatedAt: { type: "date" },
        expiresAt: { type: "date" }, // Para features com tempo limitado
        canceledAt: { type: "date" },

        // Status
        status: {
          type: "string",
          enum: ["active", "expired", "canceled", "pending"],
          default: "active",
        },

        // Para compatibilidade (deprecated)
        stripePriceId: { type: "string" },
        stripeSubscriptionId: { type: "string" },
      },
    ],

    // Limites dinâmicos (calculados baseado no plano + addons)
    limits: {
      maxUsers: { type: "number", default: 1 },
      maxContentTypes: { type: "number", default: 3 },
      maxSections: { type: "number", default: 5 },
      maxItems: { type: "number", default: 100 },
      maxAPICallsPerMonth: { type: "number", default: 1000 },
      storage: { type: "number", default: 1073741824 }, // 1GB em bytes
      customLimits: { type: "object" },
    },

    // Membros com roles expandidos
    members: [
      {
        userId: { type: "string", required: true },
        role: {
          type: "string",
          enum: ["owner", "admin", "editor", "author", "viewer", "guest"],
          default: "viewer",
        },
        permissions: { type: "object" }, // Permissões customizadas por usuário
        invitedAt: { type: "date", default: () => new Date() },
        joinedAt: { type: "date" },
        invitedBy: { type: "string" },
        lastActiveAt: { type: "date" },
      },
    ],

    // Permissões customizadas do workspace
    customPermissions: [
      {
        userId: { type: "string" },
        resource: { type: "string" },
        permissions: [{ type: "string" }],
        grantedBy: { type: "string" },
        grantedAt: { type: "date" },
      },
    ],

    // Uso atual
    usage: {
      sections: { type: "number", default: 0 },
      items: { type: "number", default: 0 },
      storage: { type: "number", default: 0 }, // em bytes
      apiCalls: { type: "number", default: 0 },
      customMetrics: { type: "object" },
    },

    // Chaves de acesso ativas
    activeKeys: [
      {
        keyId: { type: "string", ref: "access_keys" },
        code: { type: "string" },
        type: { type: "string" }, // plan, feature, addon, custom
        activatedAt: { type: "date" },
        expiresAt: { type: "date" },
        activatedBy: { type: "string" }, // userId que ativou
        grants: { type: "object" }, // Cache dos grants da chave
        status: {
          type: "string",
          enum: ["active", "expired", "revoked"],
          default: "active",
        },
      },
    ],

    security: {
      apiKeyEnabled: { type: "boolean", default: false },
      allowedIPs: [{ type: "string" }],
      defaultVisibility: { type: "string", default: "workspace_member" },
      allowPublicSections: { type: "boolean", default: false },
    },

    isActive: { type: "boolean", default: true },
    createdAt: { type: "date", default: () => new Date() },
    lastActivity: { type: "date", default: () => new Date() },
  },

  indexes: [
    { fields: { slug: 1 }, unique: true },
    { fields: { ownerId: 1 } },
    { fields: { "members.userId": 1 } },
    { fields: { planId: 1, isActive: 1 } },
    { fields: { stripeCustomerId: 1 } },
  ],
};

export const BillingSchema = {
  name: "billing",
  fields: {
    userId: { type: "objectId", ref: "users", required: true },
    planId: { type: "objectId", ref: "plans", required: true },
    amount: { type: "number", required: true },
    currency: { type: "string", default: "BRL" },
    method: { type: "string", enum: ["manual", "stripe"], default: "manual" },
    status: {
      type: "string",
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    paidAt: { type: "date" },
    notes: { type: "string" },
    stripePaymentIntentId: { type: "string" },
  },
};

// Schema para Features/Addons
export const FeatureSchema = {
  _id: { type: "string", default: () => new ObjectId().toString() },
  name: { type: "string", required: true },
  slug: { type: "string", required: true, unique: true },
  description: { type: "string" },
  type: {
    type: "string",
    enum: ["core", "addon", "credits", "integration", "view", "field"],
    required: true,
  },
  category: { type: "string" }, // Para agrupar features na UI

  // Configuração de acesso
  accessType: {
    type: "string",
    enum: ["included_in_plan", "purchasable", "both"],
    default: "included_in_plan",
  },

  // Se for comprável separadamente
  pricing: {
    stripePriceId: { type: "string" }, // Para addons pagos
    type: { type: "string", enum: ["one_time", "recurring", "usage_based"] },
    usageCredits: { type: "number" }, // Créditos consumidos por uso
  },

  // Requisitos
  requirements: {
    minimumPlan: { type: "string" }, // Plano mínimo necessário
    requiredFeatures: [{ type: "string" }], // Outras features necessárias
  },

  // Configurações específicas
  config: { type: "object" }, // Configurações específicas da feature

  isActive: { type: "boolean", default: true },
  createdAt: { type: "date", default: Date.now },
  updatedAt: { type: "date", default: Date.now },
};

// Schema para Regras de Acesso Customizadas
export const AccessRuleSchema = {
  _id: { type: "string", default: () => new ObjectId().toString() },
  name: { type: "string", required: true },
  description: { type: "string" },

  // Tipo de recurso que a regra se aplica
  resourceType: {
    type: "string",
    enum: ["route", "section", "field", "action", "api_endpoint"],
    required: true,
  },
  resourceId: { type: "string" }, // ID específico ou padrão (ex: "/dashboard/users/*")

  // Condições de acesso
  conditions: {
    visibility: {
      type: "string",
      enum: ["public", "authenticated", "workspace_member", "custom"],
      default: "workspace_member",
    },

    // Se workspace_member, quais roles têm acesso
    allowedRoles: [
      {
        type: "string",
        enum: ["owner", "admin", "editor", "author", "viewer", "guest"],
      },
    ],

    // Planos que têm acesso
    allowedPlans: [{ type: "string" }], // IDs dos planos

    // Features necessárias
    requiredFeatures: [{ type: "string" }], // IDs das features

    // Regras customizadas (JavaScript expression como string)
    customRule: { type: "string" }, // Ex: "user.metadata.beta === true"
  },

  // Ações permitidas
  permissions: [
    {
      action: { type: "string" }, // view, create, edit, delete, export, etc
      allowed: { type: "boolean", default: true },
    },
  ],

  // Mensagens customizadas
  messages: {
    denied: { type: "string" },
    upgradePrompt: { type: "string" },
    upgradeUrl: { type: "string" },
  },

  // Prioridade (regras com maior prioridade sobrescrevem as menores)
  priority: { type: "number", default: 0 },

  isActive: { type: "boolean", default: true },
  createdBy: { type: "string" },
  createdAt: { type: "date", default: Date.now },
  updatedAt: { type: "date", default: Date.now },
};

// Schema para controle de créditos/uso
export const UsageCreditsSchema = {
  _id: { type: "string", default: () => new ObjectId().toString() },
  workspaceId: { type: "string", required: true },
  type: { type: "string", required: true }, // Ex: "ai_generation", "pdf_export"

  credits: {
    total: { type: "number", default: 0 }, // Total de créditos disponíveis
    used: { type: "number", default: 0 }, // Créditos usados
    bonus: { type: "number", default: 0 }, // Créditos bonus (promoções)
  },

  // Histórico de recargas
  purchases: [
    {
      date: { type: "date" },
      amount: { type: "number" },
      stripePriceId: { type: "string" },
      stripePaymentIntentId: { type: "string" },
    },
  ],

  // Histórico de uso
  usage: [
    {
      date: { type: "date" },
      amount: { type: "number" },
      description: { type: "string" },
      metadata: { type: "object" },
    },
  ],

  expiresAt: { type: "date" }, // Créditos podem expirar
  createdAt: { type: "date", default: Date.now },
  updatedAt: { type: "date", default: Date.now },
};

// Schema para Sistema de Chaves/Cupons
export const AccessKeySchema = {
  _id: { type: "string", default: () => new ObjectId().toString() },

  // Identificador da chave
  code: { type: "string", required: true, unique: true }, // Ex: "BETA2024-ABC123"
  name: { type: "string", required: true }, // Ex: "Beta Tester - Plan Business"
  description: { type: "string" },

  // Tipo de acesso que a chave libera
  type: {
    type: "string",
    enum: ["plan", "feature", "addon", "custom"],
    required: true,
  },

  // Configuração específica por tipo
  grants: {
    // Se type = "plan"
    planId: { type: "string", ref: "plans" },
    planDuration: { type: "number" }, // Dias de acesso (null = permanente)

    // Se type = "feature" ou "addon"
    featureIds: [{ type: "string", ref: "features" }],
    featureDuration: { type: "number" }, // Dias de acesso

    // Se type = "custom"
    customPermissions: [{ type: "string" }], // Lista de permissões customizadas
    customLimits: { type: "object" }, // Limites customizados

    // Modificadores especiais
    limitBonus: { type: "object" }, // Bonus nos limites (ex: +10 sections)
  },

  // Configurações de uso
  usage: {
    maxUses: { type: "number", default: 1 }, // Quantas vezes pode ser usada
    currentUses: { type: "number", default: 0 }, // Quantas vezes foi usada
    allowMultiplePerUser: { type: "boolean", default: false }, // Mesmo usuário pode usar várias vezes
    allowMultiplePerWorkspace: { type: "boolean", default: false }, // Mesmo workspace pode usar várias vezes
  },

  // Restrições
  restrictions: {
    validFrom: { type: "date" }, // Válida a partir de
    validUntil: { type: "date" }, // Válida até
    allowedEmails: [{ type: "string" }], // Emails específicos que podem usar
    allowedDomains: [{ type: "string" }], // Domínios específicos (ex: @empresa.com)
    requiredMetadata: { type: "object" }, // Metadata que o usuário deve ter
  },

  // Histórico de ativações
  activations: [
    {
      userId: { type: "string", required: true },
      workspaceId: { type: "string", required: true },
      userEmail: { type: "string" },
      activatedAt: { type: "date", default: Date.now },
      expiresAt: { type: "date" }, // Quando expira para este usuário
      status: {
        type: "string",
        enum: ["active", "expired", "revoked"],
        default: "active",
      },
      ip: { type: "string" },
      userAgent: { type: "string" },
    },
  ],

  // Configurações
  isActive: { type: "boolean", default: true },
  isPublic: { type: "boolean", default: false }, // Pode ser usada por qualquer pessoa
  autoExpire: { type: "boolean", default: true }, // Expira automaticamente

  // Metadata
  tags: [{ type: "string" }], // Para organização (ex: ["beta", "promocional"])
  createdBy: { type: "string", required: true },
  createdAt: { type: "date", default: Date.now },
  updatedAt: { type: "date", default: Date.now },

  // Analytics
  analytics: {
    viewCount: { type: "number", default: 0 }, // Quantas vezes foi vista
    attemptCount: { type: "number", default: 0 }, // Tentativas de uso
    successCount: { type: "number", default: 0 }, // Usos bem-sucedidos
  },
};

/**
 * Validação simples de schema
 * @param {object} data
 * @param {object} schema
 * @returns {object} { isValid: boolean, errors: array }
 */
export function validateSchema(data, schema) {
  const errors = [];

  for (const [fieldName, fieldConfig] of Object.entries(schema.fields)) {
    const value = data[fieldName];

    // Required validation
    if (
      fieldConfig.required &&
      (value === undefined || value === null || value === "")
    ) {
      errors.push(`${fieldName} é obrigatório`);
      continue;
    }

    // Type validation
    if (value !== undefined && value !== null) {
      if (fieldConfig.type === "string" && typeof value !== "string") {
        errors.push(`${fieldName} deve ser uma string`);
      }
      // Adicionada validação para ObjectId
      if (
        fieldConfig.type === "objectId" &&
        (typeof value !== "object" ||
          !value.constructor.name.includes("ObjectId"))
      ) {
        errors.push(`${fieldName} deve ser um ObjectId válido`);
      }
      if (fieldConfig.type === "number" && typeof value !== "number") {
        errors.push(`${fieldName} deve ser um número`);
      }
      if (fieldConfig.type === "boolean" && typeof value !== "boolean") {
        errors.push(`${fieldName} deve ser um boolean`);
      }
    }

    // Enum validation
    if (fieldConfig.enum && value && !fieldConfig.enum.includes(value)) {
      errors.push(
        `${fieldName} deve ser um dos valores: ${fieldConfig.enum.join(", ")}`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
