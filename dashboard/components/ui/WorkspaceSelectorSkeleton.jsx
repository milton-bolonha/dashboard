"use client";

import { BuildingOfficeIcon } from "@heroicons/react/24/outline";

export function WorkspaceSelectorSkeleton() {
  return (
    <div className="flex items-center space-x-2 animate-pulse">
      <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
      <div className="space-y-1">
        <div className="w-24 h-4 bg-gray-300 dark:bg-gray-700 rounded"></div>
        <div className="w-16 h-3 bg-gray-300 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}
