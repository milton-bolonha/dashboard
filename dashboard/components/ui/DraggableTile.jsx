"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Tile } from "./Tile";

export function DraggableTile({ tile, onClick, onDelete, isDisabled = false }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: tile.id,
    disabled: isDisabled,
    data: {
      type: "tile",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // ⭐ CORREÇÃO: Só aplicar opacity durante drag ativo, não persistir após
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 1000 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={`transition-all duration-200 relative group ${
        isDragging
          ? "cursor-grabbing shadow-2xl scale-105"
          : "cursor-grab hover:scale-102"
      } ${isDisabled ? "cursor-not-allowed opacity-50" : ""}`}
    >
      <Tile title={tile.title} excerpt={tile.excerpt} onDelete={onDelete} />

      {/* Resize handles - removido para evitar conflito com drag */}
    </div>
  );
}
