"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Edit3, Copy, Zap } from "lucide-react";

import type { AdeAppearanceTokens } from "@/lib/ade-theme";
import { GUEST_DASHBOARD_TEMPLATES } from "@/lib/guest-templates";
import {
  loadCustomTemplates,
  saveCustomTemplate,
  deleteCustomTemplate,
  loadTemplateConfigs,
  saveTemplateConfig,
  loadEditableTemplates,
  deleteEditableTemplate,
} from "@/lib/storage/templates-store";
import type { DashboardTemplate, CustomTemplate, EditableTemplate } from "@/lib/types/dashboard-template";
import { TemplateEditorModal } from "./TemplateEditorModal";

interface DashboardConfigModalProps {
  open: boolean;
  onClose: () => void;
  appearance: AdeAppearanceTokens;
  currentTemplate?: DashboardTemplate;
}

function generateId(): string {
  return `template-${Math.random().toString(36).substr(2, 9)}`;
}

// Convert GUEST_DASHBOARD_TEMPLATES to DashboardTemplate format
function convertGuestTemplateToDashboardTemplate(templateId: string, template: typeof GUEST_DASHBOARD_TEMPLATES.template_1): DashboardTemplate {
  return {
    id: templateId,
    name: template.name,
    description: template.description,
    tiles: template.tiles.map(t => ({ id: t.id, title: t.title, category: t.category })),
    createdAt: "2024-01-01",
    isDefault: true,
    useMaxMode: template.defaults?.useMaxMode ?? false,
    requestSize: template.defaults?.requestSize ?? "small",
  };
}

