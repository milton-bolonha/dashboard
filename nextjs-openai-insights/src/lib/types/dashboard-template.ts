export interface DashboardTemplate {
  id: string;
  name: string;
  description: string;
  tiles: Array<{
    id: string;
    title: string;
    category: string;
  }>;
  createdAt: string;
  isDefault?: boolean;
  isCustom?: boolean;
  useMaxMode?: boolean;
  requestSize?: "small" | "medium" | "large";
}

export interface CustomTemplate extends DashboardTemplate {
  isCustom: true;
}

export interface TemplateConfig {
  templateId: string;
  useMaxMode: boolean;
  requestSize: "small" | "medium" | "large";
}

/**
 * Editable template tile with full prompt and per-tile configuration
 */
export interface EditableTemplateTile {
  id: string;
  title: string;
  prompt: string; // ✅ EDITÁVEL
  category: string;
  orderIndex: number;
  useMaxMode?: boolean; // ✅ EDITÁVEL por tile
  requestSize?: "small" | "medium" | "large"; // ✅ EDITÁVEL por tile
  agentId?: string; // ✅ NOVO: agente por tile
}

/**
 * Editable template that allows editing prompts and configurations
 */
export interface EditableTemplate {
  id: string;
  name: string;
  description: string;
  tiles: EditableTemplateTile[];
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean; // Templates padrão podem ser "duplicados"
  sourceTemplateId?: string; // Se foi duplicado de um padrão
  isCustom?: boolean;
}
