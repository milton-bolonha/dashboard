import { TileBoard } from "@/components/ui/prompt-tiles/TileBoard";
import type { AdeAppearanceTokens } from "@/lib/ade-theme";
import type { Tile } from "@/lib/types";

interface TileGridAdeProps {
  tiles: Tile[];
  appearance: AdeAppearanceTokens;
  onDeleteTile: (tileId: string) => void;
  onReorderTiles: (order: string[]) => Promise<void> | void;
  onOpenTile: (tile: Tile) => void;
  isReordering: boolean;
  onRegenerateTile?: (tileId: string) => void;
  regeneratingTileIds?: string[];
  onAddPrompt?: () => void;
  onBulkUploadPrompts?: () => void;
}

export function TileGridAde({
  tiles,
  appearance,
  onDeleteTile,
  onReorderTiles,
  onOpenTile,
  isReordering,
  onRegenerateTile,
  regeneratingTileIds,
  onAddPrompt,
  onBulkUploadPrompts,
}: TileGridAdeProps) {
  return (
    <TileBoard
      tiles={tiles}
      variant="ade"
      appearance={appearance}
      onDeleteTile={onDeleteTile}
      onReorderTiles={onReorderTiles}
      onOpenTile={onOpenTile}
      isReordering={isReordering}
      onRegenerateTile={onRegenerateTile}
      regeneratingTileIds={regeneratingTileIds}
      onAddPrompt={onAddPrompt}
      onBulkUploadPrompts={onBulkUploadPrompts}
    />
  );
}

