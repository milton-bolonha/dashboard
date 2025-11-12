"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, Droplet, Moon, Plus, Settings } from "lucide-react";

import type { AdeAppearanceTokens } from "@/lib/ade-theme";
import { DashboardConfigModal } from "./DashboardConfigModal";

interface AdminHeaderAdeProps {
  appearance: AdeAppearanceTokens;
  workspaceName?: string;
  companyName?: string;
  onCustomizeBackground?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onToggleDarkMode?: () => void;
  onSaveTemplate?: () => void;
  onLogin?: () => void;
  onSignUp?: () => void;
  actionSlot?: ReactNode;
}

export function AdminHeaderAde({
  appearance,
  onCustomizeBackground,
  onToggleDarkMode,
  onSaveTemplate,
  onLogin,
  onSignUp,
  actionSlot,
}: AdminHeaderAdeProps) {
  const [showDashboards, setShowDashboards] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showDashboardConfig, setShowDashboardConfig] = useState(false);

  const buttonBaseClass =
    "flex h-9 w-9 items-center justify-center rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-black/40";
  const pillButtonClass =
    "flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-black/40";
  const loginLabel = "Log in";
  const signUpLabel = "Upgrade";

  return (
    <div className="flex h-full w-full items-center justify-end gap-4" suppressHydrationWarning>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleDarkMode}
          className={`${buttonBaseClass}`}
          style={{ backgroundColor: appearance.surfaceColor, color: appearance.textColor }}
          title="Toggle dark/light mode"
          suppressHydrationWarning
        >
          <Moon className="h-5 w-5" />
        </button>
        {onCustomizeBackground ? (
          <button
            type="button"
            onClick={onCustomizeBackground}
            className={`${buttonBaseClass}`}
            style={{ backgroundColor: appearance.surfaceColor, color: appearance.textColor }}
            title="Choose dashboard color"
            suppressHydrationWarning
          >
            <Droplet className="h-5 w-5" />
          </button>
        ) : null}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDashboards((value) => !value)}
            className={pillButtonClass}
            style={{ backgroundColor: appearance.surfaceColor, color: appearance.textColor }}
            suppressHydrationWarning
          >
            <span>Dashboards</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          {showDashboards ? (
            <div
              className="absolute right-0 top-full mt-2 w-72 rounded-xl border p-4 shadow-lg z-50"
              suppressHydrationWarning
              style={{
                backgroundColor: appearance.surfaceColor,
                borderColor: appearance.cardBorderColor,
              }}
            >
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    // TODO: Implement create blank dashboard
                    console.log("Create blank dashboard");
                    setShowDashboards(false);
                  }}
                  className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition hover:border-black/30"
                  suppressHydrationWarning
                  style={{
                    borderColor: appearance.cardBorderColor,
                    color: appearance.textColor,
                    backgroundColor: appearance.surfaceColor,
                  }}
                >
                  <span>Create Blank Dashboard</span>
                  <Plus className="h-4 w-4" />
                </button>
                <div className="border-t pt-3" style={{ borderColor: appearance.cardBorderColor }} suppressHydrationWarning>
                  <p className="text-xs mb-2" style={{ color: appearance.mutedTextColor }} suppressHydrationWarning>
                    Current workspace:
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm" style={{ color: appearance.textColor }} suppressHydrationWarning>
                        Default Research Template
                      </span>
                      <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                        Active
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTemplates((value) => !value)}
            className={pillButtonClass}
            style={{ backgroundColor: appearance.surfaceColor, color: appearance.textColor }}
            suppressHydrationWarning
          >
            <span>Templates</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          {showTemplates ? (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-xl border p-4 shadow-lg z-50"
              suppressHydrationWarning
              style={{
                backgroundColor: appearance.surfaceColor,
                borderColor: appearance.cardBorderColor,
              }}
            >
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: appearance.mutedTextColor }} suppressHydrationWarning>
                    Available Templates:
                  </p>
                  <div className="space-y-1">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition hover:border-blue-500 hover:bg-blue-50"
                      suppressHydrationWarning
                      style={{
                        borderColor: appearance.cardBorderColor,
                        color: appearance.textColor,
                        backgroundColor: appearance.surfaceColor,
                      }}
                    >
                      <div className="text-left">
                        <div className="font-medium">Essential Research</div>
                        <div className="text-xs" style={{ color: appearance.mutedTextColor }} suppressHydrationWarning>
                          8 tiles for quick business signals
                        </div>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700">
                        Active
                      </span>
                    </button>
                    <button
                      type="button"
                      className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition hover:border-blue-500 hover:bg-blue-50"
                      suppressHydrationWarning
                      style={{
                        borderColor: appearance.cardBorderColor,
                        color: appearance.textColor,
                        backgroundColor: appearance.surfaceColor,
                      }}
                    >
                      <div className="text-left">
                        <div className="font-medium">Deep Dive Research</div>
                        <div className="text-xs" style={{ color: appearance.mutedTextColor }} suppressHydrationWarning>
                          9 tiles for competitive analysis
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
                <div className="border-t pt-3" style={{ borderColor: appearance.cardBorderColor }} suppressHydrationWarning>
                  <button
                    type="button"
                    onClick={onSaveTemplate}
                    className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition hover:border-black/30"
                    suppressHydrationWarning
                    style={{
                      borderColor: appearance.cardBorderColor,
                      color: appearance.textColor,
                      backgroundColor: appearance.surfaceColor,
                    }}
                  >
                    <span>Save current as template</span>
                    <Plus className="h-4 w-4" />
                  </button>
                  <p className="text-xs mt-2" style={{ color: appearance.mutedTextColor }} suppressHydrationWarning>
                    Create templates from your current dashboard configuration.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setShowDashboardConfig(true)}
          className={`${buttonBaseClass}`}
          style={{ backgroundColor: appearance.surfaceColor, color: appearance.textColor }}
          title="Dashboard settings"
          suppressHydrationWarning
        >
          <Settings className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={onLogin}
            className="rounded-full px-4 py-2 text-sm font-semibold transition"
            style={{ backgroundColor: "#101010", color: "#ffffff" }}
          >
            {loginLabel}
          </button>
          <button
            onClick={onSignUp}
            className="rounded-full border px-4 py-2 text-sm font-semibold transition hover:bg-black/5"
            suppressHydrationWarning
            style={{
              borderColor: appearance.cardBorderColor,
              color: appearance.textColor,
            }}
          >
            {signUpLabel}
          </button>
        </div>
        {actionSlot}
      </div>

      <DashboardConfigModal
        open={showDashboardConfig}
        onClose={() => setShowDashboardConfig(false)}
        appearance={appearance}
      />
    </div>
  );
}

