import type { Tile, TileChatAttachment } from "@/lib/types";

/**
 * Service for tile API operations
 * Pure functions without React dependencies
 */

export interface TileChatPayload {
  message: string;
  attachments?: TileChatAttachment[];
}

export interface TileServiceError extends Error {
  status?: number;
  data?: unknown;
}

/**
 * Delete a tile
 */
export async function deleteTile(tileId: string): Promise<void> {
  const response = await fetch(`/api/workspace/tiles/${tileId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error: TileServiceError = new Error("Failed to remove tile");
    error.status = response.status;
    
    if (response.status === 404) {
      error.message = "Session expired";
    }
    
    throw error;
  }
}

/**
 * Regenerate a tile
 */
export async function regenerateTile(tileId: string): Promise<Tile> {
  const response = await fetch(`/api/workspace/tiles/${tileId}/regenerate`, {
    method: "POST",
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error: TileServiceError = new Error(
      (payload.error as string) ?? "We couldn't regenerate this insight right now."
    );
    error.status = response.status;
    error.data = payload;
    throw error;
  }

  const data = await response.json();
  return data.tile as Tile;
}

/**
 * Chat with a tile (follow-up question)
 */
export async function chatWithTile(
  tileId: string,
  payload: TileChatPayload
): Promise<Tile> {
  const response = await fetch(`/api/workspace/tiles/${tileId}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: payload.message,
      attachments: payload.attachments ?? [],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const error: TileServiceError = new Error(
      errorData.error ?? "Failed to generate follow-up insight"
    );
    error.status = response.status;
    error.data = errorData;
    
    if (response.status === 404) {
      error.message = "Session expired";
    }
    
    throw error;
  }

  const responseData = await response.json();
  return responseData.tile as Tile;
}

/**
 * Reorder tiles
 */
export async function reorderTiles(order: string[]): Promise<void> {
  const response = await fetch("/api/workspace/reorder", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ order }),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    const error: TileServiceError = new Error(
      data.error ?? "Failed to persist tile order"
    );
    error.status = response.status;
    error.data = data;
    
    if (response.status === 404) {
      error.message = "Session expired";
    }
    
    throw error;
  }
}
