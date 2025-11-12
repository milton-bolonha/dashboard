"use client";

import { useState } from "react";
import { X, Plus, Trash2, Edit3, Copy } from "lucide-react";

import type { AdeAppearanceTokens } from "@/lib/ade-theme";

interface DashboardTemplate {
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
}

interface DashboardConfigModalProps {
  open: boolean;
  onClose: () => void;
  appearance: AdeAppearanceTokens;
  currentTemplate?: DashboardTemplate;
}

const MOCK_TEMPLATES: DashboardTemplate[] = [
  {
    id: "essential-research",
    name: "Essential Research",
    description: "8 tiles focused on quick business signals and revenue insights",
    isDefault: true,
    createdAt: "2024-01-01",
    tiles: [
      { id: "1", title: "Company Overview", category: "basic" },
      { id: "2", title: "Revenue Signals", category: "financial" },
      { id: "3", title: "CEO Information", category: "people" },
      { id: "4", title: "Sales Email", category: "sales" },
      { id: "5", title: "Business Goals", category: "strategy" },
      { id: "6", title: "Solution Need", category: "sales" },
      { id: "7", title: "Top Competitors", category: "market" },
      { id: "8", title: "Cold Call Scripts", category: "sales" },
    ],
  },
  {
    id: "deep-dive",
    name: "Deep Dive Research",
    description: "9 tiles for comprehensive competitive and strategic analysis",
    createdAt: "2024-01-15",
    tiles: [
      { id: "1", title: "Company Overview", category: "basic" },
      { id: "2", title: "Revenue Model", category: "financial" },
      { id: "3", title: "Biggest 2025 Goal", category: "strategy" },
      { id: "4", title: "Industry Challenges", category: "insights" },
      { id: "5", title: "Solution Need", category: "sales" },
      { id: "6", title: "Top Competitors", category: "market" },
      { id: "7", title: "Ownership/Funding", category: "financial" },
      { id: "8", title: "CEO Information", category: "people" },
      { id: "9", title: "Cold Call Scripts", category: "sales" },
    ],
  },
];

function generateId(): string {
  return `template-${Math.random().toString(36).substr(2, 9)}`;
}

export function DashboardConfigModal({
  open,
  onClose,
  currentTemplate,
}: DashboardConfigModalProps) {
  const [templates, setTemplates] = useState<DashboardTemplate[]>(MOCK_TEMPLATES);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");

  const handleCreateTemplate = () => {
    if (!newTemplateName.trim()) return;

    const newTemplate: DashboardTemplate = {
      id: generateId(),
      name: newTemplateName.trim(),
      description: newTemplateDescription.trim() || "Custom dashboard template",
      tiles: currentTemplate?.tiles || [],
      createdAt: new Date().toISOString(),
    };

    setTemplates(prev => [...prev, newTemplate]);
    setNewTemplateName("");
    setNewTemplateDescription("");
  };

  const handleDeleteTemplate = (templateId: string) => {
    setTemplates(prev => prev.filter(t => t.id !== templateId));
  };

  const handleDuplicateTemplate = (template: DashboardTemplate) => {
    const duplicated: DashboardTemplate = {
      ...template,
      id: generateId(),
      name: `${template.name} (Copy)`,
      createdAt: new Date().toISOString(),
      isDefault: false,
    };
    setTemplates(prev => [...prev, duplicated]);
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
          {/* Create New Template Section */}
          <div className="px-8 py-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold mb-4 text-[#1f1f1f]">Create New Template</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
              </div>
              <button
                type="button"
                onClick={handleCreateTemplate}
                disabled={!newTemplateName.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="h-4 w-4" />
                Create Template
              </button>
            </div>
          </div>

          {/* Templates List */}
          <div className="flex-1 overflow-y-auto px-8 py-6">
            <h3 className="text-lg font-semibold mb-4 text-[#1f1f1f]">Your Templates</h3>
            <div className="space-y-4">
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="rounded-xl border border-[#e4e4e4] bg-white p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-[#1f1f1f]">{template.name}</h4>
                        {template.isDefault && (
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#6f6f6f] mb-2">{template.description}</p>
                      <p className="text-xs text-[#9a9a9a]">
                        {template.tiles.length} tiles • Created {new Date(template.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDuplicateTemplate(template)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e4e4e4] text-[#444] transition hover:bg-[#f5f5f5]"
                        title="Duplicate template"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      {!template.isDefault && (
                        <>
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e4e4e4] text-[#444] transition hover:bg-[#f5f5f5]"
                            title="Edit template"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e4e4e4] text-[#444] transition hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                            title="Delete template"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Preview of tiles */}
                  <div className="flex flex-wrap gap-1">
                    {template.tiles.slice(0, 6).map((tile) => (
                      <span
                        key={tile.id}
                        className="inline-block px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700"
                      >
                        {tile.title}
                      </span>
                    ))}
                    {template.tiles.length > 6 && (
                      <span className="inline-block px-2 py-1 text-xs rounded-md bg-gray-100 text-gray-700">
                        +{template.tiles.length - 6} more
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
  );
}
