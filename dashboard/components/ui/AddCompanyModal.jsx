"use client";

import React, { useState } from "react";
import { X } from "lucide-react";

export function AddCompanyModal({ isOpen, onClose, onAdd, userContext }) {
  const [companyName, setCompanyName] = useState("");
  const [companyUrl, setCompanyUrl] = useState("");
  const [researcherUrl, setResearcherUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Preencher researcherUrl com o contexto do usuário se disponível
  React.useEffect(() => {
    if (userContext?.salesRepWebsite && !researcherUrl) {
      setResearcherUrl(userContext.salesRepWebsite);
    }
  }, [userContext, researcherUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!companyName.trim() || !companyUrl.trim()) {
      setError("Company name and website URL are required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/guest/add-company", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: companyName.trim(),
          companyUrl: companyUrl.trim(),
          researcherUrl: researcherUrl.trim(),
        }),
      });

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
    onClose();
  };

  if (!isOpen) return null;

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
              className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md disabled:opacity-50"
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
