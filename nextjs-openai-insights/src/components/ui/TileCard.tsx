import type { Tile } from "@/lib/types";

interface TileCardProps {
  tile: Tile;
  onDelete: () => void;
}

export function TileCard({ tile, onDelete }: TileCardProps) {
  return (
    <article className="group flex h-full flex-col justify-between rounded-3xl border border-slate-800/70 bg-slate-900/50 p-6 shadow-lg shadow-cyan-500/5 transition hover:border-cyan-400/40 hover:bg-slate-900/70">
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/20 text-sm font-semibold text-cyan-300">
          #{tile.orderIndex + 1}
        </span>
        <button
          type="button"
          onClick={onDelete}
          className="rounded-xl border border-transparent px-3 py-1 text-xs text-slate-400 transition hover:border-red-500/40 hover:text-red-300"
        >
          Remover
        </button>
      </div>
      <h4 className="mt-4 text-lg font-semibold text-slate-100">{tile.title}</h4>
      <p className="mt-3 text-sm leading-relaxed text-slate-300 whitespace-pre-line">
        {tile.content}
      </p>
      <p className="mt-4 text-xs uppercase tracking-[0.3em] text-slate-500">
        {new Date(tile.createdAt).toLocaleString("pt-BR")}
      </p>
    </article>
  );
}

