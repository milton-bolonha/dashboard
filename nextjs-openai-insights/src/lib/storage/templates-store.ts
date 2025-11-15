"use client";

import type { CustomTemplate, TemplateConfig, EditableTemplate } from "@/lib/types/dashboard-template";

const TEMPLATES_STORAGE_KEY = "insights_custom_templates";
const TEMPLATE_CONFIG_STORAGE_KEY = "insights_template_configs";
const EDITABLE_TEMPLATES_STORAGE_KEY = "insights_editable_templates";

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/**
 * Load custom templates from localStorage
 */
export function loadCustomTemplates(): CustomTemplate[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(TEMPLATES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CustomTemplate[]) : [];
  } catch {
    return [];
  }
}

/**
 * Save custom templates to localStorage
 */
export function saveCustomTemplates(templates: CustomTemplate[]) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Add or update a custom template
 */
export function saveCustomTemplate(template: CustomTemplate) {
  const templates = loadCustomTemplates();
  const existingIndex = templates.findIndex((t) => t.id === template.id);
  
  if (existingIndex >= 0) {
    templates[existingIndex] = template;
  } else {
    templates.push(template);
  }
  
  saveCustomTemplates(templates);
}

/**
 * Delete a custom template
 */
export function deleteCustomTemplate(templateId: string) {
  const templates = loadCustomTemplates();
  const filtered = templates.filter((t) => t.id !== templateId);
  saveCustomTemplates(filtered);
}

/**
 * Load template configurations (for default templates)
 */
export function loadTemplateConfigs(): TemplateConfig[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(TEMPLATE_CONFIG_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TemplateConfig[]) : [];
  } catch {
    return [];
  }
}

/**
 * Save template configuration (for default templates)
 */
export function saveTemplateConfig(config: TemplateConfig) {
  if (!isBrowser()) return;
  try {
    const configs = loadTemplateConfigs();
    const existingIndex = configs.findIndex((c) => c.templateId === config.templateId);
    
    if (existingIndex >= 0) {
      configs[existingIndex] = config;
    } else {
      configs.push(config);
    }
    
    localStorage.setItem(TEMPLATE_CONFIG_STORAGE_KEY, JSON.stringify(configs));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Get template configuration for a specific template
 */
export function getTemplateConfig(templateId: string): TemplateConfig | null {
  const configs = loadTemplateConfigs();
  return configs.find((c) => c.templateId === templateId) ?? null;
}

/**
 * Clear all custom templates and configurations
 */
export function clearAllTemplates() {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(TEMPLATES_STORAGE_KEY);
    localStorage.removeItem(TEMPLATE_CONFIG_STORAGE_KEY);
    localStorage.removeItem(EDITABLE_TEMPLATES_STORAGE_KEY);
  } catch {
    // Ignore errors
  }
}

/**
 * Load editable templates from localStorage
 */
export function loadEditableTemplates(): EditableTemplate[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(EDITABLE_TEMPLATES_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as EditableTemplate[]) : [];
  } catch {
    return [];
  }
}

/**
 * Save editable templates to localStorage
 */
export function saveEditableTemplates(templates: EditableTemplate[]) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(EDITABLE_TEMPLATES_STORAGE_KEY, JSON.stringify(templates));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Save or update an editable template
 */
export function saveEditableTemplate(template: EditableTemplate) {
  const templates = loadEditableTemplates();
  const existingIndex = templates.findIndex((t) => t.id === template.id);
  
  const updatedTemplate = {
    ...template,
    updatedAt: new Date().toISOString(),
  };
  
  if (existingIndex >= 0) {
    templates[existingIndex] = updatedTemplate;
  } else {
    templates.push(updatedTemplate);
  }
  
  saveEditableTemplates(templates);
}

/**
 * Get an editable template by ID
 */
export function getEditableTemplate(templateId: string): EditableTemplate | null {
  const templates = loadEditableTemplates();
  return templates.find((t) => t.id === templateId) ?? null;
}

/**
 * Delete an editable template
 */
export function deleteEditableTemplate(templateId: string) {
  const templates = loadEditableTemplates();
  const filtered = templates.filter((t) => t.id !== templateId);
  saveEditableTemplates(filtered);
}

