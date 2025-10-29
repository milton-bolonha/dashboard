"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { DraggableTile } from "./DraggableTile";
import { AddPromptTile } from "./AddPromptTile";
import { LoadingTile } from "./LoadingTile";

export function SortableTilesGrid({
  tiles = [],
  onTileClick,
  onAddPrompt,
  onDeleteTile,
  isGeneratingCustomTile = false,
  isGeneratingTiles = false,
  tilesToGenerate = 6,
  onReorder,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ⭐ CRÍTICO: Garantir IDs únicos mesmo se tile.id for undefined
  const tilesWithIds = tiles.map((tile, index) => ({
    ...tile,
    // Gerar ID único se não existir
    id:
      tile.id ||
      `tile_generated_${Date.now()}_${index}_${Math.random()
        .toString(36)
        .substr(2, 9)}`,
  }));

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      console.log("🔄 DragEnd - active.id:", active.id, "over.id:", over.id);

      // ⭐ ENCONTRAR índices nos tiles originais
      // active.id e over.id são os IDs passados para useSortable em DraggableTile
      const oldIndex = tilesWithIds.findIndex((tile) => tile.id === active.id);
      const newIndex = tilesWithIds.findIndex((tile) => tile.id === over.id);

      console.log("🔄 Índices encontrados:", { oldIndex, newIndex });

      if (oldIndex >= 0 && newIndex >= 0) {
        // Usar tiles ORIGINAIS (não tilesWithIds) para o callback
        // Mas encontrar os índices em tilesWithIds pois é onde estão os IDs corretos
        const reorderedOriginalTiles = arrayMove(tiles, oldIndex, newIndex);
        console.log("🔄 Tiles reordenados:", reorderedOriginalTiles);
        onReorder?.(reorderedOriginalTiles);
      } else {
        console.warn("⚠️ Não foi possível encontrar índices para reorder");
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-[192px]">
        {/* Tiles sortable - apenas tiles que podem ser arrastados */}
        {tilesWithIds.length > 0 && (
          <SortableContext
            items={tilesWithIds.map((tile) => tile.id)}
            strategy={rectSortingStrategy}
          >
            {tilesWithIds.map((tile, index) => (
              <DraggableTile
                key={`tile-${tile.id}-${index}`}
                tile={tile}
                onClick={() => onTileClick(tile)}
                onDelete={() => onDeleteTile?.(tile.id)}
                isDisabled={isGeneratingTiles || isGeneratingCustomTile}
              />
            ))}
          </SortableContext>
        )}

        {/* LoadingTile para tile customizado sendo gerado */}
        {isGeneratingCustomTile && <LoadingTile index={0} />}

        {/* LoadingTiles durante geração automática */}
        {isGeneratingTiles &&
          !isGeneratingCustomTile &&
          Array.from({
            // ⭐ CORREÇÃO: Usar tilesWithIds.length para cálculo correto
            length: Math.max(0, tilesToGenerate - tilesWithIds.length),
          }).map((_, i) => <LoadingTile key={`loading-${i}`} index={i} />)}

        {/* Add Prompt Tile - sempre no final */}
        <AddPromptTile onClick={onAddPrompt} />
      </div>
    </DndContext>
  );
}
