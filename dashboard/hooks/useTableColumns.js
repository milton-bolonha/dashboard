import { useState, useEffect } from "react";

/**
 * Hook para gerenciar colunas visíveis da tabela com persistência
 * @param {string} tableId - Identificador único da tabela (ex: sectionId)
 * @param {Array} availableColumns - Lista de colunas disponíveis
 * @param {Array} defaultVisible - Colunas visíveis por padrão
 */
export function useTableColumns(
  tableId,
  availableColumns = [],
  defaultVisible = []
) {
  const storageKey = `tableColumns_${tableId}`;

  // Estado das colunas visíveis
  const [visibleColumns, setVisibleColumns] = useState(() => {
    if (typeof window === "undefined") return defaultVisible;

    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Validar se as colunas ainda existem no contentType atual
        const validColumns =
          parsed.visibleColumns?.filter((colId) =>
            availableColumns.some((col) => col.id === colId)
          ) || [];
        return validColumns.length > 0 ? validColumns : defaultVisible;
      }
    } catch (error) {
      console.warn("Erro ao carregar configuração de colunas:", error);
    }

    return defaultVisible;
  });

  // Salvar no localStorage quando visibleColumns mudar
  useEffect(() => {
    if (typeof window === "undefined" || !tableId) return;

    try {
      const config = {
        visibleColumns,
        lastUpdated: Date.now(),
        tableId,
      };
      localStorage.setItem(storageKey, JSON.stringify(config));
    } catch (error) {
      console.warn("Erro ao salvar configuração de colunas:", error);
    }
  }, [visibleColumns, tableId, storageKey]);

  // Função para alternar visibilidade de uma coluna
  const toggleColumn = (columnId) => {
    setVisibleColumns((prev) => {
      if (prev.includes(columnId)) {
        return prev.filter((id) => id !== columnId);
      } else {
        return [...prev, columnId];
      }
    });
  };

  // Função para definir colunas visíveis
  const setColumns = (columnIds) => {
    setVisibleColumns(columnIds);
  };

  // Função para resetar para padrão
  const resetToDefault = () => {
    setVisibleColumns(defaultVisible);
  };

  // Função para mostrar todas as colunas
  const showAllColumns = () => {
    setVisibleColumns(availableColumns.map((col) => col.id));
  };

  // Função para ocultar todas as colunas opcionais
  const hideAllColumns = () => {
    setVisibleColumns([]);
  };

  // Verificar se uma coluna está visível
  const isColumnVisible = (columnId) => {
    return visibleColumns.includes(columnId);
  };

  // Filtrar colunas disponíveis para mostrar apenas as visíveis
  const getVisibleColumns = () => {
    return availableColumns.filter((col) => visibleColumns.includes(col.id));
  };

  return {
    visibleColumns,
    toggleColumn,
    setColumns,
    resetToDefault,
    showAllColumns,
    hideAllColumns,
    isColumnVisible,
    getVisibleColumns,
    availableColumns,
  };
}
