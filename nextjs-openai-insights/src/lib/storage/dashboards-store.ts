"use client";

import type { Dashboard, CompanyWithDashboards } from "@/lib/types/dashboard";
import type { WorkspaceSnapshot, Tile } from "@/lib/types";

// Re-export types for convenience
export type { Dashboard, CompanyWithDashboards };

const DASHBOARDS_STORAGE_KEY = "insights_dashboards";
const ACTIVE_DASHBOARD_KEY = "insights_active_dashboard";

function isBrowser() {
  return typeof window !== "undefined" && typeof localStorage !== "undefined";
}

/**
 * Load all companies with their dashboards
 */
export function loadCompaniesWithDashboards(): CompanyWithDashboards[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(DASHBOARDS_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as CompanyWithDashboards[]) : [];
  } catch {
    return [];
  }
}

/**
 * Save companies with dashboards
 */
export function saveCompaniesWithDashboards(companies: CompanyWithDashboards[]) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(DASHBOARDS_STORAGE_KEY, JSON.stringify(companies));
  } catch {
    // Ignore quota errors
  }
}

/**
 * Get company by ID
 */
export function getCompanyById(companyId: string): CompanyWithDashboards | null {
  const companies = loadCompaniesWithDashboards();
  return companies.find((c) => c.id === companyId) ?? null;
}

/**
 * Get or create company from workspace snapshot
 * Migrates existing workspace to new structure
 */
