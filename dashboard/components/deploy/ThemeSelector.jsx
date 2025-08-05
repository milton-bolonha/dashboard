"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const PREDEFINED_TEMPLATES = [
  {
    id: "dashmaster-default",
    name: "DashMaster Template",
    description: "Template oficial com Gatsby + TailwindCSS",
    preview: "/images/template-dashmaster.jpg",
    url: "https://github.com/milton-bolonha/dashmaster-gatsby-template",
    tags: ["Gatsby", "TailwindCSS", "React"],
    recommended: true,
  },
  {
    id: "business-template",
    name: "Business Template",
    description: "Template para sites corporativos",
    preview: "/images/template-business.jpg", 
    url: "https://github.com/milton-bolonha/gatsby-theme-v5-boilerplate",
    tags: ["Gatsby", "Business", "Professional"],
    recommended: false,
  },
  {
    id: "minimal-template",
    name: "Minimal Template",
    description: "Template minimalista e rápido",
    preview: "/images/template-minimal.jpg",
    url: "https://github.com/milton-bolonha/gatsby-theme-boilerplate",
    tags: ["Gatsby", "Minimal", "Fast"],
    recommended: false,
  },
];

export default function ThemeSelector({ value, onChange, className = "" }) {
  const [selectedTemplate, setSelectedTemplate] = useState(
    PREDEFINED_TEMPLATES.find(t => t.url === value)?.id || 
    (value ? "custom" : "dashmaster-default")
  );
  const [customUrl, setCustomUrl] = useState(
    PREDEFINED_TEMPLATES.find(t => t.url === value) ? "" : value || ""
  );

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.id);
    setCustomUrl("");
    onChange(template.url);
  };

  const handleCustomSelect = () => {
    setSelectedTemplate("custom");
    onChange(customUrl);
  };

  const handleCustomUrlChange = (url) => {
    setCustomUrl(url);
    if (selectedTemplate === "custom") {
      onChange(url);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Escolher Template
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Selecione um template para seu site ou use um repositório customizado
        </p>
      </div>

      {/* Templates Predefinidos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {PREDEFINED_TEMPLATES.map((template) => (
          <Card
            key={template.id}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedTemplate === template.id
                ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "hover:shadow-md"
            }`}
            onClick={() => handleTemplateSelect(template)}
          >
            <div className="p-4">
              {/* Badge Recomendado */}
              {template.recommended && (
                <div className="mb-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                    ⭐ Recomendado
                  </span>
                </div>
              )}

              {/* Preview da Imagem */}
              <div className="w-full h-24 bg-gray-200 dark:bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                <div className="text-gray-400 text-sm">
                  {template.name}
                </div>
              </div>

              {/* Informações do Template */}
              <div className="space-y-2">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  {template.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {template.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Indicador de Seleção */}
                {selectedTemplate === template.id && (
                  <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Selecionado
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {/* Cartão Custom */}
        <Card
          className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
            selectedTemplate === "custom"
              ? "ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "hover:shadow-md"
          }`}
          onClick={handleCustomSelect}
        >
          <div className="p-4">
            <div className="w-full h-24 bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/30 dark:to-blue-900/30 rounded-lg mb-3 flex items-center justify-center">
              <div className="text-gray-600 dark:text-gray-400 text-sm text-center">
                <svg className="w-8 h-8 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                Customizado
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                Repositório Customizado
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Use seu próprio template ou um template da comunidade
              </p>

              <div className="flex flex-wrap gap-1">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-700 dark:bg-purple-700 dark:text-purple-300">
                  Custom
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-700 dark:bg-purple-700 dark:text-purple-300">
                  Community
                </span>
              </div>

              {selectedTemplate === "custom" && (
                <div className="flex items-center text-blue-600 dark:text-blue-400 text-sm">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Selecionado
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Input para URL Custom */}
      {selectedTemplate === "custom" && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            URL do Repositório Customizado
          </label>
          <Input
            type="url"
            placeholder="https://github.com/usuario/meu-template"
            value={customUrl}
            onChange={(e) => handleCustomUrlChange(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500 mt-2">
            Certifique-se de que seu template é compatível com a API pública do DashMaster
          </p>
        </div>
      )}

      {/* Informações do Template Selecionado */}
      {selectedTemplate !== "custom" && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Template selecionado:</strong>{" "}
            {PREDEFINED_TEMPLATES.find(t => t.id === selectedTemplate)?.name}
          </p>
          <p className="text-xs text-blue-600 dark:text-blue-300 mt-1">
            {PREDEFINED_TEMPLATES.find(t => t.id === selectedTemplate)?.url}
          </p>
        </div>
      )}
    </div>
  );
}