"use client";

import { useState, useMemo } from "react";
import Modal from "./Modal";

/**
 * Modal para salvar dashboard atual como template
 */
export default function SaveTemplateModal({
  isOpen,
  onClose,
  onSave,
  currentTiles,
  hasSessionData = true,
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const totalTiles = useMemo(
    () => (Array.isArray(currentTiles) ? currentTiles.length : 0),
    [currentTiles]
  );

  const handleSave = async () => {
    if (!name.trim() || !hasSessionData) return;

    setIsLoading(true);

    try {
      const template = {
        name: name.trim(),
        description: description.trim() || `Template with ${totalTiles} tiles`,
        tiles: (currentTiles || []).map((tile) => ({
          id: tile.id,
          title: tile.title,
          prompt: tile.question,
          category: tile.category,
          order: tile.order || 0,
          defaultSize: tile.defaultSize || { w: 4, h: 2 },
          isCustom: Boolean(tile.isCustom),
        })),
      };

      await onSave(template);
      handleClose();
    } catch (error) {
      console.error("❌ Erro ao salvar template:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (isLoading) return;
    setName("");
    setDescription("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      onClose={handleClose}
      title="Save as Template"
      footer={
        <div className="flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || isLoading || !hasSessionData}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? "Saving..." : "Save Template"}
          </button>
        </div>
      }
    >
      {!hasSessionData ? (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-sm text-yellow-700">
            Missing session information to save templates. Please reload the
            page or start a new job.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Save your current dashboard layout as a reusable template
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Template Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter template name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this template"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm text-gray-600">
              <strong>{totalTiles} tiles</strong> will be saved in this template
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
