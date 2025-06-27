"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";

export function ModernItemsTable({
  items = [],
  section,
  contentType,
  onEdit,
  onDelete,
  deletingItemId,
  loading = false,
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Função para ordenar items
  const sortedItems = React.useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const aValue = a[sortConfig.key] || "";
        const bValue = b[sortConfig.key] || "";

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Função para renderizar badge de status
  const getStatusBadge = (status) => {
    const styles = {
      draft:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
      published:
        "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
      archived:
        "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
    };

    const labels = {
      draft: "Rascunho",
      published: "Publicado",
      archived: "Arquivado",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          styles[status] || styles.draft
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  // Renderizar valor do campo baseado no tipo
  const renderFieldValue = (item, addon) => {
    const value = item.data?.[addon.name] || item[addon.name] || "";

    switch (addon.type) {
      case "dateInput":
        return value ? new Date(value).toLocaleDateString("pt-BR") : "-";
      case "checkboxInput":
        return value ? "✅ Sim" : "❌ Não";
      case "imageUpload":
        return value ? (
          <img
            src={value}
            alt={addon.name}
            className="w-8 h-8 rounded object-cover"
          />
        ) : (
          "-"
        );
      case "numberInput":
        return value ? Number(value).toLocaleString("pt-BR") : "-";
      default:
        return value || "-";
    }
  };

  // Ícones
  const icons = {
    edit: (
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
          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
        />
      </svg>
    ),
    delete: (
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
          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
        />
      </svg>
    ),
    sort: (
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
          d="M8 9l4-4 4 4m0 6l-4 4-4-4"
        />
      </svg>
    ),
  };

  if (!items.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700">
            <svg
              className="h-6 w-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707L13.414 3.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            Nenhum item encontrado
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comece criando o primeiro item para esta section.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Items ({items.length})
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Visualize e gerencie os items desta section
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {/* Coluna ID/Title sempre presente */}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => requestSort("title")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Item</span>
                    {icons.sort}
                  </div>
                </th>

                {/* Coluna de Status */}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => requestSort("status")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    {icons.sort}
                  </div>
                </th>

                {/* Colunas dos addons do Content Type */}
                {contentType?.addons?.map((addon) => (
                  <th
                    key={addon.id}
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => requestSort(addon.name)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{addon.name}</span>
                      {icons.sort}
                    </div>
                  </th>
                ))}

                {/* Coluna de ações */}
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedItems.map((item) => (
                <tr
                  key={item._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {/* Coluna principal (title ou first addon) */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {item.title || item.name || `Item ${item._id?.slice(-6)}`}
                    </div>
                    {item.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {item.description}
                      </div>
                    )}
                  </td>

                  {/* Coluna de Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(item.status)}
                  </td>

                  {/* Colunas dos addons */}
                  {contentType?.addons?.map((addon) => (
                    <td
                      key={addon.id}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                    >
                      {renderFieldValue(item, addon)}
                    </td>
                  ))}

                  {/* Coluna de ações */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => onEdit?.(item)}
                        className="inline-flex items-center"
                      >
                        {icons.edit}
                        <span className="ml-1 hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => onDelete?.(item)}
                        loading={deletingItemId === item._id}
                        className="inline-flex items-center text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                      >
                        {icons.delete}
                        <span className="ml-1 hidden sm:inline">Deletar</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
