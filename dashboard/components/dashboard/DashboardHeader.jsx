"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Plus, Save, Copy, Settings } from "lucide-react";

/**
 * Dashboard Header com Template Dropdown
 * Permite selecionar templates, criar blank, salvar como template
 */
export function DashboardHeader({
  currentTemplate,
  onTemplateChange,
  onSaveTemplate,
  onCloneDashboard,
  onCreateBlank,
}) {
  const [templates, setTemplates] = useState([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/guest/templates");
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTemplateSelect = (template) => {
    onTemplateChange(template);
    setShowTemplateSelector(false);
  };

  return (
    <div className="dashboard-header bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Template Selector */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setShowTemplateSelector(!showTemplateSelector)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-300 transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">
                {currentTemplate?.name || "Select Template"}
              </span>
              <ChevronDown className="w-4 h-4 text-gray-500" />
            </button>

            {/* Template Dropdown */}
            {showTemplateSelector && (
              <div className="absolute top-full left-0 mt-2 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">
                    Choose Template
                  </h3>

                  <div className="space-y-2">
                    {/* Default Templates */}
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                        Default Templates
                      </p>
                      {templates
                        .filter((t) => t.isDefault)
                        .map((template) => (
                          <button
                            key={template.id}
                            onClick={() => handleTemplateSelect(template)}
                            className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors group"
                            title={`${
                              template.tiles?.length || 0
                            } tiles: ${template.tiles
                              ?.map((t) => t.title)
                              .join(", ")}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {template.name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {template.description}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {template.tiles?.length || 0} tiles
                                </div>
                                {/* Tooltip com prompts */}
                                <div className="absolute left-0 top-full mt-2 w-96 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                                  <div className="space-y-2">
                                    {template.tiles
                                      ?.slice(0, 3)
                                      .map((tile, index) => (
                                        <div key={tile.id}>
                                          <div className="font-medium text-blue-300">
                                            {tile.title}
                                          </div>
                                          <div className="text-gray-300 line-clamp-2">
                                            {tile.prompt}
                                          </div>
                                        </div>
                                      ))}
                                    {template.tiles?.length > 3 && (
                                      <div className="text-gray-400">
                                        +{template.tiles.length - 3} more
                                        tiles...
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                            </div>
                          </button>
                        ))}
                    </div>

                    {/* Custom Templates */}
                    {templates.filter((t) => t.isCustom).length > 0 && (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          Your Templates
                        </p>
                        {templates
                          .filter((t) => t.isCustom)
                          .map((template) => (
                            <button
                              key={template.id}
                              onClick={() => handleTemplateSelect(template)}
                              className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {template.name}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {template.description}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-1">
                                    {template.tiles?.length || 0} tiles
                                  </div>
                                </div>
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                              </div>
                            </button>
                          ))}
                      </div>
                    )}

                    {/* Create Blank Option */}
                    <div className="pt-2 border-t border-gray-100">
                      <button
                        onClick={() => {
                          onCreateBlank();
                          setShowTemplateSelector(false);
                        }}
                        className="w-full text-left p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <Plus className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900">
                            Create Blank Dashboard
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dashboard Actions */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onSaveTemplate}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
          >
            <Save className="w-4 h-4" />
            <span>Save as Template</span>
          </button>

          <button
            onClick={onCloneDashboard}
            className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>Clone Dashboard</span>
          </button>

          <button className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg transition-colors">
            <Settings className="w-4 h-4" />
            <span>Customize</span>
          </button>
        </div>
      </div>
    </div>
  );
}
