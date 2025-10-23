/**
 * Dashboard Templates Schema
 * Sistema de templates para organizações de tiles
 */

export const DashboardTemplateSchema = {
  name: "dashboard_templates",
  fields: {
    id: { type: "string", required: true },
    name: { type: "string", required: true },
    description: { type: "string" },
    isDefault: { type: "boolean", default: false },
    isCustom: { type: "boolean", default: true },
    tiles: [
      {
        id: { type: "string", required: true },
        title: { type: "string", required: true },
        prompt: { type: "string", required: true },
        category: { type: "string", required: true },
        order: { type: "number", required: true },
        defaultSize: {
          w: { type: "number", default: 4 },
          h: { type: "number", default: 2 },
        },
        isCustom: { type: "boolean", default: false },
      },
    ],
    createdAt: { type: "date", required: true },
    updatedAt: { type: "date", required: true },
    createdBy: { type: "string", required: true }, // guest_id ou user_id
  },
  indexes: [
    { fields: { createdBy: 1, name: 1 }, unique: true },
    { fields: { isDefault: 1 } },
    { fields: { isCustom: 1 } },
  ],
};

/**
 * Função para criar template padrão
 */
export function createDefaultTemplate(templateId, name, description, tiles) {
  return {
    id: templateId,
    name,
    description,
    isDefault: true,
    isCustom: false,
    tiles,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: "system",
  };
}

/**
 * Função para criar template customizado
 */
export function createCustomTemplate(name, description, tiles, createdBy) {
  return {
    id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    name,
    description,
    isDefault: false,
    isCustom: true,
    tiles,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy,
  };
}
