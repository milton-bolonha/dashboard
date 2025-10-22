"use client";

import { Bot, Sparkles } from "lucide-react";

export function LoadingTile({ index = 0 }) {
  return (
    <div className="relative bg-white rounded-lg p-5 h-48 border border-gray-200 shadow-sm overflow-hidden">
      {/* Shimmer effect */}
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-gray-100 to-transparent"></div>

      <div className="relative">
        {/* Header com ícone */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center animate-pulse">
              <Bot className="w-4 h-4 text-blue-600" />
            </div>
            <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
          </div>
          <Sparkles className="w-4 h-4 text-yellow-500 animate-pulse" />
        </div>

        {/* Content placeholders */}
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse"></div>
          <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center space-x-2">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.2s" }}
          ></div>
          <div
            className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
            style={{ animationDelay: "0.4s" }}
          ></div>
          <span className="text-xs text-gray-500 ml-2">
            Generating insights...
          </span>
        </div>
      </div>
    </div>
  );
}
