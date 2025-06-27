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
  name: "plans",
  fields: {
    name: { type: "string", required: true },
    description: { type: "string" },
    price: { type: "number", required: true },
    currency: { type: "string", default: "BRL" },
    interval: {
      type: "string",
      enum: ["monthly", "yearly", "lifetime"],
      default: "monthly",
    },
    limits: {
      maxSections: { type: "number", default: 5 },
      maxItems: { type: "number", default: 100 },
      maxAddons: { type: "number", default: 3 },
      maxUsers: { type: "number", default: 1 },
    },
    features: { type: "array", default: [] },
    isActive: { type: "boolean", default: true },
  },
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
          enum: ["textInput", "textarea", "imageUpload"],
          required: true,
        },
        required: { type: "boolean", default: false },
        config: { type: "object", default: {} },
      },
    },
    createdBy: { type: "objectId", ref: "users" },
    isActive: { type: "boolean", default: true },
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
    contentTypeId: { type: "objectId", ref: "contentTypes", required: true },
    userId: { type: "string", required: true }, // ← TRIANGULAÇÃO: Clerk User ID
    description: { type: "string" },
    settings: {
      defaultView: { type: "string", enum: ["list", "grid"], default: "list" },
      itemsPerPage: { type: "number", default: 20 },
      sortBy: { type: "string", default: "createdAt" },
      sortOrder: { type: "string", enum: ["asc", "desc"], default: "desc" },
    },
    createdBy: { type: "objectId", ref: "users" },
    isActive: { type: "boolean", default: true },
  },
  indexes: [
    // Índice composto para garantir slug único por usuário
    { fields: { userId: 1, slug: 1 }, unique: true },
  ],
};

export const ItemSchema = {
  name: "items",
  fields: {
    title: { type: "string", required: true },
    slug: { type: "string", required: true },
    sectionId: { type: "objectId", ref: "sections", required: true },
    userId: { type: "string", required: true }, // ← TRIANGULAÇÃO: Clerk User ID
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
