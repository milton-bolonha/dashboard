import { TileBoard } from "@/components/ui/prompt-tiles/TileBoard";
import type { Tile } from "@/lib/types";

interface TileGridAdeProps {
  tiles: Tile[];
  onDeleteTile: (tileId: string) => void;
  onReorderTiles: (order: string[]) => Promise<void> | void;
  onOpenTile: (tile: Tile) => void;
  isReordering: boolean;
}

export function TileGridAde({
  tiles,
  onDeleteTile,
  onReorderTiles,
  onOpenTile,
  isReordering,
}: TileGridAdeProps) {
  return (
    <TileBoard
      tiles={tiles}
      variant="ade"
      onDeleteTile={onDeleteTile}
      onReorderTiles={onReorderTiles}
      onOpenTile={onOpenTile}
      isReordering={isReordering}
    />
  );
}

