"use client";

import { useState, useMemo } from "react";
import { X } from "lucide-react";

import { cookieModeEnabled } from "@/lib/config/features";

export function AddContactModal({
  isOpen,
  onClose,
  onAdd,
  companyId,
  companyName,
  jobId,
  guestId,
  token,
  entityKey,
}) {
  const [contactName, setContactName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasSessionData = useMemo(
    () =>
      cookieModeEnabled ||
      (!!companyId && !!jobId && !!guestId && typeof token === "string"),
    [companyId, jobId, guestId, token]
  );

  const resetState = () => {
    setContactName("");
    setJobTitle("");
    setLinkedinUrl("");
    setError("");
  };

  const handleClose = () => {
    if (loading) return;
    resetState();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!contactName.trim() || !jobTitle.trim()) {
      setError("Contact name and job title are required");
      return;
    }

    if (!cookieModeEnabled && !hasSessionData) {
      setError("Missing session information");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const payload = cookieModeEnabled
        ? {
            name: contactName.trim(),
            jobTitle: jobTitle.trim(),
            linkedinUrl: linkedinUrl.trim(),
          }
        : {
            jobId,
            guestId,
            token,
            companyId,
            entityKey,
            contactName: contactName.trim(),
            jobTitle: jobTitle.trim(),
            linkedinUrl: linkedinUrl.trim(),
          };

      const response = await fetch(
        cookieModeEnabled ? "/api/cookie/contacts" : "/api/guest/add-contact",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(data.error || "Failed to add contact");
        return;
      }

      onAdd?.(data.contact);
      resetState();
      onClose();
    } catch (err) {
      console.error("Error adding contact:", err);
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">Add Contact</h3>
            <p className="text-sm text-gray-500">
              {companyName || "Select a company"}
            </p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-gray-100 rounded"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!cookieModeEnabled && !hasSessionData ? (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-700">
              Missing session information to add contacts. Please reload the
              page or start a new job.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Name *
              </label>
              <input
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., John Smith"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title *
              </label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., VP of Sales"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                LinkedIn URL (optional)
              </label>
              <input
                type="url"
                value={linkedinUrl}
                onChange={(e) => setLinkedinUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://linkedin.com/in/..."
                disabled={loading}
              />
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <div className="flex justify-end space-x-3">
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
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={loading}
              >
                {loading ? "Adding..." : "Add Contact"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
