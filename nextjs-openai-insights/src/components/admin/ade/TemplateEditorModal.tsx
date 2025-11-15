"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2, Save } from "lucide-react";

import type { AdeAppearanceTokens } from "@/lib/ade-theme";
import type { EditableTemplate, EditableTemplateTile } from "@/lib/types/dashboard-template";
import { GUEST_DASHBOARD_TEMPLATES } from "@/lib/guest-templates";
import {
  saveEditableTemplate,
  getEditableTemplate,
} from "@/lib/storage/templates-store";

interface TemplateEditorModalProps {
  open: boolean;
  onClose: () => void;
  appearance: AdeAppearanceTokens;
  templateId?: string; // If editing existing template
  sourceTemplateId?: string; // If duplicating from default template
  onSave?: (template: EditableTemplate) => void;
}

function generateId(): string {
  return `editable_template_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Convert GUEST_DASHBOARD_TEMPLATES to EditableTemplate format
function convertGuestTemplateToEditable(
  templateId: string,
  guestTemplate: typeof GUEST_DASHBOARD_TEMPLATES.template_1
): EditableTemplate {
  return {
    id: generateId(),
    name: `${guestTemplate.name} (Copy)`,
    description: guestTemplate.description,
    tiles: guestTemplate.tiles.map((tile, index) => ({
      id: tile.id,
      title: tile.title,
      prompt: tile.prompt,
      category: tile.category,
      orderIndex: index,
      useMaxMode: tile.useMaxMode ?? guestTemplate.defaults?.useMaxMode ?? false,
      requestSize: tile.requestSize ?? guestTemplate.defaults?.requestSize ?? "small",
      agentId: tile.agentId ?? guestTemplate.defaults?.agentId,
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isDefault: false,
    sourceTemplateId: templateId,
    isCustom: true,
  };
}

export function TemplateEditorModal({
  open,
  onClose,
  appearance: _appearance,
  templateId,
  sourceTemplateId,
  onSave,
}: TemplateEditorModalProps) {
  const [template, setTemplate] = useState<EditableTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load template on open
  useEffect(() => {
    if (!open) return;

    // Use requestAnimationFrame to avoid synchronous setState in effect
    requestAnimationFrame(() => {
      setIsLoading(true);
      setHasChanges(false);

      if (templateId) {
        // Editing existing editable template
        const existing = getEditableTemplate(templateId);
        if (existing) {
          setTemplate(existing);
        } else {
          // Fallback: create new empty template
          setTemplate({
            id: generateId(),
            name: "New Template",
            description: "",
            tiles: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: true,
          });
        }
      } else if (sourceTemplateId) {
        // Duplicating from default template
        const guestTemplate = GUEST_DASHBOARD_TEMPLATES[sourceTemplateId as keyof typeof GUEST_DASHBOARD_TEMPLATES];
        if (guestTemplate) {
          const editable = convertGuestTemplateToEditable(sourceTemplateId, guestTemplate);
          setTemplate(editable);
        } else {
          // Fallback: create new empty template
          setTemplate({
            id: generateId(),
            name: "New Template",
            description: "",
            tiles: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isCustom: true,
          });
        }
      } else {
        // Creating new template from scratch
        setTemplate({
          id: generateId(),
          name: "New Template",
          description: "",
          tiles: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          isCustom: true,
        });
      }

      setIsLoading(false);
    });
  }, [open, templateId, sourceTemplateId]);

  const handleUpdateTemplate = (updates: Partial<EditableTemplate>) => {
    if (!template) return;
    setTemplate({ ...template, ...updates });
    setHasChanges(true);
  };

  const handleUpdateTile = (tileId: string, updates: Partial<EditableTemplateTile>) => {
    if (!template) return;
    const updatedTiles = template.tiles.map((tile) =>
      tile.id === tileId ? { ...tile, ...updates } : tile
    );
    setTemplate({ ...template, tiles: updatedTiles });
    setHasChanges(true);
  };

  const handleAddTile = () => {
    if (!template) return;
    const newTile: EditableTemplateTile = {
      id: `tile_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      title: "New Tile",
      prompt: "",
      category: "basic",
      orderIndex: template.tiles.length,
      useMaxMode: false,
      requestSize: "small",
    };
    setTemplate({ ...template, tiles: [...template.tiles, newTile] });
    setHasChanges(true);
  };

  const handleDeleteTile = (tileId: string) => {
    if (!template) return;
    if (!confirm("Are you sure you want to delete this tile?")) return;
    const updatedTiles = template.tiles.filter((tile) => tile.id !== tileId);
    setTemplate({ ...template, tiles: updatedTiles });
    setHasChanges(true);
  };

  const handleSave = () => {
    if (!template || !template.name.trim()) {
      alert("Please provide a template name");
      return;
    }

    if (template.tiles.length === 0) {
      alert("Please add at least one tile to the template");
      return;
    }

    const updatedTemplate: EditableTemplate = {
      ...template,
      updatedAt: new Date().toISOString(),
    };

    saveEditableTemplate(updatedTemplate);
    setHasChanges(false);
    
    if (onSave) {
      onSave(updatedTemplate);
    }
    
    onClose();
  };

  const handleClose = () => {
    if (hasChanges) {
      if (!confirm("You have unsaved changes. Are you sure you want to close?")) {
        return;
      }
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[28px] border border-[#e4e4e4] bg-white shadow-[0_32px_80px_rgba(15,23,42,0.2)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-start justify-between gap-4 px-8 py-6 border-b border-gray-100 flex-shrink-0">
          <div className="space-y-2 flex-1">
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-[#9a9a9a]">
              Template Editor
            </p>
            <input
              type="text"
              value={template?.name || ""}
              onChange={(e) => handleUpdateTemplate({ name: e.target.value })}
              placeholder="Template name"
              className="text-2xl font-semibold text-[#1f1f1f] bg-transparent border-none outline-none w-full"
            />
            <textarea
              value={template?.description || ""}
              onChange={(e) => handleUpdateTemplate({ description: e.target.value })}
              placeholder="Template description (optional)"
              className="text-sm text-[#6f6f6f] bg-transparent border-none outline-none w-full resize-none"
              rows={2}
            />
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e4e4e4] text-[#444] transition hover:bg-[#f5f5f5] flex-shrink-0"
            aria-label="Close editor"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          {isLoading ? (
            <div className="text-center py-12 text-[#6f6f6f]">Loading template...</div>
          ) : !template ? (
            <div className="text-center py-12 text-[#6f6f6f]">Template not found</div>
          ) : (
            <div className="space-y-4">
              {template.tiles.map((tile) => (
                <div
                  key={tile.id}
                  className="rounded-lg border border-[#e4e4e4] bg-white p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={tile.title}
                        onChange={(e) => handleUpdateTile(tile.id, { title: e.target.value })}
                        placeholder="Tile title"
                        className="text-base font-semibold text-[#1f1f1f] bg-transparent border-none outline-none w-full"
                      />
                      <textarea
                        value={tile.prompt}
                        onChange={(e) => handleUpdateTile(tile.id, { prompt: e.target.value })}
                        placeholder="Enter prompt for this tile..."
                        className="w-full min-h-[100px] rounded-lg border border-[#e4e4e4] bg-white px-3 py-2 text-sm text-[#1f1f1f] placeholder:text-[#a1a1a1] focus:border-black focus:outline-none focus:ring-0 resize-y"
                      />
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-2">
                          <label className="text-[#6f6f6f]">Category:</label>
                          <input
                            type="text"
                            value={tile.category}
                            onChange={(e) => handleUpdateTile(tile.id, { category: e.target.value })}
                            className="w-24 rounded border border-[#e4e4e4] bg-white px-2 py-1 text-[#1f1f1f] focus:border-black focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-[#6f6f6f]">Size:</label>
                          <select
                            value={tile.requestSize || "small"}
                            onChange={(e) =>
                              handleUpdateTile(tile.id, {
                                requestSize: e.target.value as "small" | "medium" | "large",
                              })
                            }
                            className="rounded border border-[#e4e4e4] bg-white px-2 py-1 text-[#1f1f1f] focus:border-black focus:outline-none"
                          >
                            <option value="small">Small</option>
                            <option value="medium">Medium</option>
                            <option value="large">Large</option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <label className="text-[#6f6f6f]">Max Mode:</label>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={tile.useMaxMode ?? false}
                              onChange={(e) =>
                                handleUpdateTile(tile.id, { useMaxMode: e.target.checked })
                              }
                              className="sr-only peer"
                            />
                            <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-black/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-black"></div>
                          </label>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteTile(tile.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e4e4e4] text-[#444] transition hover:bg-red-50 hover:text-red-600 hover:border-red-200 flex-shrink-0"
                      title="Delete tile"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddTile}
                className="w-full rounded-lg border-2 border-dashed border-[#e4e4e4] bg-white px-4 py-3 text-sm font-medium text-[#6f6f6f] transition hover:border-black hover:text-black flex items-center justify-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Tile
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="flex items-center justify-between gap-4 px-8 py-4 border-t border-gray-100 flex-shrink-0">
          <div className="text-xs text-[#9a9a9a]">
            {hasChanges && <span className="text-amber-600">• Unsaved changes</span>}
            {template && (
              <span className="ml-2">
                {template.tiles.length} tile{template.tiles.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleClose}
              className="rounded-lg border border-[#e4e4e4] bg-white px-4 py-2 text-sm font-medium text-[#444] transition hover:bg-[#f5f5f5]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!template || !template.name.trim() || template.tiles.length === 0}
              className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="h-4 w-4" />
              Save Template
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

