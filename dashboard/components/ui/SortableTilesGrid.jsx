"use client";

import { useEffect, useRef, useState } from "react";
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
  // Estado local para tiles com ordem preservada
  const [orderedTiles, setOrderedTiles] = useState([]);
  const orderMapRef = useRef(new Map()); // Mapa de ordem original
  const tilesRef = useRef(new Map()); // Cache de tiles por ID

  // Configuração dos sensores para drag and drop
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

  // Inicializar tiles com ordem e IDs únicos
  // ⭐ CORREÇÃO: Removido SSE duplicado - tiles são atualizados via props do AdminDashboardContainer
  // ⭐ BUG 1 FIX: Criar placeholders com orderIndex desde o início para substituição correta
  useEffect(() => {
    const initialTiles = tiles.map((tile, index) => {
      // ⭐ BUG FIX: Detectar placeholder corretamente - tile tem conteúdo se content, answer ou excerpt existirem
      const hasContent = !!(tile.content || tile.answer || tile.excerpt);
      const isPlaceholderValue =
        tile.isPlaceholder !== undefined ? tile.isPlaceholder : !hasContent;

      return {
        ...tile,
        id:
          tile.id ||
          `tile_${Date.now()}_${index}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
        orderIndex: tile.orderIndex ?? index,
        isPlaceholder: isPlaceholderValue,
      };
    });

    // ⭐ BUG 1 FIX: Criar placeholders para tiles que ainda não foram gerados
    // Isso garante que quando um tile real chega com orderIndex, ele substitui o placeholder correto
    // ⭐ BUG FIX: Só criar placeholders se realmente está gerando E não há tile completo com conteúdo para esse orderIndex
    if (isGeneratingTiles && !isGeneratingCustomTile && tilesToGenerate > 0) {
      // ⭐ BUG FIX: Criar placeholders para orderIndex de 0 até tilesToGenerate-1 que não existem
      for (let orderIndex = 0; orderIndex < tilesToGenerate; orderIndex++) {
        // Verificar se já existe tile com esse orderIndex E com conteúdo
        const existingTile = initialTiles.find(
          (t) => t.orderIndex === orderIndex
        );

        // ⭐ BUG FIX: Só criar placeholder se não existe tile OU se o tile existente não tem conteúdo
        const hasContent =
          existingTile &&
          (existingTile.content || existingTile.answer || existingTile.excerpt);
        const shouldCreatePlaceholder =
          !existingTile || (!hasContent && existingTile.isPlaceholder);

        if (shouldCreatePlaceholder && !existingTile) {
          // ⭐ ID estável: mesmo orderIndex sempre gera mesmo ID placeholder
          const placeholderId = `placeholder_${orderIndex}`;
          initialTiles.push({
            id: placeholderId,
            orderIndex: orderIndex,
            isPlaceholder: true,
            title: `Insight ${orderIndex + 1}`,
            content: "",
            answer: "",
            excerpt: "",
          });
        }
      }
    }

    // Ordenar por orderIndex para garantir ordem correta
    initialTiles.sort(
      (a, b) => (a.orderIndex ?? Infinity) - (b.orderIndex ?? Infinity)
    );

    // Atualizar mapa de ordem e cache de tiles
    initialTiles.forEach((tile) => {
      orderMapRef.current.set(tile.id, tile.orderIndex);
      tilesRef.current.set(tile.id, tile);
    });

    setOrderedTiles(initialTiles);
  }, [tiles, isGeneratingTiles, isGeneratingCustomTile, tilesToGenerate]);

  // Handler para reordenação via drag and drop
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      console.log("🔄 DragEnd - active.id:", active.id, "over.id:", over.id);

      const oldIndex = orderedTiles.findIndex((tile) => tile.id === active.id);
      const newIndex = orderedTiles.findIndex((tile) => tile.id === over.id);

      if (oldIndex >= 0 && newIndex >= 0) {
        // Reordenar mantendo orderIndex original
        const reorderedTiles = arrayMove(orderedTiles, oldIndex, newIndex);

        // Atualizar ordem no parent
        onReorder?.(reorderedTiles);

        // Atualizar estado local
        setOrderedTiles(reorderedTiles);
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
        {/* Tiles sortable */}
        {orderedTiles.length > 0 && (
          <SortableContext
            items={orderedTiles.map((tile) => tile.id)}
            strategy={rectSortingStrategy}
          >
            {orderedTiles.map((tile, index) => (
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

        {/* LoadingTile para tile customizado */}
        {isGeneratingCustomTile && <LoadingTile index={0} />}

        {/* ⭐ BUG 1 FIX: Placeholders já estão incluídos em orderedTiles com orderIndex */}
        {/* Não precisamos mais de LoadingTiles separados - eles são renderizados como DraggableTile com isPlaceholder */}

        {/* Add Prompt Tile */}
        <AddPromptTile onClick={onAddPrompt} />
      </div>
    </DndContext>
  );
}
