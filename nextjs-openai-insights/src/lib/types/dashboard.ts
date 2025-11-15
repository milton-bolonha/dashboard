import type { Tile, Note, Contact } from "@/lib/types";
import type { WorkspaceAppearance } from "@/lib/types";

/**
 * Dashboard represents a view/configuration within a Company
 * Each dashboard has its own tiles, notes, contacts, and assets
 */
export interface Dashboard {
  id: string;
  name: string;
  companyId: string; // Reference to the company this dashboard belongs to
  templateId?: string; // Template used to create this dashboard (if any)
  tiles: Tile[];
  notes: Note[]; // Notes isolated per dashboard
  contacts: Contact[]; // Contacts isolated per dashboard
  appearance?: WorkspaceAppearance;
  contrastMode?: boolean; // Persistent contrast mode preference
  createdAt: string;
  updatedAt: string;
  isActive?: boolean; // Currently active dashboard
}

/**
 * Company with multiple dashboards
 */
export interface CompanyWithDashboards {
  id: string;
  name: string;
  website?: string;
  dashboards: Dashboard[]; // Multiple dashboards per company
  createdAt: string;
  updatedAt: string;
}

