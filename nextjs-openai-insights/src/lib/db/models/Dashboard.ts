import type { Document } from "mongodb";
import type { Dashboard } from "@/lib/types/dashboard";
import type { Tile, Note, Contact, WorkspaceAppearance } from "@/lib/types";

/**
 * Dashboard model for MongoDB
 * Maps to Dashboard interface but with MongoDB-specific fields
 * Best practice: Extends Document for MongoDB compatibility
 */
export interface DashboardDocument extends Document {
  _id?: string;
  id: string; // Dashboard ID (same as in Dashboard interface)
  name: string;
  companyId: string; // Reference to company/workspace
  userId: string; // Clerk user ID (required for security isolation)
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
 * Best practice: Validate input and handle date conversions safely
 */
export function dashboardToDocument(
  dashboard: Dashboard
): Omit<DashboardDocument, "_id" | "createdAt" | "updatedAt"> {
  if (!dashboard || !dashboard.id) {
    throw new Error("Invalid dashboard: missing id");
  }
  if (!dashboard.companyId) {
    throw new Error("Invalid dashboard: missing companyId");
  }

  return {
    id: dashboard.id,
    name: dashboard.name || "Unnamed Dashboard",
    companyId: dashboard.companyId,
    templateId: dashboard.templateId,
    tiles: (dashboard.tiles || []).map((tile) => ({
      ...tile,
      createdAt: new Date(tile.createdAt),
      updatedAt: new Date(tile.updatedAt),
    })) as TileDocument[],
    notes: (dashboard.notes || []).map((note) => ({
      ...note,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
    })) as NoteDocument[],
    contacts: (dashboard.contacts || []).map((contact) => ({
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
 * Best practice: Validate input and handle Date conversion safely
 */
export function dashboardDocumentToDashboard(
  doc: DashboardDocument
): Dashboard {
  if (!doc || !doc.id) {
    throw new Error("Invalid DashboardDocument: missing id");
  }
  if (!doc.companyId) {
    throw new Error("Invalid DashboardDocument: missing companyId");
  }

  const toISOString = (date: Date | string): string => {
    if (date instanceof Date) {
      return date.toISOString();
    }
    return new Date(date).toISOString();
  };

  return {
    id: doc.id,
    name: doc.name,
    companyId: doc.companyId,
    templateId: doc.templateId,
    tiles: (doc.tiles || []).map((tile) => ({
      ...tile,
      createdAt: toISOString(tile.createdAt),
      updatedAt: toISOString(tile.updatedAt),
    })),
    notes: (doc.notes || []).map((note) => ({
      ...note,
      createdAt: toISOString(note.createdAt),
      updatedAt: toISOString(note.updatedAt),
    })),
    contacts: (doc.contacts || []).map((contact) => ({
      ...contact,
      createdAt: toISOString(contact.createdAt),
    })),
    appearance: doc.appearance,
    contrastMode: doc.contrastMode,
    createdAt: toISOString(doc.createdAt),
    updatedAt: toISOString(doc.updatedAt),
    isActive: doc.isActive,
  };
}

