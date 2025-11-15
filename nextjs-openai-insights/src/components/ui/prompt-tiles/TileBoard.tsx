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
import {
  Trash2,
  GripVertical,
  ChevronRight,
  RotateCw,
  Loader2,
  Plus,
} from "lucide-react";
import { useEffect, useMemo, useState, useCallback } from "react";

import type { AdeAppearanceTokens } from "@/lib/ade-theme";
import { hexToRgbString } from "@/lib/color";
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
  appearance?: AdeAppearanceTokens;
  onAddPrompt?: () => void;
  onBulkUploadPrompts?: () => void;
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
          cursor: isDragging ? "grabbing" : "pointer",
        }}
        data-testid="tile-card"
        className={`group relative flex h-[220px] flex-col overflow-hidden rounded-[20px] border border-[#ededed] bg-white transition duration-150 ${
          isDragging ? "opacity-90" : ""
        }`}
      >
        {/* Header - bg branco com border bottom cinza claro */}
        <div className="bg-white border-b border-[#e4e4e7] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="truncate text-base font-semibold text-[#151515]">
              {tile.title}
            </h4>
            <ChevronRight className="h-4 w-4 text-[#C4C4C4] transition group-hover:text-black" />
          </div>
        </div>

        {/* Body - bg cinza clarinho */}
        <button
          type="button"
          onClick={() => onOpenTile(tile)}
          className="flex flex-1 cursor-pointer flex-col justify-between bg-[#fafafa] px-4 py-4 text-left transition-colors hover:text-[#151515]"
        >
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

        <div className="pointer-events-none absolute bottom-4 right-4 flex items-center gap-2 opacity-0 transition group-hover:opacity-100">
          <button
            type="button"
            className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#303030] ring-1 ring-black/5 transition hover:text-black cursor-grab active:cursor-grabbing"
            {...(listeners ?? {})}
            {...attributes}
            aria-label="Drag to reorder"
            title="Drag"
          >
            <GripVertical className="h-4 w-4" />
            <span>Drag</span>
          </button>
          <button
            type="button"
            onClick={() => onRegenerateTile?.(tile.id)}
            disabled={isRegenerating}
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#1f1f1f] ring-1 ring-black/5 transition hover:text-black disabled:cursor-not-allowed disabled:text-gray-400 cursor-pointer"
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
            className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-[#8a8a8a] ring-1 ring-black/5 transition hover:text-red-500 cursor-pointer"
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
          <h4 className="text-lg font-semibold text-slate-900">{tile.title}</h4>
          <ChevronRight className="h-4 w-4 text-slate-300 transition group-hover:text-orange-500" />
        </div>
        <p className={`text-sm leading-relaxed ${tokens.textMuted}`}>
          {truncateContent(tile.content)}
        </p>
      </button>

      <footer className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span
          className={`inline-flex items-center rounded-full bg-gradient-to-r ${tokens.accent} px-3 py-1 text-white shadow-sm`}
        >
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
  appearance,
  onAddPrompt,
  onBulkUploadPrompts,
}: TileBoardProps) {
  const handleAddPrompt = useCallback(() => {
    if (onAddPrompt) {
      onAddPrompt();
    } else {
      // Default implementation - could be replaced with modal opening
      console.log("Add prompt functionality coming soon");
    }
  }, [onAddPrompt]);

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
        // CRITICAL: Não chamar commitReorder dentro de setState
        // Usar setTimeout para executar após o render
        setTimeout(() => {
          void commitReorder(newOrder);
        }, 0);
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
      <header className="flex items-center justify-between">
        <h3
          className="text-lg font-semibold"
          style={
            isAdeVariant
              ? { color: hexToRgbString(appearance?.headingColor || "#1f1f1f") }
              : { color: "rgb(0, 0, 0)" }
          }
        >
          AI Insight Tiles
        </h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (onBulkUploadPrompts) {
                onBulkUploadPrompts();
              } else {
                console.log("Bulk upload functionality coming soon");
              }
            }}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            Bulk Upload Your Prompt
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleAddPrompt}
            className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            Add Prompt
          </button>
        </div>
        {(isReordering || externalReordering) && (
          <p className="absolute right-0 top-full mt-1 text-xs text-orange-600">
            Saving new order…
          </p>
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
            {/* Always show Add Prompt box first */}
            <button
              type="button"
              onClick={handleAddPrompt}
              className="group relative flex h-[220px] flex-col overflow-hidden rounded-[20px] border-2 border-dashed border-gray-400 bg-white transition-all duration-200 flex-col items-center justify-center cursor-pointer hover:border-gray-500 hover:bg-gray-50"
              style={
                isAdeVariant
                  ? {
                      backgroundColor: appearance?.surfaceColor,
                      borderColor: appearance?.cardBorderColor,
                    }
                  : undefined
              }
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-gray-300 group-hover:bg-gray-400 transition-colors flex items-center justify-center">
                  <Plus className="w-6 h-6 text-gray-600 group-hover:text-gray-700" />
                </div>
                <span
                  className="text-sm font-medium"
                  style={
                    isAdeVariant
                      ? { color: appearance?.textColor || "#2c2c2c" }
                      : { color: "#4b5563" }
                  }
                >
                  Add Prompt
                </span>
              </div>
            </button>

            {/* Then show existing tiles */}
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