export function getOrCreateCompanyFromWorkspace(workspace: WorkspaceSnapshot | null): CompanyWithDashboards | null {
  if (!workspace) return null;
  
  const companies = loadCompaniesWithDashboards();
  
  // Try to find existing company by sessionId (for migration)
  let company = companies.find((c) => c.id === workspace.sessionId);
  
  if (!company) {
    // Create new company from workspace
    company = {
      id: workspace.sessionId,
      name: workspace.company.name,
      website: workspace.company.website,
      dashboards: [
        {
          id: `dashboard_${workspace.sessionId}_default`,
          name: "Default Dashboard",
          companyId: workspace.sessionId,
          templateId: workspace.promptSettings?.templateId,
          tiles: workspace.company.tiles ?? [],
          notes: workspace.company.notes ?? [],
          contacts: workspace.company.contacts ?? [],
          // Only set appearance if workspace has a valid baseColor
          appearance: workspace.appearance?.baseColor && workspace.appearance.baseColor.trim() 
            ? workspace.appearance 
            : undefined,
          createdAt: workspace.generatedAt ?? new Date().toISOString(),
          updatedAt: workspace.generatedAt ?? new Date().toISOString(),
          isActive: true,
        },
      ],
      createdAt: workspace.generatedAt ?? new Date().toISOString(),
      updatedAt: workspace.generatedAt ?? new Date().toISOString(),
    };
    
    companies.push(company);
    saveCompaniesWithDashboards(companies);
  } else {
    // Update existing company with latest workspace data (sync tiles from active dashboard)
    // IMPORTANTE: Preservar TODOS os dashboards - nunca deletar ou substituir
    const activeDashboard = company.dashboards.find((d) => d.isActive) ?? company.dashboards[0];
    
    console.log("[DataSync] 🔍 Syncing workspace to existing company", {
      companyId: company.id,
      dashboardsCount: company.dashboards.length,
      dashboardNames: company.dashboards.map(d => d.name),
      activeDashboardId: activeDashboard?.id,
      activeDashboardName: activeDashboard?.name,
    });
    
    if (activeDashboard) {
      const workspaceTiles = workspace.company.tiles ?? [];
      const existingTiles = activeDashboard.tiles ?? [];
      const isDefaultDashboard = activeDashboard.name === "Default Dashboard";
      
      console.log("[DataSync] 🔍 Checking if should sync tiles to dashboard", {
        dashboardId: activeDashboard.id,
        dashboardName: activeDashboard.name,
        existingTilesCount: existingTiles.length,
        workspaceTilesCount: workspaceTiles.length,
        isDefaultDashboard,
        shouldSync: isDefaultDashboard,
      });
      
      // ONLY sync tiles from workspace if dashboard is the "Default Dashboard"
      // Blank dashboards created by user should remain empty and NOT sync from workspace
      // IMPORTANTE: NUNCA sobrescrever tiles do dashboard se ele já tem tiles
      // Só sincronizar se dashboard estiver completamente vazio (primeira carga ou geração inicial)
      if (isDefaultDashboard) {
        // CRITICAL: Só sincronizar se dashboard está completamente vazio
        // Se dashboard já tem tiles, NUNCA sobrescrever (mesmo que workspace tenha mais)
        // Isso previne perda de dados quando usuário cria tiles individuais
        const shouldSyncTiles = existingTiles.length === 0;
        
        if (shouldSyncTiles) {
          console.log("[DataSync] ✅ Syncing tiles to Default Dashboard (dashboard is empty)", {
            dashboardId: activeDashboard.id,
            oldTilesCount: existingTiles.length,
            newTilesCount: workspaceTiles.length,
          });
          activeDashboard.tiles = workspaceTiles;
          activeDashboard.updatedAt = new Date().toISOString();
        } else {
          console.log("[DataSync] 🔒 Preserving dashboard tiles (dashboard already has tiles)", {
            dashboardId: activeDashboard.id,
            dashboardTilesCount: existingTiles.length,
            workspaceTilesCount: workspaceTiles.length,
            reason: "Dashboard has tiles - NEVER overwrite user's data",
          });
          // IMPORTANTE: Mesclar tiles do workspace com dashboard ao invés de sobrescrever
          // Isso garante que tiles criados individualmente não sejam perdidos
          const dashboardTileIds = new Set(existingTiles.map(t => t.id));
          
          // Encontrar tiles do workspace que não estão no dashboard
          const missingTiles = workspaceTiles.filter(t => !dashboardTileIds.has(t.id));
          
          if (missingTiles.length > 0) {
            console.log("[DataSync] 🔄 Merging missing tiles from workspace", {
              missingTilesCount: missingTiles.length,
              missingTileIds: missingTiles.map(t => t.id),
            });
            // Adicionar tiles faltantes ao dashboard (não sobrescrever)
            // Ordenar por orderIndex após mesclar
            const mergedTiles = [...existingTiles, ...missingTiles].sort((a, b) => {
              const aIndex = a.orderIndex ?? 0;
              const bIndex = b.orderIndex ?? 0;
              return aIndex - bIndex;
            });
            activeDashboard.tiles = mergedTiles;
            activeDashboard.updatedAt = new Date().toISOString();
            
            console.log("[DataSync] ✅ Merged tiles successfully", {
              dashboardId: activeDashboard.id,
              finalTilesCount: mergedTiles.length,
              finalTileIds: mergedTiles.map(t => ({ id: t.id, orderIndex: t.orderIndex })),
            });
          } else {
            console.log("[DataSync] ✅ Dashboard already has all workspace tiles", {
              dashboardId: activeDashboard.id,
              tilesCount: existingTiles.length,
            });
          }
        }
      } else {
        console.log("[DataSync] 🔒 Preserving dashboard tiles (not Default Dashboard)", {
          dashboardId: activeDashboard.id,
          dashboardName: activeDashboard.name,
          existingTilesCount: existingTiles.length,
          workspaceTilesCount: workspaceTiles.length,
          reason: "Not Default Dashboard - blank dashboards should stay empty",
        });
      }
    }
    
    // Always sync notes and contacts (they are shared at company level)
    // Sync notes and contacts to active dashboard (not company level)
    if (activeDashboard) {
      // Only sync if dashboard is empty (first load)
      if (!activeDashboard.notes || activeDashboard.notes.length === 0) {
        activeDashboard.notes = workspace.company.notes ?? [];
      }
      if (!activeDashboard.contacts || activeDashboard.contacts.length === 0) {
        activeDashboard.contacts = workspace.company.contacts ?? [];
      }
      activeDashboard.updatedAt = new Date().toISOString();
    }
    
    company.updatedAt = new Date().toISOString();
    
    // IMPORTANTE: Preservar TODOS os dashboards - nunca deletar ou substituir
    // O array de dashboards deve permanecer intacto
    saveCompaniesWithDashboards(companies);
    
    console.log("[DataSync] ✅ Sync completed - dashboards preserved", {
      companyId: company.id,
      dashboardsCount: company.dashboards.length,
      dashboardNames: company.dashboards.map(d => d.name),
    });
  }
  
  return company;
}

/**
 * Create a new dashboard for a company
 */
