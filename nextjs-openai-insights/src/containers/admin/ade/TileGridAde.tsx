import type { Tile } from "@/lib/types";

interface TileGridAdeProps {
  tiles: Tile[];
  onDeleteTile: (tileId: string) => void;
}

export function TileGridAde({ tiles, onDeleteTile }: TileGridAdeProps) {
  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Insights gerados</h2>
      </div>
      <div className="grid auto-rows-[192px] grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <article
            key={tile.id}
            className="relative h-48 cursor-default rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-600">
                  #{tile.orderIndex + 1}
                </div>
                <h3 className="text-sm font-medium text-gray-800">{tile.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => onDeleteTile(tile.id)}
                className="text-xs text-gray-500 transition hover:text-red-500"
              >
                Remover
              </button>
            </div>
            <p className="mt-4 line-clamp-6 text-sm text-gray-600 whitespace-pre-line">
              {tile.content}
            </p>
          </article>
        ))}
        <button
          type="button"
          disabled
          className="group flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white text-gray-500 transition hover:border-gray-400"
        >
          <div className="flex flex-col items-center space-y-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition group-hover:bg-gray-300">
              +
            </div>
            <span className="text-sm">Add Prompt</span>
          </div>
        </button>
      </div>
    </section>
  );
}

