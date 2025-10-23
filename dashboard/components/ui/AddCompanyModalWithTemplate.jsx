"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import TemplateSelector from "./TemplateSelector";

export function AddCompanyModalWithTemplate({
  isOpen,
  onClose,
  onAdd,
  userContext,
}) {
  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [researcherUrl, setResearcherUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Preencher researcherUrl com o contexto do usuário se disponível
  React.useEffect(() => {
    if (userContext?.salesRepWebsite) {
      setResearcherUrl(userContext.salesRepWebsite);
    }
  }, [userContext]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!companyName.trim() || !companyUrl.trim()) {
      setError("Company name and website URL are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let response;

      if (selectedTemplate) {
        // Usar template selecionado
        response = await fetch("/api/guest/templates/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            templateId: selectedTemplate.id,
            companyName: companyName.trim(),
            companyUrl: companyUrl.trim(),
          }),
        });
      } else {
        // Usar método padrão (sem template)
        response = await fetch("/api/guest/add-company", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: companyName.trim(),
            companyUrl: companyUrl.trim(),
            researcherUrl: researcherUrl.trim(),
          }),
        });
      }

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to add company");
        return;
      }

      onAdd(data);
      handleClose();
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCompanyName("");
    setCompanyUrl("");
    setResearcherUrl("");
    setError("");
    setSelectedTemplate(null);
    setShowTemplateSelector(false);
    onClose();
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
  };

  const handleTemplateCancel = () => {
    setShowTemplateSelector(false);
  };

  if (!isOpen) return null;

  if (showTemplateSelector) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Choose Template</h3>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <TemplateSelector
            onSelect={handleTemplateSelect}
            onCancel={handleTemplateCancel}
            isOpen={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Add Company</h3>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Name
              </label>
              <input
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Tesla"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company Website URL
              </label>
              <input
                type="url"
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., www.tesla.com or https://www.tesla.com"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your Company Website (Optional)
              </label>
              <input
                type="url"
                value={researcherUrl}
                onChange={(e) => setResearcherUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., www.yourcompany.com"
                disabled={loading}
              />
            </div>

            {/* Template Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dashboard Template (Optional)
              </label>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => setShowTemplateSelector(true)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {selectedTemplate ? (
                    <div>
                      <div className="font-medium text-gray-900">
                        {selectedTemplate.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {selectedTemplate.tiles.length} tiles
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500">Choose a template...</span>
                  )}
                </button>
                {selectedTemplate && (
                  <button
                    type="button"
                    onClick={() => setSelectedTemplate(null)}
                    className="px-2 py-1 text-sm text-red-600 hover:bg-red-50 rounded"
                  >
                    Clear
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Select a template to apply to this company's dashboard
              </p>
            </div>

            {error && <div className="text-red-600 text-sm">{error}</div>}
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md disabled:opacity-50 cursor-pointer"
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
