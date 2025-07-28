import { useMemo } from "react";
import get from "lodash.get";

/**
 * Hook para gerar colunas de tabela a partir de um Content Type
 * e uma função para extrair valores aninhados dos itens.
 * @param {object} contentType - O objeto Content Type com a propriedade 'fields'.
 */
export function useTableColumns(contentType) {
  console.log("useTableColumns received contentType:", contentType);
  const columns = useMemo(() => {
    if (!contentType || !Array.isArray(contentType.addons)) {
      return [];
    }

    const generatedColumns = contentType.addons
      .filter((field) => field.showInTable !== false) // Filtra campos que não devem aparecer
      .map((field) => ({
        key: `data.${field.id}`,
        label: field.label,
      }));

    // Adicionar a coluna de título padrão, se não estiver já definida nos campos.
    if (
      !generatedColumns.some((c) => c.key === "data.title" || c.key === "title")
    ) {
      generatedColumns.unshift({ key: "title", label: "Título" });
    }

    return generatedColumns;
  }, [contentType]);

  /**
   * Extrai um valor de um objeto, possivelmente aninhado, usando uma string de chave.
   * Ex: getColumnValue(item, 'data.author.name')
   * @param {object} item - O objeto do item.
   * @param {string} columnKey - A chave da coluna (ex: 'title', 'data.description').
   * @returns {*} O valor encontrado ou uma string vazia.
   */
  const getColumnValue = (item, columnKey) => {
    return get(item, columnKey, "");
  };

  return { columns, getColumnValue };
}
