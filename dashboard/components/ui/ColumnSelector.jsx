"use client";

import { useState, useRef, useEffect } from "react";
import Button from "./Button";

export function ColumnSelector({
  availableColumns = [],
  visibleColumns = [],
  onToggleColumn,
  onResetToDefault,
  onShowAll,
  onHideAll,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [shouldOpenUpward, setShouldOpenUpward] = useState(false);
  const buttonRef = useRef(null);

  const visibleCount = visibleColumns.length;
  const totalCount = availableColumns.length;

  // ✅ NOVO: Detectar se deve abrir para cima ou para baixo
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 280; // Altura estimada do dropdown (compacto)

      // Se não há espaço suficiente embaixo, abrir para cima
      const spaceBelow = viewportHeight - buttonRect.bottom;
      const shouldOpenUp =
        spaceBelow < dropdownHeight && buttonRect.top > dropdownHeight;

      setShouldOpenUpward(shouldOpenUp);
    }
  }, [isOpen]);

  return (
    <div className="relative">
      {/* Botão de trigger */}
      <Button
        ref={buttonRef}
        variant="outline"
        size="small"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center space-x-2"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
          />
        </svg>
        <span>
          Colunas ({visibleCount}/{totalCount})
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Overlay para fechar ao clicar fora */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Conteúdo do dropdown */}
          <div
            className={`absolute right-0 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 ${
              shouldOpenUpward ? "bottom-full mb-2" : "top-full mt-2"
            }`}
          >
            <div className="p-3">
              {/* Header compacto */}
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Colunas
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {visibleCount}/{totalCount}
                </span>
              </div>

              {/* Ações rápidas mais compactas */}
              <div className="flex space-x-1 mb-3">
                <button
                  onClick={onShowAll}
                  className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
                >
                  Todas
                </button>
                <button
                  onClick={onHideAll}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                >
                  Nenhuma
                </button>
                <button
                  onClick={() => {
                    onResetToDefault();
                    setIsOpen(false);
                  }}
                  className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors cursor-pointer"
                >
                  Padrão
                </button>
              </div>

              {/* Lista de colunas inline e compacta */}
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {availableColumns.map((column) => (
                  <label
                    key={column.id}
                    className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <input
                        type="checkbox"
                        checked={visibleColumns.includes(column.id)}
                        onChange={() => onToggleColumn(column.id)}
                        className="w-3.5 h-3.5 text-blue-600 rounded border-gray-300 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 flex-shrink-0 cursor-pointer"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {column.name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2 flex-shrink-0">
                      {column.type === "textInput" && "📝"}
                      {column.type === "textarea" && "📄"}
                      {column.type === "imageUpload" && "🖼️"}
                      {column.type === "dateInput" && "📅"}
                      {column.type === "selectInput" && "📋"}
                      {column.type === "numberInput" && "🔢"}
                      {column.type === "checkboxInput" && "☑️"}
                    </span>
                  </label>
                ))}
              </div>

              {/* Footer compacto */}
              <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors cursor-pointer"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
