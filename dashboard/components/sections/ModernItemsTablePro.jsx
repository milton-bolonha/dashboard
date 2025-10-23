"use client";

import React, { useState } from "react";
import get from "lodash.get";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { useTableColumns } from "@/hooks/useTableColumns";
import { buildUrl } from "@/lib/cloudinary-urls";

export function ModernItemsTablePro({
  items = [],
  section,
  contentType,
  onEdit,
  onDelete,
  deletingItemId,
  loading = false,
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const { columns, getColumnValue } = useTableColumns(contentType);

  const sortedItems = React.useMemo(() => {
    let sortableItems = [...items];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        // Use a função getColumnValue para acessar dados possivelmente aninhados
        const aValue = getColumnValue(a, sortConfig.key) || "";
        const bValue = getColumnValue(b, sortConfig.key) || "";

        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc"
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [items, sortConfig, getColumnValue]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getStatusBadge = (status) => {
    const statusStyles = {
      published:
        "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300",
      draft:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300",
      archived:
        "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300",
    };
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
          statusStyles[status] || statusStyles.archived
        }`}
      >
        {status || "N/A"}
      </span>
    );
  };

  const icons = {
    sort: (
      <svg
        className="w-4 h-4 ml-1 text-gray-400 group-hover:text-gray-500"
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
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Carregando itens...</p>
      </div>
    );
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
          Nenhum item encontrado
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Crie o primeiro item para esta seção.
        </p>
        <div className="mt-4">
          <Link href={`/dashboard/sections/${section.slug}/items/new/edit`}>
            <Button variant="primary">Criar Item</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer group"
                  onClick={() => requestSort(col.key)}
                >
                  <div className="flex items-center">
                    <span>{col.label}</span>
                    {icons.sort}
                  </div>
                </th>
              ))}
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider cursor-pointer group"
                onClick={() => requestSort("status")}
              >
                <div className="flex items-center">
                  <span>Status</span>
                  {icons.sort}
                </div>
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Ações</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {sortedItems.map((item) => (
              <tr
                key={item._id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200"
                  >
                    {/* Renderização especial para imagens */}
                    {col.key.includes("image") ? (
                      <img
                        src={buildUrl(getColumnValue(item, col.key))}
                        alt={item.title || "Imagem do item"}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      <span className="font-medium text-gray-900 dark:text-white">
                        {getColumnValue(item, col.key)}
                      </span>
                    )}
                  </td>
                ))}
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(item.status)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => onEdit(item)}
                    >
                      {icons.edit}
                      <span className="ml-1 hidden sm:inline">Editar</span>
                    </Button>
                    <Button
                      onClick={() => onDelete(item._id)}
                      variant="destructive-outline"
                      size="small"
                      disabled={deletingItemId === item._id}
                    >
                      {icons.delete}
                      <span className="ml-1 hidden sm:inline">
                        {deletingItemId === item._id ? "Deleting..." : "Delete"}
                      </span>
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
