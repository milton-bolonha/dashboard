import type { Tile } from "@/lib/types";

interface TileGridDashProps {
  tiles: Tile[];
  onDeleteTile: (tileId: string) => void;
}

export function TileGridDash({ tiles, onDeleteTile }: TileGridDashProps) {
  return (
    <section className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h3 className="text-xl font-semibold text-[#1f2024]">Insights gerados</h3>
        <p className="text-sm text-[#5a5b60]">
          Cards amplos, sem bordas, seguindo a pegada do ChatGPT para leitura contínua.
        </p>
      </header>
      <div className="space-y-6">
        {tiles.map((tile) => (
          <article
            key={tile.id}
            className="rounded-lg border border-[#e3e3e8] bg-white px-5 py-4 shadow-sm transition hover:border-[#c8c8cf]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <span className="text-xs uppercase tracking-[0.3em] text-[#7a7a82]">
                  #{tile.orderIndex + 1}
                </span>
                <h4 className="text-lg font-semibold text-[#202123]">{tile.title}</h4>
              </div>
              <button
                type="button"
                onClick={() => onDeleteTile(tile.id)}
                className="rounded-md border border-transparent px-3 py-1 text-xs font-medium text-[#a15664] transition hover:border-[#f5ccd6] hover:bg-[#fce8ee] hover:text-[#792b3c]"
              >
                Remover
              </button>
            </div>
            <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#3a3a41]">
              {tile.content}
            </p>
            <p className="mt-3 text-xs text-[#6b6b73]">
              {new Date(tile.createdAt).toLocaleString("pt-BR")}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

