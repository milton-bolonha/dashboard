import {
  DndContext,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { CSSProperties } from "react";
import { Trash2, GripVertical, ChevronRight, RotateCw, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";

import type { Tile } from "@/lib/types";

type TileBoardVariant = "classic" | "dash" | "ade";

interface TileBoardProps {
  tiles: Tile[];
  variant: TileBoardVariant;
  onDeleteTile: (tileId: string) => void;
  onReorderTiles: (order: string[]) => Promise<void> | void;
  onOpenTile: (tile: Tile) => void;
  isReordering?: boolean;
  onRegenerateTile?: (tileId: string) => void;
  regeneratingTileIds?: string[];
}

interface SortableTileCardProps {
  tile: Tile;
  variant: TileBoardVariant;
  onDeleteTile: (tileId: string) => void;
  onOpenTile: (tile: Tile) => void;
  onRegenerateTile?: (tileId: string) => void;
  isRegenerating?: boolean;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners | undefined;
  setNodeRef: (element: HTMLElement | null) => void;
  style: CSSProperties;
  isDragging: boolean;
}

const variantTokens: Record<
  TileBoardVariant,
  {
    accent: string;
    background: string;
    border: string;
    badge: string;
    textMuted: string;
    chip: string;
  }
> = {
  classic: {
    accent: "from-orange-500 to-amber-400",
    background: "bg-white",
    border: "border-orange-200",
    badge: "bg-orange-100 text-orange-700",
    textMuted: "text-slate-500",
    chip: "bg-orange-50 text-orange-700 border border-orange-200",
  },
  dash: {
    accent: "from-orange-500 to-yellow-400",
    background: "bg-[#fff9f2]",
    border: "border-[#ffd6a5]",
    badge: "bg-[#ffe0b5] text-[#ad5b1b]",
    textMuted: "text-[#725d4d]",
    chip: "bg-[#fff0da] text-[#ad5b1b] border border-[#ffd6a5]",
  },
  ade: {
    accent: "from-amber-400 to-rose-400",
    background: "bg-white",
    border: "border-rose-200",
    badge: "bg-rose-100 text-rose-700",
    textMuted: "text-rose-600",
    chip: "bg-rose-50 text-rose-700 border border-rose-200",
  },
};

const MAX_CONTENT_PREVIEW = 300;

function formatTimestamp(value: string) {
  try {
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function truncateContent(content: string) {
  if (content.length <= MAX_CONTENT_PREVIEW) return content;
  return `${content.slice(0, MAX_CONTENT_PREVIEW)}…`;
}

function SortableTileCard({
  tile,
  variant,
  onDeleteTile,
  onOpenTile,
  onRegenerateTile,
  isRegenerating,
  attributes,
  listeners,
  setNodeRef,
  style,
  isDragging,
}: SortableTileCardProps) {
  const tokens = variantTokens[variant];

  if (variant === "ade") {
    const preview = truncateContent(tile.content);
    const fallbackPreview =
      preview && preview.trim().length > 0
        ? preview
        : "AI did not return content yet. Open this tile to regenerate or continue the chat.";

    return (
      <article
        ref={setNodeRef}
        style={{
          ...style,
          cursor: isDragging ? "grabbing" : "grab",
        }}
        data-testid="tile-card"
        className={`group relative flex h-[220px] flex-col overflow-hidden rounded-[20px] border border-[#ededed] bg-white shadow-sm transition duration-150 hover:-translate-y-1 hover:shadow-lg ${isDragging ? "opacity-90" : ""}`}
      >
        <button
          type="button"
          onClick={() => onOpenTile(tile)}
          className="flex flex-1 flex-col justify-between px-4 py-4 text-left"
        >
          <div className="flex items-center justify-between gap-3">
            <h4 className="truncate text-base font-semibold text-[#151515]">
              {tile.title}
            </h4>
            <ChevronRight className="h-4 w-4 text-[#C4C4C4] transition group-hover:text-black" />
          </div>
          <p
            className="text-sm leading-relaxed text-[#3a3a3a]"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 6,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {fallbackPreview}
          </p>
        </button>

        <div className="pointer-events-none absolute top-4 right-4 flex gap-2 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-white text-[#1f1f1f] shadow hover:border-black/20"
            {...(listeners ?? {})}
            {...attributes}
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onRegenerateTile?.(tile.id)}
            disabled={isRegenerating}
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-white text-[#1f1f1f] shadow hover:border-black/20 disabled:cursor-not-allowed disabled:text-gray-400"
            aria-label="Regenerate insight"
          >
            {isRegenerating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RotateCw className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            onClick={() => onDeleteTile(tile.id)}
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full border border-transparent bg-white text-[#A3A3A3] shadow hover:border-red-200 hover:bg-red-50 hover:text-red-500"
            aria-label="Remove tile"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {isRegenerating ? (
          <div className="absolute inset-0 flex items-center justify-center rounded-[20px] bg-white/75 backdrop-blur-sm">
            <Loader2 className="h-5 w-5 animate-spin text-black" />
          </div>
        ) : null}
      </article>
    );
  }

  return (
    <article
      ref={setNodeRef}
      style={{
        ...style,
        cursor: isDragging ? "grabbing" : "default",
      }}
      data-testid="tile-card"
      className={`group relative flex flex-col gap-4 rounded-3xl border ${tokens.border} ${tokens.background} p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/70 text-orange-500 shadow-sm transition hover:bg-white"
          {...(listeners ?? {})}
          {...attributes}
            aria-label="Drag to reorder"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          {tile.category ? (
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${tokens.chip}`}
            >
              {tile.category}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => onDeleteTile(tile.id)}
          className="rounded-full border border-transparent p-2 text-slate-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
          aria-label="Remove tile"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => onOpenTile(tile)}
        className="flex w-full flex-col items-start gap-3 text-left"
      >
        <div className="flex w-full items-start justify-between gap-3">
          <h4 className="text-lg font-semibold text-slate-900">
            {tile.title}
          </h4>
          <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:text-orange-500" />
        </div>
        <p className={`text-sm leading-relaxed ${tokens.textMuted}`}>
          {truncateContent(tile.content)}
        </p>
      </button>

      <footer className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span className={`inline-flex items-center rounded-full bg-gradient-to-r ${tokens.accent} px-3 py-1 text-white shadow-sm`}>
          {tile.model}
        </span>
        <span className="flex items-center gap-1">
          <span className="font-medium text-slate-700">Updated</span>
          <span>{formatTimestamp(tile.updatedAt ?? tile.createdAt)}</span>
        </span>
        {tile.totalTokens ? (
          <span className="flex items-center gap-1">
            <span className="font-medium text-slate-700">Tokens</span>
            <span>{tile.totalTokens}</span>
          </span>
        ) : null}
        {tile.attempts > 1 ? (
          <span className="rounded-full bg-orange-100 px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-orange-700">
            Auto-retried
          </span>
        ) : null}
      </footer>
    </article>
  );
}

function sortTilesByOrder(tiles: Tile[]): Tile[] {
  return [...tiles].sort((a, b) => a.orderIndex - b.orderIndex);
}

export function TileBoard({
  tiles,
  variant,
  onDeleteTile,
  onReorderTiles,
  onOpenTile,
  isReordering: externalReordering = false,
  onRegenerateTile,
  regeneratingTileIds,
}: TileBoardProps) {
  const isAdeVariant = variant === "ade";
  const sortingStrategy = isAdeVariant
    ? rectSortingStrategy
    : verticalListSortingStrategy;
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const sortedTiles = useMemo(() => sortTilesByOrder(tiles), [tiles]);
  const [items, setItems] = useState(sortedTiles);
  const [isReordering, setIsReordering] = useState(false);
  const regeneratingSet = useMemo(() => {
    return new Set(regeneratingTileIds ?? []);
  }, [regeneratingTileIds]);

  useEffect(() => {
    setItems(sortTilesByOrder(tiles));
  }, [tiles]);

  const commitReorder = useCallback(
    async (order: Tile[]) => {
      if (!order.length) return;
      try {
        setIsReordering(true);
        await onReorderTiles(order.map((tile) => tile.id));
      } catch (error) {
        console.error("[TileBoard] Failed to persist reorder", error);
        setItems(sortTilesByOrder(tiles));
      } finally {
        setIsReordering(false);
      }
    },
    [onReorderTiles, tiles]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) {
        return;
      }

      setItems((currentItems) => {
        const oldIndex = currentItems.findIndex(
          (item) => item.id === active.id
        );
        const newIndex = currentItems.findIndex((item) => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) {
          return currentItems;
        }
        const newOrder = arrayMove(currentItems, oldIndex, newIndex);
        void commitReorder(newOrder);
        return newOrder;
      });
    },
    [commitReorder]
  );

  const containerClassName = isAdeVariant
    ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
    : "space-y-5";

  return (
    <section className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h3
          className={
            isAdeVariant ? "text-xl font-semibold text-[#1f1f1f]" : "text-xl font-semibold text-slate-900"
          }
        >
          AI Insight Tiles
        </h3>
        <p
          className={
            isAdeVariant ? "text-sm text-[#6f6f6f]" : "text-sm text-slate-500"
          }
        >
          Drag to reorder tiles. Click a card to open the full prompt, analyse the
          AI reply, and continue iterating.
        </p>
        {(isReordering || externalReordering) && (
          <p className="text-xs text-orange-600">Saving new order…</p>
        )}
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={sortingStrategy}
        >
          <div className={containerClassName}>
            {items.map((tile) => (
              <SortableTile
                key={tile.id}
                tile={tile}
                variant={variant}
                onDeleteTile={onDeleteTile}
                onOpenTile={onOpenTile}
                onRegenerateTile={onRegenerateTile}
                isRegenerating={regeneratingSet.has(tile.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </section>
  );
}

function SortableTile({
  tile,
  variant,
  onDeleteTile,
  onOpenTile,
  onRegenerateTile,
  isRegenerating,
}: {
  tile: Tile;
  variant: TileBoardVariant;
  onDeleteTile: (tileId: string) => void;
  onOpenTile: (tile: Tile) => void;
  onRegenerateTile?: (tileId: string) => void;
  isRegenerating?: boolean;
}) {
  const sortable = useSortable({ id: tile.id });
  const style = {
    transform: CSS.Transform.toString(sortable.transform),
    transition: sortable.transition,
  };

  return (
    <SortableTileCard
      tile={tile}
      variant={variant}
      onDeleteTile={onDeleteTile}
      onOpenTile={onOpenTile}
      onRegenerateTile={onRegenerateTile}
      isRegenerating={isRegenerating}
      attributes={sortable.attributes}
      listeners={sortable.listeners ?? {}}
      setNodeRef={sortable.setNodeRef}
      style={style}
      isDragging={sortable.isDragging}
    />
  );
}

