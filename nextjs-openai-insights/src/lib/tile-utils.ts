import type { Tile } from "./types";

/**
 * Validates if a tile object has all required properties
 */
export function isValidTile(tile: any): tile is Tile {
  if (!tile || typeof tile !== 'object') {
    return false;
  }

  // Required properties
  if (!tile.id || typeof tile.id !== 'string') {
    return false;
  }

  if (typeof tile.orderIndex !== 'number') {
    return false;
  }

  // Optional but should exist
  if (tile.title === undefined) {
    return false;
  }

  return true;
}

/**
 * Filters an array of tiles to only include valid ones
 */
export function filterValidTiles(tiles: any[]): Tile[] {
  if (!Array.isArray(tiles)) {
    console.warn('[filterValidTiles] Input is not an array:', tiles);
    return [];
  }

  const validTiles = tiles.filter(isValidTile);
  
  const invalidCount = tiles.length - validTiles.length;
  if (invalidCount > 0) {
    console.warn(`[filterValidTiles] Filtered out ${invalidCount} invalid tiles`);
  }

  return validTiles;
}

/**
 * Safely sorts tiles by orderIndex
 */
export function sortTilesByOrder(tiles: Tile[]): Tile[] {
  return filterValidTiles(tiles).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
}

/**
 * Ensures a tile has all required properties with defaults
 */
export function normalizeTile(tile: Partial<Tile>, index: number = 0): Tile {
  return {
    id: tile.id ?? `tile_${Date.now()}_${index}`,
    title: tile.title ?? 'Untitled',
    content: tile.content ?? '',
    prompt: tile.prompt ?? '',
    templateId: tile.templateId ?? 'unknown',
    model: tile.model ?? 'gpt-5-nano',
    orderIndex: tile.orderIndex ?? index,
    createdAt: tile.createdAt ?? new Date().toISOString(),
    updatedAt: tile.updatedAt ?? new Date().toISOString(),
    attempts: tile.attempts ?? 1,
    ...tile,
  } as Tile;
}
