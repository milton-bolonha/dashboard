"use client";

import { useState, useCallback, useEffect } from "react";
import type { Dashboard, CompanyWithDashboards } from "@/lib/types/dashboard";
import type { WorkspaceSnapshot } from "@/lib/types";
import {
  loadCompaniesWithDashboards,
  getOrCreateCompanyFromWorkspace,
  createDashboard as createDashboardInStore,
  getActiveDashboard,
  setActiveDashboard as setActiveDashboardInStore,
  updateDashboard as updateDashboardInStore,
  deleteDashboard as deleteDashboardInStore,
  getCompanyById,
} from "@/lib/storage/dashboards-store";
import {
  loadWorkspace as loadCachedWorkspace,
  listStoredWorkspaces,
} from "@/lib/storage/workspace-browser";

/**
 * Dashboard management hook
 * Handles company/dashboard state and CRUD operations
 */
export function useDashboardManagement(
  workspace: WorkspaceSnapshot | null = null
) {
  const [currentCompany, setCurrentCompany] =
    useState<CompanyWithDashboards | null>(null);
  const [currentDashboard, setCurrentDashboard] = useState<Dashboard | null>(
    null
  );
  const [companies, setCompanies] = useState<CompanyWithDashboards[]>([]);

  // Load companies on mount
  const refreshCompanies = useCallback(() => {
    const loaded = loadCompaniesWithDashboards();
    setCompanies(loaded);
    return loaded;
  }, []);

  // Initialize from workspace or discover available workspaces
  useEffect(() => {
    if (workspace) {
      // Convert provided workspace to company
      const company = getOrCreateCompanyFromWorkspace(workspace);
      if (company) {
        setCurrentCompany(company);

        // Get active dashboard or first dashboard
        const activeDash = getActiveDashboard(company.id);
        if (activeDash) {
          setCurrentDashboard(activeDash);
        }
      }
    } else {
      // No workspace provided - try to discover available workspaces
      discoverAndConvertWorkspaces();
    }
  }, [workspace, currentCompany]);

  // Function to discover and convert workspaces
  const discoverAndConvertWorkspaces = useCallback(() => {
    const storedWorkspaces = listStoredWorkspaces();

    // Only convert workspaces that were created in the last 5 minutes
    // This prevents old workspaces from being converted after reset
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;

    for (const stored of storedWorkspaces) {
      const workspaceCreated = stored.snapshot.generatedAt
        ? new Date(stored.snapshot.generatedAt).getTime()
        : 0;

      // Only convert recent workspaces (last 5 minutes)
      if (workspaceCreated > fiveMinutesAgo) {
        const existingCompanies = loadCompaniesWithDashboards();
        const hasCompany = existingCompanies.some(
          (c) => c.id === stored.snapshot.sessionId
        );

        if (!hasCompany) {
          console.log(
            "🔄 Converting recent workspace to company:",
            stored.snapshot.sessionId,
            `(created: ${new Date(workspaceCreated).toLocaleTimeString()})`,
            `(name: ${stored.snapshot.company?.name})`
          );
          const company = getOrCreateCompanyFromWorkspace(stored.snapshot);
          if (company) {
            console.log("✅ Company created:", company.name, company.id);
            // Company was created, refresh the list
            refreshCompanies();
            break; // Only convert one at a time to avoid conflicts
          } else {
            console.log(
              "❌ Failed to create company for workspace:",
              stored.snapshot.sessionId
            );
          }
        } else {
          console.log(
            "⏭️ Skipping workspace (already has company):",
            stored.snapshot.sessionId
          );
        }
      }
    }

    // Load existing companies
    const loadedCompanies = refreshCompanies();

    // If we have companies but no current company set, set the first one
    if (loadedCompanies.length > 0 && !currentCompany) {
      const firstCompany = loadedCompanies[0];
      setCurrentCompany(firstCompany);

      // Get active dashboard or first dashboard
      const activeDash = getActiveDashboard(firstCompany.id);
      if (activeDash) {
        setCurrentDashboard(activeDash);
      }
    }
  }, [currentCompany, refreshCompanies]);

  // Monitor for generation tracking flags and new workspaces
  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkForNewWorkspace = () => {
      // Check if generation was initiated from home
      const generationInProgress = window.localStorage.getItem(
        "generation-in-progress"
      );
      const generationSource = window.localStorage.getItem("generation-source");

      if (
        generationInProgress === "true" &&
        generationSource === "HomeContainer"
      ) {
        console.log(
          "🎯 [GENERATION-TRACKING] Detected generation from HomeContainer"
        );

        // Look for recent workspaces
        const storedWorkspaces = listStoredWorkspaces();
        const recentWorkspaces = storedWorkspaces.filter((stored) => {
          const workspaceCreated = stored.snapshot.generatedAt
            ? new Date(stored.snapshot.generatedAt).getTime()
            : 0;
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
          return workspaceCreated > fiveMinutesAgo;
        });

        // Check if any recent workspace doesn't have a company yet
        const companies = loadCompaniesWithDashboards();
        const needsConversion = recentWorkspaces.some(
          (stored) => !companies.some((c) => c.id === stored.snapshot.sessionId)
        );

        if (needsConversion) {
          console.log(
            "🔄 Converting workspace from HomeContainer generation..."
          );
          discoverAndConvertWorkspaces();

          // Clear the flags once conversion is done
          window.localStorage.removeItem("generation-in-progress");
          window.localStorage.removeItem("generation-source");
          window.localStorage.removeItem("generation-timestamp");

          return; // Stop checking once we found and converted
        }
      }
    };

    // Check immediately and then every 1 second for up to 60 seconds
    checkForNewWorkspace();
    const interval = setInterval(checkForNewWorkspace, 1000);

    // Clear interval after 60 seconds
    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 60000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [discoverAndConvertWorkspaces]);

  // Create new dashboard
  const createDashboard = useCallback(
    (dashboardName: string, templateId?: string) => {
      if (!currentCompany) {
        throw new Error("No company selected");
      }

      const newDashboard = createDashboardInStore(
        currentCompany.id,
        dashboardName,
        templateId
      );

      // Reload company to get updated dashboards
      const reloadedCompany = getCompanyById(currentCompany.id);
      if (reloadedCompany) {
        setCurrentCompany(reloadedCompany);
        setCurrentDashboard(newDashboard);
      }

      refreshCompanies();
      return newDashboard;
    },
    [currentCompany, refreshCompanies]
  );

  // Update dashboard
  const updateDashboard = useCallback(
    (dashboardId: string, updates: Partial<Dashboard>) => {
      if (!currentCompany) {
        throw new Error("No company selected");
      }

      updateDashboardInStore(currentCompany.id, dashboardId, updates);

      // Reload company and dashboard
      const reloadedCompany = getCompanyById(currentCompany.id);
      if (reloadedCompany) {
        setCurrentCompany(reloadedCompany);

        const reloadedDashboard = reloadedCompany.dashboards.find(
          (d) => d.id === dashboardId
        );
        if (reloadedDashboard && currentDashboard?.id === dashboardId) {
          setCurrentDashboard(reloadedDashboard);
        }
      }

      refreshCompanies();
    },
    [currentCompany, currentDashboard?.id, refreshCompanies]
  );

  // Delete dashboard
  const deleteDashboard = useCallback(
    (dashboardId: string) => {
      if (!currentCompany) {
        throw new Error("No company selected");
      }

      deleteDashboardInStore(currentCompany.id, dashboardId);

      // Reload company
      const reloadedCompany = getCompanyById(currentCompany.id);
      if (reloadedCompany) {
        setCurrentCompany(reloadedCompany);

        // If deleted dashboard was current, switch to first available
        if (currentDashboard?.id === dashboardId) {
          const firstDashboard = reloadedCompany.dashboards[0] || null;
          setCurrentDashboard(firstDashboard);
        }
      }

      refreshCompanies();
    },
    [currentCompany, currentDashboard?.id, refreshCompanies]
  );

  // Set active dashboard
  const setActiveDashboard = useCallback(
    (dashboardId: string) => {
      if (!currentCompany) {
        throw new Error("No company selected");
      }

      setActiveDashboardInStore(currentCompany.id, dashboardId);

      // Reload company and set dashboard
      const reloadedCompany = getCompanyById(currentCompany.id);
      if (reloadedCompany) {
        setCurrentCompany(reloadedCompany);

        const dashboard = reloadedCompany.dashboards.find(
          (d) => d.id === dashboardId
        );
        if (dashboard) {
          setCurrentDashboard(dashboard);
        }
      }

      refreshCompanies();
    },
    [currentCompany, refreshCompanies]
  );

  // Switch company
  const switchCompany = useCallback((companyId: string) => {
    const company = getCompanyById(companyId);
    if (company) {
      setCurrentCompany(company);

      const activeDash = getActiveDashboard(company.id);
      setCurrentDashboard(activeDash);
    }
  }, []);

  return {
    // State
    currentCompany,
    currentDashboard,
    companies,

    // Actions
    createDashboard,
    updateDashboard,
    deleteDashboard,
    setActiveDashboard,
    switchCompany,
    refreshCompanies,

    // Direct setters (for advanced use cases)
    setCurrentCompany,
    setCurrentDashboard,
  };
}
