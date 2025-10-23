"use client";

import { useState, useEffect } from "react";

/**
 * Componente para selecionar template ao criar nova company
 */
export default function TemplateSelector({ onSelect, onCancel, isOpen }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/guest/templates");
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates);
      } else {
        console.error("❌ Erro ao carregar templates:", data.error);
      }
    } catch (error) {
      console.error("❌ Erro ao carregar templates:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = () => {
    if (selectedTemplate) {
      onSelect(selectedTemplate);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="template-selector">
      <div className="modal-header mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Choose a Template
        </h3>
        <p className="text-sm text-gray-600">
          Select a template to apply to your new company
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="templates-list space-y-3 max-h-96 overflow-y-auto">
          {templates.map((template) => (
            <div
              key={template.id}
              className={`template-option p-4 border rounded-lg cursor-pointer transition-colors ${
                selectedTemplate?.id === template.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
              }`}
              onClick={() => setSelectedTemplate(template)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">
                      {template.name}
                    </h4>
                    {template.isDefault && (
                      <span className="px-2 py-1 text-xs font-medium text-blue-600 bg-blue-100 rounded">
                        Default
                      </span>
                    )}
                    {template.isCustom && (
                      <span className="px-2 py-1 text-xs font-medium text-green-600 bg-green-100 rounded">
                        Custom
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {template.description}
                  </p>
                  <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                    <span>{template.tiles.length} tiles</span>
                    <span>
                      Created:{" "}
                      {new Date(template.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="ml-4">
                  {selectedTemplate?.id === template.id && (
                    <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="modal-footer flex justify-end space-x-3 pt-4 border-t mt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          onClick={handleSelect}
          disabled={!selectedTemplate || isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Apply Template
        </button>
      </div>
    </div>
  );
}
