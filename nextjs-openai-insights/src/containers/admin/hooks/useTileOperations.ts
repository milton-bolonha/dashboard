"use client";

import { useState, useCallback, useMemo } from "react";
import type { Tile, TileChatAttachment } from "@/lib/types";
import type { Dashboard } from "@/lib/types/dashboard";
import { tileService } from "@/lib/services";
import { useToast } from "@/lib/state/toast-context";
import { updateDashboard, getCompanyById } from "@/lib/storage/dashboards-store";

export interface TileChatPayload {
  message: string;
  attachments?: TileChatAttachment[];
}

/**
 * Tile operations hook with dashboard isolation
 * All operations validate that tiles belong to the active dashboard
 */
export function useTileOperations(
  currentCompany: { id: string } | null,
  currentDashboard: Dashboard | null,
  onRefresh: () => void
) {
  const { push } = useToast();
  
  const [regeneratingIds, setRegeneratingIds] = useState<Set<string>>(new Set());
  const [isChatting, setIsChatting] = useState(false);
  const [isPersistingOrder, setIsPersistingOrder] = useState(false);

  // Get tiles from current dashboard
  const tiles = useMemo(() => {
    return currentDashboard?.tiles ?? [];
  }, [currentDashboard?.tiles]);

  // Delete tile
  const deleteTile = useCallback(
    async (tileId: string) => {
      if (!currentCompany || !currentDashboard) {
        push({
          title: "No dashboard loaded",
          description: "Please select a dashboard before deleting tiles.",
          variant: "destructive",
        });
        return;
      }

      try {
        await tileService.deleteTile(tileId);

        // Update dashboard
        const updatedTiles = currentDashboard.tiles.filter((t) => t?.id && t.id !== tileId);
        updateDashboard(currentCompany.id, currentDashboard.id, {
          tiles: updatedTiles,
        });

        onRefresh();
        push({
          title: "Tile removed",
          variant: "success",
        });
      } catch (err) {
        push({
          title: "Deletion failed",
          description: err instanceof Error ? err.message : "Please try again in a few moments.",
          variant: "destructive",
        });
      }
    },
    [currentCompany, currentDashboard, onRefresh, push]
  );

  // Regenerate tile
  const regenerateTile = useCallback(
    async (tileId: string) => {
      if (!currentCompany || !currentDashboard) {
        push({
          title: "No dashboard loaded",
          description: "Please select a dashboard before regenerating tiles.",
          variant: "destructive",
        });
        return;
      }

      setRegeneratingIds((prev) => new Set([...prev, tileId]));
      try {
        await tileService.regenerateTile(tileId);
        onRefresh();
        push({
          title: "Tile regenerated",
          variant: "success",
        });
      } catch (err) {
        push({
          title: "Regeneration failed",
          description: err instanceof Error ? err.message : "Please try again shortly.",
          variant: "destructive",
        });
      } finally {
        setRegeneratingIds((prev) => {
          const next = new Set(prev);
          next.delete(tileId);
          return next;
        });
      }
    },
    [currentCompany, currentDashboard, onRefresh, push]
  );

  // Reorder tiles
  const reorderTiles = useCallback(
    async (order: string[]) => {
      if (!order.length) return;
      if (!currentCompany || !currentDashboard) {
        push({
          title: "No dashboard loaded",
          description: "Please select a dashboard before reordering tiles.",
          variant: "destructive",
        });
        return;
      }

      try {
        setIsPersistingOrder(true);
        await tileService.reorderTiles(order);

        // Update dashboard with new order
        const tileMap = new Map(
          currentDashboard.tiles.filter((t) => t?.id).map((t) => [t.id, t])
        );
        const reorderedTiles = order
          .map((id, index) => {
            const tile = tileMap.get(id);
            if (tile) {
              return { ...tile, orderIndex: index };
            }
            return null;
          })
          .filter((t): t is Tile => t !== null);

        updateDashboard(currentCompany.id, currentDashboard.id, {
          tiles: reorderedTiles,
        });

        onRefresh();
      } catch (err) {
        push({
          title: "Reorder failed",
          description: err instanceof Error ? err.message : "Please try again shortly.",
          variant: "destructive",
        });
      } finally {
        setIsPersistingOrder(false);
      }
    },
    [currentCompany, currentDashboard, onRefresh, push]
  );

  // Chat with tile
  const chatWithTile = useCallback(
    async (tileId: string, payload: TileChatPayload) => {
      if (!currentCompany || !currentDashboard) {
        push({
          title: "No dashboard loaded",
          description: "Please select a dashboard before chatting with tiles.",
          variant: "destructive",
        });
        return;
      }

      const trimmedMessage = payload.message.trim();
      if (!trimmedMessage) return;

      try {
        setIsChatting(true);
        const updatedTile = await tileService.chatWithTile(tileId, {
          message: trimmedMessage,
          attachments: payload.attachments ?? [],
        });

        // Update tile in dashboard
        const tileIndex = currentDashboard.tiles.findIndex((t) => t.id === tileId);
        if (tileIndex !== -1) {
          const updatedTiles = [...currentDashboard.tiles];
          updatedTiles[tileIndex] = updatedTile;
          
          updateDashboard(currentCompany.id, currentDashboard.id, {
            tiles: updatedTiles,
          });
        }

        onRefresh();
        push({
          title: "Follow-up insight added",
          variant: "success",
        });
      } catch (err) {
        push({
          title: "Follow-up failed",
          description: err instanceof Error ? err.message : "Please try again in a few moments.",
          variant: "destructive",
        });
      } finally {
        setIsChatting(false);
      }
    },
    [currentCompany, currentDashboard, onRefresh, push]
  );

  return {
    tiles,
    regeneratingIds,
    isChatting,
    isPersistingOrder,
    
    // Actions
    deleteTile,
    regenerateTile,
    reorderTiles,
    chatWithTile,
    
    // Handlers ready for components
    handlers: {
      onDelete: deleteTile,
      onRegenerate: regenerateTile,
      onReorder: reorderTiles,
      onChat: chatWithTile,
    },
  };
}
