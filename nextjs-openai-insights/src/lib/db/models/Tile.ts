import type { Tile } from "@/lib/types";

/**
 * Tile model for MongoDB (standalone collection)
 * Used when tiles are stored separately from dashboards
 */
export interface TileDocument extends Omit<Tile, "createdAt" | "updatedAt"> {
  _id?: string;
  dashboardId: string; // Reference to dashboard
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Convert Tile to TileDocument
 */
export function tileToDocument(
  tile: Tile,
  dashboardId: string
): Omit<TileDocument, "_id" | "createdAt" | "updatedAt"> {
  return {
    ...tile,
    dashboardId,
  };
}

/**
 * Convert TileDocument to Tile
 */
export function tileDocumentToTile(doc: TileDocument): Tile {
  return {
    ...doc,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };
}

