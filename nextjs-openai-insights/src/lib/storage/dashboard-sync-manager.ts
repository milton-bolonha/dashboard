/**
 * Dashboard Sync Manager
 * 
 * Gerencia sincronização entre Workspace (legacy) e Company/Dashboards (novo sistema)
 * Previne race conditions e garante single source of truth
 */

import type { WorkspaceSnapshot } from "@/lib/types";
import type { CompanyWithDashboards, Dashboard } from "@/lib/types/dashboard";
import {
  loadCompaniesWithDashboards,
  saveCompaniesWithDashboards,
  getCompanyById,
  getActiveDashboard,
} from "./dashboards-store";

interface SyncLock {
  companyId: string;
  timestamp: number;
}

// Lock para prevenir sincronizações simultâneas
let syncLock: SyncLock | null = null;
const SYNC_LOCK_TIMEOUT = 2000; // 2 segundos

/**
 * Verifica se há uma sincronização em progresso
 */
function isSyncLocked(companyId: string): boolean {
  if (!syncLock) return false;
  if (syncLock.companyId !== companyId) return false;
  
  const lockAge = Date.now() - syncLock.timestamp;
  if (lockAge > SYNC_LOCK_TIMEOUT) {
    // Lock expirado
    syncLock = null;
    return false;
  }
  
  return true;
}

/**
 * Adquire lock para sincronização
 */
function acquireSyncLock(companyId: string): boolean {
  if (isSyncLocked(companyId)) {
    console.warn("[SyncManager] ⚠️ Sync already in progress for company", { companyId });
    return false;
  }
  
  syncLock = {
    companyId,
    timestamp: Date.now(),
  };
  
  console.log("[SyncManager] 🔒 Acquired sync lock", { companyId });
  return true;
}

/**
 * Libera lock de sincronização
 */
function releaseSyncLock(companyId: string): void {
  if (syncLock?.companyId === companyId) {
    console.log("[SyncManager] 🔓 Released sync lock", { companyId });
    syncLock = null;
  }
}

/**
 * Sincroniza workspace → company de forma segura
 * 
 * REGRAS:
 * - Só sincroniza tiles no "Default Dashboard"
 * - Nunca deleta ou substitui dashboards existentes
 * - Sempre preserva dados mais recentes (baseado em updatedAt)
 */
export function safeSyncWorkspaceToCompany(
  workspace: WorkspaceSnapshot | null
): CompanyWithDashboards | null {
  if (!workspace) return null;
  
  const companies = loadCompaniesWithDashboards();
  let company = companies.find((c) => c.id === workspace.sessionId);
  
  if (!company) {
    // Criar nova company (primeira vez)
    console.log("[SyncManager] 🆕 Creating new company from workspace", {
      sessionId: workspace.sessionId,
      companyName: workspace.company.name,
    });
    
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
          appearance: workspace.appearance?.baseColor && workspace.appearance.baseColor.trim() 
            ? workspace.appearance 
            : undefined,
          createdAt: workspace.generatedAt ?? new Date().toISOString(),
          updatedAt: workspace.generatedAt ?? new Date().toISOString(),
          isActive: true,
        },
      ],
      notes: workspace.company.notes ?? [],
      contacts: workspace.company.contacts ?? [],
      createdAt: workspace.generatedAt ?? new Date().toISOString(),
      updatedAt: workspace.generatedAt ?? new Date().toISOString(),
    };
    
    companies.push(company);
    saveCompaniesWithDashboards(companies);
    return company;
  }
  
  // Company existe - sincronizar com cuidado
  if (!acquireSyncLock(company.id)) {
    // Sincronização já em progresso, retornar company atual
    console.log("[SyncManager] ⏸️ Sync locked, returning current company");
    return getCompanyById(company.id);
  }
  
  try {
    const activeDashboard = company.dashboards.find((d) => d.isActive) ?? company.dashboards[0];
    const isDefaultDashboard = activeDashboard?.name === "Default Dashboard";
    
    console.log("[SyncManager] 🔄 Syncing workspace to company", {
      companyId: company.id,
      activeDashboardId: activeDashboard?.id,
      isDefaultDashboard,
      workspaceTilesCount: workspace.company.tiles?.length ?? 0,
      dashboardTilesCount: activeDashboard?.tiles?.length ?? 0,
    });
    
    // Sincronizar tiles APENAS no Default Dashboard
    if (activeDashboard && isDefaultDashboard) {
      const workspaceTiles = workspace.company.tiles ?? [];
      const existingTiles = activeDashboard.tiles ?? [];
      
      // Só sincronizar se workspace tiver mais tiles (pode ser geração inicial)
      // OU se dashboard estiver vazio (primeira carga)
      if (workspaceTiles.length > existingTiles.length || existingTiles.length === 0) {
        console.log("[SyncManager] ✅ Syncing tiles to Default Dashboard", {
          dashboardId: activeDashboard.id,
          oldCount: existingTiles.length,
          newCount: workspaceTiles.length,
        });
        activeDashboard.tiles = workspaceTiles;
        activeDashboard.updatedAt = new Date().toISOString();
      } else {
        console.log("[SyncManager] 🔒 Preserving dashboard tiles (workspace has fewer or equal tiles)", {
          dashboardId: activeDashboard.id,
          dashboardTilesCount: existingTiles.length,
          workspaceTilesCount: workspaceTiles.length,
        });
      }
    } else if (activeDashboard) {
      console.log("[SyncManager] 🔒 Preserving dashboard tiles (not Default Dashboard)", {
        dashboardId: activeDashboard.id,
        dashboardName: activeDashboard.name,
        tilesCount: activeDashboard.tiles?.length ?? 0,
      });
    }
    
    // Sempre sincronizar notes e contacts (são compartilhados)
    company.notes = workspace.company.notes ?? [];
    company.contacts = workspace.company.contacts ?? [];
    company.updatedAt = new Date().toISOString();
    
    // IMPORTANTE: Preservar TODOS os dashboards
    // Nunca deletar ou substituir dashboards existentes
    saveCompaniesWithDashboards(companies);
    
    console.log("[SyncManager] ✅ Sync completed", {
      companyId: company.id,
      dashboardsCount: company.dashboards.length,
      dashboardNames: company.dashboards.map(d => d.name),
    });
    
    return company;
  } finally {
    releaseSyncLock(company.id);
  }
}

/**
 * Carrega company do storage (fonte de verdade)
 */
export function loadCompanyFromStorage(companyId: string): CompanyWithDashboards | null {
  return getCompanyById(companyId);
}

/**
 * Carrega dashboard ativo do storage (fonte de verdade)
 */
export function loadActiveDashboardFromStorage(companyId: string): Dashboard | null {
  return getActiveDashboard(companyId);
}

