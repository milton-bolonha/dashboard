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

// ⭐ NOVO: Timeout de segurança para prevenir placeholders infinitos
const GENERATION_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos

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
  const lastTilesRef = useRef([]); // ⭐ NOVO: Referência para último estado válido dos tiles

  // ⭐ NOVO: Timeout de segurança para prevenir placeholders infinitos
  const generationStartTimeRef = useRef(null);
  const timeoutIdRef = useRef(null);

  // ⭐ NOVO: Helper para verificar se um tile tem conteúdo
  const hasTileContent = (tile) =>
    !!(tile.content || tile.answer || tile.excerpt);

  // ⭐ NOVO: Helper para criar placeholder
  const createPlaceholder = (orderIndex) => ({
    id: `placeholder_${orderIndex}`,
    orderIndex,
    isPlaceholder: true,
    title: `Insight ${orderIndex + 1}`,
    content: "",
    answer: "",
    excerpt: "",
  });

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

  // ⭐ NOVO: Timeout de segurança para forçar parada de geração após timeout
  useEffect(() => {
    if (isGeneratingTiles) {
      // Iniciar timer quando geração começa
      if (!generationStartTimeRef.current) {
        generationStartTimeRef.current = Date.now();
        console.log(
          `[SortableTilesGrid] ⏱️ Iniciando timeout de segurança (${GENERATION_TIMEOUT_MS}ms)`
        );
      }

      // Limpar timeout anterior se existir
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }

      // Criar novo timeout
      timeoutIdRef.current = setTimeout(() => {
        const elapsed =
          Date.now() - (generationStartTimeRef.current || Date.now());
        console.warn(
          `[SortableTilesGrid] ⚠️ Timeout de segurança atingido após ${elapsed}ms. Forçando parada de geração.`
        );
        generationStartTimeRef.current = null;
        // Não podemos mudar isGeneratingTiles diretamente, mas podemos prevenir criação de placeholders
      }, GENERATION_TIMEOUT_MS);
    } else {
      // Limpar timer quando geração para
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      generationStartTimeRef.current = null;
    }

    return () => {
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [isGeneratingTiles]);

  // Inicializar e atualizar tiles com ordem preservada
  useEffect(() => {
    // ⭐ MELHORIA: Se não há tiles e não está gerando, manter último estado válido
    if (
      !isGeneratingTiles &&
      tiles.length === 0 &&
      lastTilesRef.current.length > 0
    ) {
      console.log("🔄 Mantendo último estado válido dos tiles");
      return;
    }

    // ⭐ MELHORIA: Processar tiles atuais
    const processedTiles = tiles.map((tile, index) => {
      const tileCopy = { ...tile };
      const hasContent = hasTileContent(tile);

      if (!hasContent && !isGeneratingTiles) {
        const fallbackMessage =
          "⚠️ No AI output was generated for this insight. Please regenerate or adjust the prompt.";
        tileCopy.content = fallbackMessage;
        tileCopy.answer = fallbackMessage;
        tileCopy.excerpt = fallbackMessage;
      }

      const computedHasContent = hasTileContent(tileCopy);
      const isPlaceholderValue =
        tile.isPlaceholder !== undefined
          ? tile.isPlaceholder
          : !computedHasContent;

      return {
        ...tileCopy,
        id:
          tileCopy.id ||
          `tile_${Date.now()}_${index}_${Math.random()
            .toString(36)
            .substr(2, 9)}`,
        orderIndex: tileCopy.orderIndex ?? index,
        isPlaceholder: isPlaceholderValue,
      };
    });

    // ⭐ MELHORIA: Criar ou atualizar placeholders com guard clauses
    let finalTiles = [...processedTiles];

    // ⭐ GUARD CLAUSE 1: Se já temos tiles suficientes, não criar mais placeholders
    const tilesWithContent = finalTiles.filter(hasTileContent).length;
    if (tilesWithContent >= tilesToGenerate && tilesToGenerate > 0) {
      console.log(
        `[SortableTilesGrid] ✅ Já temos ${tilesWithContent} tiles com conteúdo (meta: ${tilesToGenerate}). Não criando mais placeholders.`
      );
    } else if (
      isGeneratingTiles &&
      !isGeneratingCustomTile &&
      tilesToGenerate > 0
    ) {
      // ⭐ GUARD CLAUSE 2: Verificar timeout de segurança
      const elapsed = generationStartTimeRef.current
        ? Date.now() - generationStartTimeRef.current
        : 0;
      const hasTimedOut = elapsed > GENERATION_TIMEOUT_MS;

      if (hasTimedOut) {
        console.warn(
          `[SortableTilesGrid] ⚠️ Timeout de segurança atingido (${elapsed}ms). Não criando mais placeholders.`
        );
      } else {
        // ⭐ GUARD CLAUSE 3: Limitar número de placeholders ao necessário
        const existingPlaceholders = finalTiles.filter(
          (t) => !hasTileContent(t) && t.isPlaceholder
        ).length;
        const neededPlaceholders = Math.max(
          0,
          tilesToGenerate - finalTiles.length
        );

        if (neededPlaceholders > 0 && existingPlaceholders < tilesToGenerate) {
          for (let orderIndex = 0; orderIndex < tilesToGenerate; orderIndex++) {
            const existingTile = finalTiles.find(
              (t) => t.orderIndex === orderIndex
            );

            if (!existingTile) {
              // Criar novo placeholder apenas se necessário
              finalTiles.push(createPlaceholder(orderIndex));
            } else if (
              !hasTileContent(existingTile) &&
              !existingTile.isPlaceholder
            ) {
              // Atualizar tile existente sem conteúdo para placeholder
              const placeholderIndex = finalTiles.findIndex(
                (t) => t.orderIndex === orderIndex
              );
              finalTiles[placeholderIndex] = {
                ...existingTile,
                ...createPlaceholder(orderIndex),
                id: existingTile.id, // Manter ID original
              };
            }
          }
        }
      }
    }

    // Ordenar por orderIndex
    finalTiles.sort(
      (a, b) => (a.orderIndex ?? Infinity) - (b.orderIndex ?? Infinity)
    );

    // Atualizar mapas e cache
    finalTiles.forEach((tile) => {
      orderMapRef.current.set(tile.id, tile.orderIndex);
      tilesRef.current.set(tile.id, tile);
    });

    // ⭐ MELHORIA: Atualizar último estado válido se houver tiles com conteúdo
    if (finalTiles.some(hasTileContent)) {
      lastTilesRef.current = finalTiles;
    }

    // ⭐ FIX: Prevenir loop infinito comparando estado atual com o novo
    const currentIds = orderedTiles.map((t) => t.id).join(",");
    const newIds = finalTiles.map((t) => t.id).join(",");
    const contentChanged = finalTiles.some((tile, i) => {
      const currentTile = orderedTiles[i];
      // Verifica se o tile é novo ou se seu status de 'ter conteúdo' mudou
      return (
        !currentTile || hasTileContent(tile) !== hasTileContent(currentTile)
      );
    });

    if (currentIds !== newIds || contentChanged) {
      setOrderedTiles(finalTiles);
    }
  }, [
    tiles,
    isGeneratingTiles,
    isGeneratingCustomTile,
    tilesToGenerate,
    orderedTiles,
  ]);

  // Handler para reordenação via drag and drop
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over?.id && over) {
      console.log("🔄 DragEnd - active.id:", active.id, "over.id:", over.id);

      const oldIndex = orderedTiles.findIndex((tile) => tile.id === active.id);
      const newIndex = orderedTiles.findIndex((tile) => tile.id === over.id);

      if (oldIndex >= 0 && newIndex >= 0) {
        // Reordenar mantendo orderIndex original
        const reorderedTiles = arrayMove(orderedTiles, oldIndex, newIndex).map(
          (tile, index) => ({
            ...tile,
            orderIndex: index, // ⭐ MELHORIA: Atualizar orderIndex após reordenação
          })
        );

        // ⭐ MELHORIA: Atualizar último estado válido
        if (reorderedTiles.some(hasTileContent)) {
          lastTilesRef.current = reorderedTiles;
        }

        // Atualizar ordem no parent
        onReorder?.(reorderedTiles);

        // Atualizar estado local
        setOrderedTiles(reorderedTiles);

        // ⭐ MELHORIA: Atualizar mapas
        reorderedTiles.forEach((tile) => {
          orderMapRef.current.set(tile.id, tile.orderIndex);
          tilesRef.current.set(tile.id, tile);
        });
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
        {/* ⭐ MELHORIA: Usar último estado válido se não há tiles e não está gerando */}
        {(orderedTiles.length > 0 || lastTilesRef.current.length > 0) && (
          <SortableContext
            items={(orderedTiles.length > 0
              ? orderedTiles
              : lastTilesRef.current
            ).map((tile) => tile.id)}
            strategy={rectSortingStrategy}
          >
            {(orderedTiles.length > 0
              ? orderedTiles
              : lastTilesRef.current
            ).map((tile, index) => (
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

        {/* Add Prompt Tile */}
        <AddPromptTile onClick={onAddPrompt} />
      </div>
    </DndContext>
  );
}