export function createDashboard(
  companyId: string,
  dashboardName: string,
  templateId?: string
): Dashboard {
  const companies = loadCompaniesWithDashboards();
  const company = companies.find((c) => c.id === companyId);
  
  if (!company) {
    throw new Error(`Company ${companyId} not found`);
  }
  
  const newDashboard: Dashboard = {
    id: `dashboard_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    name: dashboardName,
    companyId,
    templateId: templateId || undefined, // Explicitly set to undefined if not provided (blank dashboard)
    tiles: [],
    notes: [], // Notes isolated per dashboard
    contacts: [], // Contacts isolated per dashboard
    // Don't inherit appearance from other dashboards - new dashboard starts with default/no appearance
    appearance: undefined,
    contrastMode: false, // Default contrast mode
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive: false,
  };
  
  console.log("[createDashboard] ✅ Dashboard created", {
    dashboardId: newDashboard.id,
    dashboardName: newDashboard.name,
    templateId: newDashboard.templateId,
    isBlank: !newDashboard.templateId,
    tilesCount: newDashboard.tiles.length,
  });
  
  // Set all other dashboards as inactive
  company.dashboards.forEach((d) => {
    d.isActive = false;
  });
  newDashboard.isActive = true;
  
  company.dashboards.push(newDashboard);
  company.updatedAt = new Date().toISOString();
  
  saveCompaniesWithDashboards(companies);
  setActiveDashboard(companyId, newDashboard.id);
  
  return newDashboard;
}

/**
 * Get active dashboard for a company
 */
export function getActiveDashboard(companyId: string): Dashboard | null {
  const company = getCompanyById(companyId);
  if (!company) return null;
  
  return company.dashboards.find((d) => d.isActive) ?? company.dashboards[0] ?? null;
}

/**
 * Set active dashboard
 */
export function setActiveDashboard(companyId: string, dashboardId: string) {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(ACTIVE_DASHBOARD_KEY, JSON.stringify({ companyId, dashboardId }));
  } catch {
    // Ignore errors
  }
  
  const companies = loadCompaniesWithDashboards();
  const company = companies.find((c) => c.id === companyId);
  if (!company) return;
  
  company.dashboards.forEach((d) => {
    d.isActive = d.id === dashboardId;
  });
  
  saveCompaniesWithDashboards(companies);
}

/**
 * Update dashboard
 */
export function updateDashboard(companyId: string, dashboardId: string, updates: Partial<Dashboard>) {
  const companies = loadCompaniesWithDashboards();
  const company = companies.find((c) => c.id === companyId);
  if (!company) {
    console.error("[updateDashboard] ❌ Company not found", { companyId });
    return;
  }
  
  const dashboardIndex = company.dashboards.findIndex((d) => d.id === dashboardId);
  if (dashboardIndex === -1) {
    console.error("[updateDashboard] ❌ Dashboard not found", { companyId, dashboardId });
    return;
  }
  
  const currentDashboard = company.dashboards[dashboardIndex];
  
  // Special handling for tiles array - merge instead of replace if needed
  const finalUpdates = { ...updates };
  if (updates.tiles && Array.isArray(updates.tiles)) {
    // If updating tiles, use the provided array directly (it should already include all tiles)
    console.log("[updateDashboard] 📊 Updating tiles", {
      dashboardId,
      oldTilesCount: currentDashboard.tiles?.length ?? 0,
      newTilesCount: updates.tiles.length,
      newTileIds: updates.tiles.map((t: Tile) => t.id),
    });
  }
  
  company.dashboards[dashboardIndex] = {
    ...currentDashboard,
    ...finalUpdates,
    updatedAt: new Date().toISOString(),
  };
  company.updatedAt = new Date().toISOString();
  
  saveCompaniesWithDashboards(companies);
  
  console.log("[updateDashboard] ✅ Dashboard updated", {
    dashboardId,
    tilesCount: company.dashboards[dashboardIndex].tiles?.length ?? 0,
  });
}

/**
 * Delete dashboard
 */
export function deleteDashboard(companyId: string, dashboardId: string) {
  const companies = loadCompaniesWithDashboards();
  const company = companies.find((c) => c.id === companyId);
  if (!company) return;
  
  company.dashboards = company.dashboards.filter((d) => d.id !== dashboardId);
  
  // If deleted dashboard was active, activate first remaining dashboard
  if (company.dashboards.length > 0 && !company.dashboards.some((d) => d.isActive)) {
    company.dashboards[0].isActive = true;
    setActiveDashboard(companyId, company.dashboards[0].id);
  }
  
  company.updatedAt = new Date().toISOString();
  saveCompaniesWithDashboards(companies);
}

/**
 * Convert workspace snapshot to company with dashboards (for migration)
 */
export function workspaceToCompany(workspace: WorkspaceSnapshot): CompanyWithDashboards {
  const company = getOrCreateCompanyFromWorkspace(workspace);
  if (!company) {
    throw new Error(`Failed to create company from workspace: ${workspace.sessionId}`);
  }
  return company;
}

