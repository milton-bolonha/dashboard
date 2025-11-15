import type { Dashboard, WorkspaceAppearance } from "@/lib/types/dashboard";
import type { Tile, Note, Contact } from "@/lib/types";

/**
 * Dashboard model for MongoDB
 * Maps to Dashboard interface but with MongoDB-specific fields
 */
export interface DashboardDocument {
  _id?: string;
  id: string; // Dashboard ID (same as in Dashboard interface)
  name: string;
  companyId: string; // Reference to company/workspace
  templateId?: string;
  tiles: TileDocument[];
  notes: NoteDocument[];
  contacts: ContactDocument[];
  appearance?: WorkspaceAppearance;
  contrastMode?: boolean;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
}

/**
 * Tile document (embedded in Dashboard)
 */
export interface TileDocument extends Omit<Tile, "createdAt" | "updatedAt"> {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Note document (embedded in Dashboard)
 */
export interface NoteDocument extends Omit<Note, "createdAt" | "updatedAt"> {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Contact document (embedded in Dashboard)
 */
export interface ContactDocument extends Omit<Contact, "createdAt"> {
  createdAt: Date;
}

/**
 * Convert Dashboard to DashboardDocument
 */
export function dashboardToDocument(
  dashboard: Dashboard
): Omit<DashboardDocument, "_id" | "createdAt" | "updatedAt"> {
  return {
    id: dashboard.id,
    name: dashboard.name,
    companyId: dashboard.companyId,
    templateId: dashboard.templateId,
    tiles: dashboard.tiles.map((tile) => ({
      ...tile,
      createdAt: new Date(tile.createdAt),
      updatedAt: new Date(tile.updatedAt),
    })) as TileDocument[],
    notes: dashboard.notes.map((note) => ({
      ...note,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
    })) as NoteDocument[],
    contacts: dashboard.contacts.map((contact) => ({
      ...contact,
      createdAt: new Date(contact.createdAt),
    })) as ContactDocument[],
    appearance: dashboard.appearance,
    contrastMode: dashboard.contrastMode,
    isActive: dashboard.isActive,
  };
}

/**
 * Convert DashboardDocument to Dashboard
 */
export function dashboardDocumentToDashboard(
  doc: DashboardDocument
): Dashboard {
  return {
    id: doc.id,
    name: doc.name,
    companyId: doc.companyId,
    templateId: doc.templateId,
    tiles: doc.tiles.map((tile) => ({
      ...tile,
      createdAt: tile.createdAt.toISOString(),
      updatedAt: tile.updatedAt.toISOString(),
    })),
    notes: doc.notes.map((note) => ({
      ...note,
      createdAt: note.createdAt.toISOString(),
      updatedAt: note.updatedAt.toISOString(),
    })),
    contacts: doc.contacts.map((contact) => ({
      ...contact,
      createdAt: contact.createdAt.toISOString(),
    })),
    appearance: doc.appearance,
    contrastMode: doc.contrastMode,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    isActive: doc.isActive,
  };
}

