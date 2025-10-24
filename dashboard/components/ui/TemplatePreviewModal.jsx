"use client";

import { useState } from "react";
import { X, Eye, CheckCircle, ArrowRight } from "lucide-react";
import Modal from "./Modal";

/**
 * Modal para preview de templates antes de aplicar
 */
export function TemplatePreviewModal({ template, isOpen, onClose, onApply }) {
  const [selectedTiles, setSelectedTiles] = useState(new Set());

  if (!template) return null;

  const handleTileToggle = (tileId) => {
    const newSelected = new Set(selectedTiles);
    if (newSelected.has(tileId)) {
      newSelected.delete(tileId);
    } else {
      newSelected.add(tileId);
    }
    setSelectedTiles(newSelected);
  };

  const handleApply = () => {
    const tilesToApply = template.tiles.filter(
      (tile) => selectedTiles.size === 0 || selectedTiles.has(tile.id)
    );
    onApply({ ...template, tiles: tilesToApply });
  };

  const handleSelectAll = () => {
    if (selectedTiles.size === template.tiles.length) {
      setSelectedTiles(new Set());
    } else {
      setSelectedTiles(new Set(template.tiles.map((t) => t.id)));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Template Preview"
      footer={
        <div className="flex justify-between items-center w-full">
          <div className="text-sm text-gray-500">
            {selectedTiles.size === 0
              ? `${template.tiles.length} tiles selected`
              : `${selectedTiles.size} of ${template.tiles.length} tiles selected`}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              Apply Template
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Template Info */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {template.name}
              </h3>
              <p className="text-sm text-gray-600">{template.description}</p>
              <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                <span>{template.tiles?.length || 0} tiles</span>
                <span>•</span>
                <span>
                  {template.isDefault ? "Default Template" : "Custom Template"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tile Selection */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900">
              Select Tiles to Apply
            </h4>
            <button
              onClick={handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {selectedTiles.size === template.tiles.length
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {template.tiles?.map((tile, index) => {
              const isSelected =
                selectedTiles.size === 0 || selectedTiles.has(tile.id);

              return (
                <div
                  key={tile.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => handleTileToggle(tile.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {isSelected ? (
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                      ) : (
                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h5 className="text-sm font-medium text-gray-900">
                          {tile.title}
                        </h5>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                          {tile.category}
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {tile.prompt}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Preview Layout */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Dashboard Layout Preview
          </h4>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-4 gap-2">
              {template.tiles?.slice(0, 8).map((tile, index) => (
                <div
                  key={tile.id}
                  className={`h-8 rounded border-2 ${
                    selectedTiles.size === 0 || selectedTiles.has(tile.id)
                      ? "border-blue-300 bg-blue-100"
                      : "border-gray-200 bg-gray-200"
                  }`}
                  style={{
                    gridColumn: `span ${tile.defaultSize?.w || 2}`,
                    gridRow: `span ${tile.defaultSize?.h || 1}`,
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs text-gray-600 font-medium">
                      {tile.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {template.tiles?.length > 8 && (
              <div className="text-center mt-2">
                <span className="text-xs text-gray-500">
                  +{template.tiles.length - 8} more tiles
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
