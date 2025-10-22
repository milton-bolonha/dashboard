"use client";

import { Plus } from "lucide-react";

export function AddPromptTile({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative bg-white rounded-lg h-48 border-2 border-dashed border-gray-400 hover:border-gray-500 hover:bg-gray-50 transition-all duration-200 flex flex-col items-center justify-center cursor-pointer"
    >
      <div className="flex flex-col items-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-gray-300 group-hover:bg-gray-400 transition-colors flex items-center justify-center">
          <Plus className="w-6 h-6 text-gray-600 group-hover:text-gray-700" />
        </div>
        <span className="text-sm font-medium text-gray-600 group-hover:text-gray-700">
          Add Prompt
        </span>
      </div>
    </button>
  );
}
