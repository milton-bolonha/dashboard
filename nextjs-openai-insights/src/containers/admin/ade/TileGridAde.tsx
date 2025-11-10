import { TileBoard } from "@/components/ui/prompt-tiles/TileBoard";
import type { Tile } from "@/lib/types";

interface TileGridAdeProps {
  tiles: Tile[];
  onDeleteTile: (tileId: string) => void;
  onReorderTiles: (order: string[]) => Promise<void> | void;
  onOpenTile: (tile: Tile) => void;
  isReordering: boolean;
  onRegenerateTile?: (tileId: string) => void;
  regeneratingTileIds?: string[];
}

export function TileGridAde({
  tiles,
  onDeleteTile,
  onReorderTiles,
  onOpenTile,
  isReordering,
  onRegenerateTile,
  regeneratingTileIds,
}: TileGridAdeProps) {
  return (
    <TileBoard
      tiles={tiles}
      variant="ade"
      onDeleteTile={onDeleteTile}
      onReorderTiles={onReorderTiles}
      onOpenTile={onOpenTile}
      isReordering={isReordering}
      onRegenerateTile={onRegenerateTile}
      regeneratingTileIds={regeneratingTileIds}
    />
  );
}

