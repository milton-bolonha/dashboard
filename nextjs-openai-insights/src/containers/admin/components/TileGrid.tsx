import { TileBoard } from "@/components/ui/prompt-tiles/TileBoard";
import type { Tile } from "@/lib/types";

interface TileGridProps {
  tiles: Tile[];
  onDeleteTile: (tileId: string) => void;
  onReorderTiles: (order: string[]) => Promise<void> | void;
  onOpenTile: (tile: Tile) => void;
  isReordering: boolean;
}

export function TileGrid({
  tiles,
  onDeleteTile,
  onReorderTiles,
  onOpenTile,
  isReordering,
}: TileGridProps) {
  return (
    <TileBoard
      tiles={tiles}
      variant="classic"
      onDeleteTile={onDeleteTile}
      onReorderTiles={onReorderTiles}
      onOpenTile={onOpenTile}
      isReordering={isReordering}
    />
  );
}

