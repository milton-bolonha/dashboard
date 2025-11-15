"use client";

import { useState, useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { ChevronDown, Droplet, Plus, Settings, Trash2 } from "lucide-react";

import type { AdeAppearanceTokens } from "@/lib/ade-theme";
import { DashboardConfigModal } from "./DashboardConfigModal";
import { GUEST_DASHBOARD_TEMPLATES } from "@/lib/guest-templates";

interface AdminHeaderAdeProps {
  appearance: AdeAppearanceTokens;
  workspaceName?: string;
  companyName?: string;
  companyId?: string;
  currentDashboardId?: string;
  dashboards?: Array<{ id: string; name: string; isActive?: boolean }>;
  onCustomizeBackground?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  onSaveTemplate?: () => void;
  onLogin?: () => void;
  onSignUp?: () => void;
  onCreateBlankDashboard?: () => void;
  onSelectDashboard?: (dashboardId: string) => void;
  onDeleteDashboard?: (dashboardId: string) => void;
  onApplyTemplate?: (templateId: string) => void;
  actionSlot?: ReactNode;
}

export function AdminHeaderAde({
  appearance,
  onCustomizeBackground,
  onSaveTemplate,
  onLogin,
  onSignUp,
  onCreateBlankDashboard,
  companyId,
  currentDashboardId,
  dashboards = [],
  onSelectDashboard,
  onDeleteDashboard,
  onApplyTemplate,
  actionSlot,
}: AdminHeaderAdeProps) {
  const [showDashboards, setShowDashboards] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [showDashboardConfig, setShowDashboardConfig] = useState(false);
  const dashboardsRef = useRef<HTMLDivElement>(null);
  const templatesRef = useRef<HTMLDivElement>(null);

  // Fechar dropdowns ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Check if click is outside dashboards dropdown
      if (
        showDashboards &&
        dashboardsRef.current &&
        !dashboardsRef.current.contains(target)
      ) {
        setShowDashboards(false);
      }

      // Check if click is outside templates dropdown
      if (
        showTemplates &&
        templatesRef.current &&
        !templatesRef.current.contains(target)
      ) {
        setShowTemplates(false);
      }
    };

    // Only add listener if at least one dropdown is open
    if (showDashboards || showTemplates) {
      // Use capture phase to catch clicks before they bubble
      document.addEventListener("mousedown", handleClickOutside, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside, true);
    };
  }, [showDashboards, showTemplates]);

  const buttonBaseClass =
    "flex h-9 w-9 items-center justify-center rounded-lg transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-black/40";
  const pillButtonClass =
    "flex items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-black/40";
  const loginLabel = "Log in";
  const signUpLabel = "Upgrade";

  return (
    <div
      className="flex h-full w-full items-center justify-end gap-4"
      suppressHydrationWarning
    >
      <div className="flex items-center gap-3">
        {onCustomizeBackground ? (
          <button
            type="button"
            onClick={onCustomizeBackground}
            className={`${buttonBaseClass} cursor-pointer`}
            style={{
              backgroundColor: appearance.surfaceColor,
              color: appearance.textColor,
            }}
            title="Choose dashboard color"
            suppressHydrationWarning
          >
            <Droplet className="h-5 w-5" />
          </button>
        ) : null}
        <div className="relative" ref={dashboardsRef}>
          <button
            type="button"
            onClick={() => setShowDashboards((value) => !value)}
            className={`${pillButtonClass} cursor-pointer`}
            style={{
              backgroundColor: appearance.surfaceColor,
              color: appearance.textColor,
            }}
            suppressHydrationWarning
          >
            <span>Dashboards</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          {showDashboards ? (
            <div
              className="absolute right-0 top-full mt-2 w-72 rounded-xl border p-4 shadow-lg z-50 bg-white"
              suppressHydrationWarning
              style={{
                backgroundColor: "#ffffff",
                borderColor: appearance.cardBorderColor,
              }}
            >
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDashboards(false);
                    onCreateBlankDashboard?.();
                  }}
                  className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition hover:border-black/30 cursor-pointer"
                  suppressHydrationWarning
                  style={{
                    borderColor: appearance.cardBorderColor,
                    color: "#000000",
                    backgroundColor: "#ffffff",
                  }}
                >
                  <span style={{ color: "#000000" }}>
                    Create Blank Dashboard
                  </span>
                  <Plus className="h-4 w-4" style={{ color: "#000000" }} />
                </button>
                {dashboards.length > 0 && (
                  <div
                    className="border-t pt-3"
                    style={{ borderColor: appearance.cardBorderColor }}
                    suppressHydrationWarning
                  >
                    <p
                      className="text-xs mb-2"
                      style={{ color: "#666666" }}
                      suppressHydrationWarning
                    >
                      Your Dashboards:
                    </p>
                    <div className="space-y-1 max-h-[200px] overflow-y-auto">
                      {dashboards.map((dashboard) => (
                        <div
                          key={dashboard.id}
                          className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition hover:border-black/30"
                          suppressHydrationWarning
                          style={{
                            borderColor: dashboard.isActive
                              ? "#000000"
                              : appearance.cardBorderColor,
                            backgroundColor: dashboard.isActive
                              ? "#f5f5f5"
                              : "#ffffff",
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setShowDashboards(false);
                              onSelectDashboard?.(dashboard.id);
                            }}
                            className="flex flex-1 items-center justify-between cursor-pointer"
                            suppressHydrationWarning
                          >
                            <span
                              style={{ color: "#000000" }}
                              suppressHydrationWarning
                            >
                              {dashboard.name}
                            </span>
                            {dashboard.isActive && (
                              <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700">
                                Active
                              </span>
                            )}
                          </button>
                          {dashboards.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (
                                  confirm(
                                    `Are you sure you want to delete "${dashboard.name}"?`
                                  )
                                ) {
                                  onDeleteDashboard?.(dashboard.id);
                                }
                              }}
                              className="ml-2 p-1 rounded hover:bg-red-50 transition cursor-pointer"
                              title="Delete dashboard"
                              suppressHydrationWarning
                            >
                              <Trash2
                                className="h-4 w-4"
                                style={{ color: "#dc2626" }}
                              />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
        <div className="relative" ref={templatesRef}>
          <button
            type="button"
            onClick={() => setShowTemplates((value) => !value)}
            className={`${pillButtonClass} cursor-pointer`}
            style={{
              backgroundColor: appearance.surfaceColor,
              color: appearance.textColor,
            }}
            suppressHydrationWarning
          >
            <span>Templates</span>
            <ChevronDown className="h-4 w-4" />
          </button>
          {showTemplates ? (
            <div
              className="absolute right-0 top-full mt-2 w-80 rounded-xl border p-4 shadow-lg z-50 bg-white"
              suppressHydrationWarning
              style={{
                backgroundColor: "#ffffff",
                borderColor: appearance.cardBorderColor,
              }}
            >
              <div className="space-y-3">
                <div>
                  <p
                    className="text-xs font-semibold mb-2"
                    style={{ color: "#666666" }}
                    suppressHydrationWarning
                  >
                    Available Templates:
                  </p>
                  <div className="space-y-1">
                    {Object.entries(GUEST_DASHBOARD_TEMPLATES).map(
                      ([templateId, template]) => (
                        <button
                          key={templateId}
                          type="button"
                          onClick={() => {
                            setShowTemplates(false);
                            onApplyTemplate?.(templateId);
                          }}
                          className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition hover:border-blue-500 hover:bg-blue-50 cursor-pointer"
                          suppressHydrationWarning
                          style={{
                            borderColor: appearance.cardBorderColor,
                            color: "#000000",
                            backgroundColor: "#ffffff",
                          }}
                        >
                          <div className="text-left">
                            <div
                              className="font-medium"
                              style={{ color: "#000000" }}
                            >
                              {template.name}
                            </div>
                            <div
                              className="text-xs"
                              style={{ color: "#666666" }}
                              suppressHydrationWarning
                            >
                              {template.tiles.length} tiles •{" "}
                              {template.description}
                            </div>
                          </div>
                        </button>
                      )
                    )}
                  </div>
                </div>
                <div
                  className="border-t pt-3"
                  style={{ borderColor: appearance.cardBorderColor }}
                  suppressHydrationWarning
                >
                  <button
                    type="button"
                    onClick={() => setShowDashboardConfig(true)}
                    className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition hover:border-black/30 cursor-pointer"
                    suppressHydrationWarning
                    style={{
                      borderColor: appearance.cardBorderColor,
                      color: "#000000",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <span style={{ color: "#000000" }}>Manage Templates</span>
                    <Settings
                      className="h-4 w-4"
                      style={{ color: "#000000" }}
                    />
                  </button>
                  <button
                    type="button"
                    onClick={onSaveTemplate}
                    className="flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition hover:border-black/30 cursor-pointer mt-2"
                    suppressHydrationWarning
                    style={{
                      borderColor: appearance.cardBorderColor,
                      color: "#000000",
                      backgroundColor: "#ffffff",
                    }}
                  >
                    <span style={{ color: "#000000" }}>
                      Save current as template
                    </span>
                    <Plus className="h-4 w-4" style={{ color: "#000000" }} />
                  </button>
                  <p
                    className="text-xs mt-2"
                    style={{ color: "#666666" }}
                    suppressHydrationWarning
                  >
                    Create templates from your current dashboard configuration.
                  </p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onLogin}
            className="rounded-full px-4 py-2 text-sm font-semibold cursor-pointer"
            style={{
              backgroundColor: "#101010",
              color: "#ffffff",
            }}
          >
            {loginLabel}
          </button>
          <button
            onClick={onSignUp}
            className="rounded-full border px-4 py-2 text-sm font-semibold cursor-pointer"
            suppressHydrationWarning
            style={{
              borderColor: appearance.cardBorderColor,
              color: appearance.textColor,
              backgroundColor: appearance.surfaceColor,
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
