import type { Tile } from "@/lib/types";

import { TileCard } from "@/components/ui/TileCard";

interface TileGridProps {
  tiles: Tile[];
  onDeleteTile: (tileId: string) => void;
}

export function TileGrid({ tiles, onDeleteTile }: TileGridProps) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-semibold text-slate-900">Insights gerados</h3>
        <p className="text-sm text-slate-500">
          Cada insight vem direto do GPT-5 mini, ajustado para caber nos cookies do browser.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {tiles.map((tile) => (
          <TileCard key={tile.id} tile={tile} onDelete={() => onDeleteTile(tile.id)} />
        ))}
      </div>
    </section>
  );
}

