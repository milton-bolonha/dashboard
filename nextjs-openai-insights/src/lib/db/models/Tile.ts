import type { Document } from "mongodb";
import type { Tile } from "@/lib/types";

/**
 * Tile model for MongoDB (standalone collection)
 * Used when tiles are stored separately from dashboards
 * Best practice: Extends Document for MongoDB compatibility
 */
export interface TileDocument extends Document, Omit<Tile, "createdAt" | "updatedAt"> {
  _id?: string;
  dashboardId: string; // Reference to dashboard
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert Tile to TileDocument
 * Best practice: Validate input before conversion
 */
export function tileToDocument(
  tile: Tile,
  dashboardId: string
): Omit<TileDocument, "_id" | "createdAt" | "updatedAt"> {
  if (!tile || !tile.id) {
    throw new Error("Invalid tile: missing id");
  }
  if (!dashboardId) {
    throw new Error("Invalid dashboardId: cannot be empty");
  }

  return {
    ...tile,
    dashboardId,
  };
}

/**
 * Convert TileDocument to Tile
 * Best practice: Validate and handle Date conversion safely
 */
export function tileDocumentToTile(doc: TileDocument): Tile {
  if (!doc || !doc.id) {
    throw new Error("Invalid TileDocument: missing id");
  }

  return {
    ...doc,
    createdAt:
      doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : new Date(doc.createdAt).toISOString(),
    updatedAt:
      doc.updatedAt instanceof Date
        ? doc.updatedAt.toISOString()
        : new Date(doc.updatedAt).toISOString(),
  };
}