export function DashboardConfigModal({
  open,
  onClose,
  appearance,
  currentTemplate,
}: DashboardConfigModalProps) {
  // Load templates: default templates + custom templates + apply saved configs
  const [templates, setTemplates] = useState<DashboardTemplate[]>(() => {
    const defaultTemplates = Object.entries(GUEST_DASHBOARD_TEMPLATES).map(([id, template]) =>
      convertGuestTemplateToDashboardTemplate(id, template)
    );
    
    // Load custom templates
    const customTemplates = loadCustomTemplates();
    
    // Load template configs and apply to default templates
    const configs = loadTemplateConfigs();
    const templatesWithConfigs = defaultTemplates.map(t => {
      const config = configs.find(c => c.templateId === t.id);
      if (config) {
        return { ...t, useMaxMode: config.useMaxMode, requestSize: config.requestSize };
      }
      return t;
    });
    
    return [...templatesWithConfigs, ...customTemplates];
  });
  
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingEditableTemplateId, setEditingEditableTemplateId] = useState<string | null>(null);
  const [duplicatingTemplateId, setDuplicatingTemplateId] = useState<string | null>(null);
  const [editableTemplates, setEditableTemplates] = useState<EditableTemplate[]>([]);

  // Reload templates when modal opens
  useEffect(() => {
    if (open) {
      const defaultTemplates = Object.entries(GUEST_DASHBOARD_TEMPLATES).map(([id, template]) =>
        convertGuestTemplateToDashboardTemplate(id, template)
      );
      const customTemplates = loadCustomTemplates();
      const editableTemplatesList = loadEditableTemplates();
      const configs = loadTemplateConfigs();
      const templatesWithConfigs = defaultTemplates.map(t => {
        const config = configs.find(c => c.templateId === t.id);
        if (config) {
          return { ...t, useMaxMode: config.useMaxMode, requestSize: config.requestSize };
        }
        return t;
      });
      // Use requestAnimationFrame to avoid synchronous setState in effect
      requestAnimationFrame(() => {
        setTemplates([...templatesWithConfigs, ...customTemplates]);
        setEditableTemplates(editableTemplatesList);
      });
    }
  }, [open]);

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) return;

    const newTemplate: CustomTemplate = {
      id: generateId(),
      name: newTemplateName.trim(),
      description: newTemplateDescription.trim() || "Custom dashboard template",
      tiles: currentTemplate?.tiles || [],
      createdAt: new Date().toISOString(),
      isCustom: true,
      isDefault: false,
    };

    // Save to localStorage
    saveCustomTemplate(newTemplate);
    
    // Update state
    setTemplates(prev => [...prev, newTemplate]);
    setNewTemplateName("");
    setNewTemplateDescription("");
  };

  const handleDeleteTemplate = (templateId: string) => {
    // Only delete custom templates (default templates cannot be deleted)
    const template = templates.find(t => t.id === templateId);
    if (template && !template.isDefault && (template as CustomTemplate).isCustom) {
      deleteCustomTemplate(templateId);
    }
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const handleDuplicateTemplate = (template: DashboardTemplate) => {
    const duplicated: CustomTemplate = {
      ...template,
      id: generateId(),
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      isDefault: false,
      isCustom: true,
    };
    
    // Save to localStorage
    saveCustomTemplate(duplicated);
    
    // Update state
    setTemplates(prev => [...prev, duplicated]);
  };

  const handleUpdateTemplateConfig = (templateId: string, updates: { useMaxMode?: boolean; requestSize?: "small" | "medium" | "large" }) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    // Update state
    setTemplates(prev => prev.map(t => 
      t.id === templateId ? { ...t, ...updates } : t
    ));
    
    // Persist configuration
    if (template.isDefault) {
      // For default templates, save config separately
      saveTemplateConfig({
        templateId,
        useMaxMode: updates.useMaxMode ?? template.useMaxMode ?? false,
        requestSize: updates.requestSize ?? template.requestSize ?? "small",
      });
    } else if ((template as CustomTemplate).isCustom) {
      // For custom templates, update the template itself
      const updated: CustomTemplate = {
        ...(template as CustomTemplate),
        useMaxMode: updates.useMaxMode ?? template.useMaxMode ?? false,
        requestSize: updates.requestSize ?? template.requestSize ?? "small",
      };
      saveCustomTemplate(updated);
    }
    
    console.log(`[DashboardConfigModal] ✅ Template ${templateId} configuration saved:`, updates);
  };

  const handleEditTemplate = (templateId: string) => {
    setEditingTemplateId(editingTemplateId === templateId ? null : templateId);
  };

  const handleEditEditableTemplate = (templateId: string) => {
    setEditingEditableTemplateId(templateId);
  };

  const handleDuplicateDefaultTemplate = (templateId: string) => {
    setDuplicatingTemplateId(templateId);
  };

  const handleSaveEditableTemplate = (_template: EditableTemplate) => {
    // Reload editable templates
    setEditableTemplates(loadEditableTemplates());
    setEditingEditableTemplateId(null);
    setDuplicatingTemplateId(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-4xl max-h-[80vh] overflow-hidden rounded-[28px] border border-[#e4e4e4] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.2)]" onClick={(event) => event.stopPropagation()}>
        <header className="flex items-start justify-between gap-4 px-8 py-6 border-b border-gray-100">
          <div className="space-y-2">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#9a9a9a]">Dashboard Configuration</p>
            <h2 className="text-2xl font-semibold text-[#1f1f1f]">Manage Templates</h2>
            <p className="text-sm text-[#6f6f6f]">
              Create, customize, and organize your dashboard templates for different research scenarios.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4e4e4] text-[#444] transition hover:bg-[#f5f5f5]"
            aria-label="Close dashboard config"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex flex-col max-h-[60vh]">
          {/* Two Column Layout: Create and List */}
          <div className="grid grid-cols-2 gap-6 px-8 py-6">
            {/* Create New Template Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[#1f1f1f]">Create New Template</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Template name"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full rounded-lg border border-[#e4e4e4] bg-white px-3 py-2 text-sm text-[#1f1f1f] placeholder:text-[#a1a1a1] focus:border-black focus:outline-none focus:ring-0"
                />
                <input
                  type="text"
                  placeholder="Description (optional)"
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                  className="w-full rounded-lg border border-[#e4e4e4] bg-white px-3 py-2 text-sm text-[#1f1f1f] placeholder:text-[#a1a1a1] focus:border-black focus:outline-none focus:ring-0"
                />
                <button
                  type="button"
                  onClick={handleCreateTemplate}
                  disabled={!newTemplateName.trim()}
                  className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  <Plus className="h-4 w-4" />
                  Create Template
                </button>
              </div>
            </div>

            {/* Templates List */}
            <div className="overflow-y-auto max-h-[50vh]">
              <h3 className="text-lg font-semibold mb-4 text-[#1f1f1f]">Your Templates</h3>
              <div className="space-y-3">
                {/* Editable Templates */}
                {editableTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-lg border border-[#e4e4e4] bg-white p-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-[#1f1f1f] truncate">{template.name}</h4>
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 flex-shrink-0">
                            Editable
                          </span>
                        </div>
                        <p className="text-xs text-[#6f6f6f] mb-1 line-clamp-1">{template.description}</p>
                        <p className="text-xs text-[#9a9a9a]">
                          {template.tiles.length} tiles • {new Date(template.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleEditEditableTemplate(template.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e4e4e4] text-[#444] transition hover:bg-blue-50 hover:border-blue-200"
                          title="Edit template"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            deleteEditableTemplate(template.id);
                            setEditableTemplates(loadEditableTemplates());
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e4e4e4] text-[#444] transition hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                          title="Delete template"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {template.tiles.slice(0, 4).map((tile) => (
                        <span
                          key={tile.id}
                          className="inline-block px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-700"
                        >
                          {tile.title}
                        </span>
                      ))}
                      {template.tiles.length > 4 && (
                        <span className="inline-block px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-700">
                          +{template.tiles.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                
                {/* Default and Custom Templates */}
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-lg border border-[#e4e4e4] bg-white p-3"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-sm text-[#1f1f1f] truncate">{template.name}</h4>
                          {template.isDefault && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 flex-shrink-0">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6f6f6f] mb-1 line-clamp-1">{template.description}</p>
                        <p className="text-xs text-[#9a9a9a]">
                          {template.tiles.length} tiles • {new Date(template.createdAt).toLocaleDateString()}
                        </p>
                        {/* Template Configuration */}
                        {editingTemplateId === template.id && (
                          <div className="mt-3 space-y-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-[#1f1f1f]">Max Mode</label>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={template.useMaxMode ?? false}
                                  onChange={(e) => handleUpdateTemplateConfig(template.id, { useMaxMode: e.target.checked })}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
                              </label>
                            </div>
                            <div className="flex items-center justify-between">
                              <label className="text-xs font-medium text-[#1f1f1f]">Request Size</label>
                              <select
                                value={template.requestSize ?? "small"}
                                onChange={(e) => handleUpdateTemplateConfig(template.id, { requestSize: e.target.value as "small" | "medium" | "large" })}
                                className="text-xs border border-[#e4e4e4] rounded px-2 py-1 bg-white"
                              >
                                <option value="small">Small</option>
                                <option value="medium">Medium</option>
                                <option value="large">Large</option>
                              </select>
                            </div>
                            {template.useMaxMode && (
                              <div className="flex items-center gap-1 text-xs text-amber-600">
                                <Zap className="h-3 w-3" />
                                <span>Using GPT-5 (Max Mode)</span>
                              </div>
                            )}
                            {!template.useMaxMode && (
                              <div className="text-xs text-[#6f6f6f]">
                                Using GPT-5-nano (default)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        {template.isDefault ? (
                          <>
                            <button
                              type="button"
                              onClick={() => handleDuplicateDefaultTemplate(template.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e4e4e4] text-[#444] transition hover:bg-[#f5f5f5]"
                              title="Duplicate and edit template"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditTemplate(template.id)}
                              className={`flex h-7 w-7 items-center justify-center rounded-lg border border-[#e4e4e4] text-[#444] transition hover:bg-[#f5f5f5] ${editingTemplateId === template.id ? "bg-blue-50 border-blue-200" : ""}`}
                              title="Edit template settings"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => handleEditTemplate(template.id)}
                              className={`flex h-7 w-7 items-center justify-center rounded-lg border border-[#e4e4e4] text-[#444] transition hover:bg-[#f5f5f5] ${editingTemplateId === template.id ? "bg-blue-50 border-blue-200" : ""}`}
                              title="Edit template settings"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateTemplate(template)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e4e4e4] text-[#444] transition hover:bg-[#f5f5f5]"
                              title="Duplicate template"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTemplate(template.id)}
                              className="flex h-7 w-7 items-center justify-center rounded-lg border border-[#e4e4e4] text-[#444] transition hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                              title="Delete template"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Preview of tiles */}
                    <div className="flex flex-wrap gap-1">
                      {template.tiles.slice(0, 4).map((tile) => (
                        <span
                          key={tile.id}
                          className="inline-block px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-700"
                        >
                          {tile.title}
                        </span>
                      ))}
                      {template.tiles.length > 4 && (
                        <span className="inline-block px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-700">
                          +{template.tiles.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Template Editor Modal */}
      <TemplateEditorModal
        open={!!editingEditableTemplateId || !!duplicatingTemplateId}
        onClose={() => {
          setEditingEditableTemplateId(null);
          setDuplicatingTemplateId(null);
        }}
        appearance={appearance}
        templateId={editingEditableTemplateId || undefined}
        sourceTemplateId={duplicatingTemplateId || undefined}
        onSave={handleSaveEditableTemplate}
      />
    </div>
  );
}
