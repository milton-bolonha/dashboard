"use client";

import { useState, useRef } from "react";

export function DragDropTable({
  items,
  onReorder,
  renderRow,
  dragHandle = true,
  className = "",
}) {
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const dragCounter = useRef(0);

  const handleDragStart = (e, item, index) => {
    setDraggedItem({ item, index });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.parentNode);
    e.dataTransfer.setDragImage(e.target.parentNode, 0, 0);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    dragCounter.current++;
    setDragOverIndex(index);
  };

  const handleDragLeave = (e) => {
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();

    if (!draggedItem || draggedItem.index === dropIndex) {
      return;
    }

    const newItems = [...items];
    const draggedItemData = newItems[draggedItem.index];

    // Remove item da posição original
    newItems.splice(draggedItem.index, 1);

    // Ajusta o índice se necessário
    const adjustedDropIndex =
      draggedItem.index < dropIndex ? dropIndex - 1 : dropIndex;

    // Insere na nova posição
    newItems.splice(adjustedDropIndex, 0, draggedItemData);

    // Atualiza as ordens
    const reorderedItems = newItems.map((item, index) => ({
      ...item,
      order: index,
    }));

    onReorder(reorderedItems);

    setDraggedItem(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {items.map((item, index) => (
        <div
          key={item._id || item.id}
          className={`relative transition-all duration-200 ${
            draggedItem?.index === index ? "opacity-50 transform scale-95" : ""
          } ${dragOverIndex === index ? "border-t-2 border-blue-500" : ""}`}
          onDragOver={handleDragOver}
          onDragEnter={(e) => handleDragEnter(e, index)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, index)}
        >
          <div className="flex items-center group">
            {/* Drag Handle */}
            {dragHandle && (
              <div
                draggable
                onDragStart={(e) => handleDragStart(e, item, index)}
                onDragEnd={handleDragEnd}
                className="flex-shrink-0 p-2 cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity"
                title="Arrastar para reordenar"
              >
                <svg
                  className="w-4 h-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zM8 5a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 4a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1zm0 4a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                </svg>
              </div>
            )}

            {/* Row Content */}
            <div className="flex-1">{renderRow(item, index)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
