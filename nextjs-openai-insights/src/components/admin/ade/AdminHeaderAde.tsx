"use client";

import { useState } from "react";
import { ChevronDown, Moon, Plus, Settings } from "lucide-react";

interface AdminHeaderAdeProps {
  workspaceName?: string;
  companyName?: string;
  onCustomizeBackground?: () => void;
  onSaveTemplate?: () => void;
  actionSlot?: React.ReactNode;
}

export function AdminHeaderAde({
  onCustomizeBackground,
  onSaveTemplate,
  actionSlot,
}: AdminHeaderAdeProps) {
  const [showDashboards, setShowDashboards] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  return (
    <div className="flex h-full w-full items-center justify-end gap-3 px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 transition hover:bg-gray-200"
          title="Toggle theme"
        >
          <Moon className="h-5 w-5 text-gray-700" />
        </button>
        {onCustomizeBackground ? (
          <button
            type="button"
            onClick={onCustomizeBackground}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 transition hover:bg-gray-200"
            title="Customize background"
          >
            <Settings className="h-5 w-5 text-gray-700" />
          </button>
        ) : null}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDashboards((value) => !value)}
            className="flex items-center space-x-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
          >
            <span>Dashboards</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          {showDashboards ? (
            <div className="absolute right-0 top-full mt-2 w-60 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
              <p className="text-sm text-gray-500">No extra dashboards available yet.</p>
            </div>
          ) : null}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTemplates((value) => !value)}
            className="flex items-center space-x-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-200"
          >
            <span>Templates</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          {showTemplates ? (
            <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={onSaveTemplate}
                  className="flex w-full items-center justify-between rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 transition hover:border-gray-300"
                >
                  <span>Save as template</span>
                  <Plus className="h-4 w-4" />
                </button>
                <p className="text-xs text-gray-500">You don’t have templates yet.</p>
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-full bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-900">
            Log in
          </button>
          <button className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-gray-50">
            Sign up
          </button>
        </div>
        {actionSlot}
      </div>
    </div>
  );
}

