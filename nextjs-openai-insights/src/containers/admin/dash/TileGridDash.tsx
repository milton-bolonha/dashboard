import { TileBoard } from "@/components/ui/prompt-tiles/TileBoard";
import type { Tile } from "@/lib/types";

interface TileGridDashProps {
  tiles: Tile[];
  onDeleteTile: (tileId: string) => void;
  onReorderTiles: (order: string[]) => Promise<void> | void;
  onOpenTile: (tile: Tile) => void;
  isReordering: boolean;
}

export function TileGridDash({
  tiles,
  onDeleteTile,
  onReorderTiles,
  onOpenTile,
  isReordering,
}: TileGridDashProps) {
  return (
    <TileBoard
      tiles={tiles}
      variant="dash"
      onDeleteTile={onDeleteTile}
      onReorderTiles={onReorderTiles}
      onOpenTile={onOpenTile}
      isReordering={isReordering}
    />
  );
}

