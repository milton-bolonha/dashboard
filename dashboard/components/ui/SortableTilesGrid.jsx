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

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      const oldIndex = tiles.findIndex((tile) => tile.id === active.id);
      const newIndex = tiles.findIndex((tile) => tile.id === over.id);

      const newTiles = arrayMove(tiles, oldIndex, newIndex);
      onReorder?.(newTiles);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Tiles existentes */}
        {tiles.length > 0 && (
          <SortableContext
            items={tiles.map((tile) => tile.id)}
            strategy={rectSortingStrategy}
          >
            {tiles.map((tile) => (
              <DraggableTile
                key={tile.id}
                tile={tile}
                onClick={() => onTileClick(tile)}
                isDisabled={isGeneratingTiles || isGeneratingCustomTile}
              />
            ))}
          </SortableContext>
        )}

        {/* LoadingTile para tile customizado sendo gerado */}
        {isGeneratingCustomTile && (
          <LoadingTile key="custom-loading" index={0} />
        )}

        {/* LoadingTiles durante geração automática */}
        {isGeneratingTiles &&
          !isGeneratingCustomTile &&
          Array.from({
            length: Math.max(0, tilesToGenerate - tiles.length),
          }).map((_, i) => <LoadingTile key={`loading-${i}`} index={i} />)}

        {/* Add Prompt Tile - sempre no final */}
        <AddPromptTile onClick={onAddPrompt} />
      </div>
    </DndContext>
  );
}
