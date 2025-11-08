import type { Tile } from "@/lib/types";

interface TileCardProps {
  tile: Tile;
  onDelete: () => void;
}

export function TileCard({ tile, onDelete }: TileCardProps) {
  return (
    <article className="group flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white shadow-sm">
          #{tile.orderIndex + 1}
        </span>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-full border border-transparent px-3 py-1 text-xs font-medium text-slate-400 transition hover:border-red-200 hover:text-red-500"
        >
          Remover
        </button>
      </div>
      <h4 className="mt-4 text-lg font-semibold text-slate-900">{tile.title}</h4>
      <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
        {tile.content}
      </p>
      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-400">
        {new Date(tile.createdAt).toLocaleString("pt-BR")}
      </p>
    </article>
  );
}

