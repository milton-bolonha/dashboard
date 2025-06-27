"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";

export function ModernContentTypesTable({
  contentTypes = [],
  onEdit,
  onDelete,
  loading = false,
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Função para ordenar content types
  const sortedContentTypes = React.useMemo(() => {
    let sortableContentTypes = [...contentTypes];
    if (sortConfig.key) {
      sortableContentTypes.sort((a, b) => {
        let aValue = a[sortConfig.key] || "";
        let bValue = b[sortConfig.key] || "";

        // Para addons count
        if (sortConfig.key === "addonsCount") {
          aValue = a.addons?.length || 0;
          bValue = b.addons?.length || 0;
        }

        if (aValue < bValue) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableContentTypes;
  }, [contentTypes, sortConfig]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Função para renderizar badge de addons
  const getAddonsBadge = (addonsCount) => {
    let color =
      "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300";

    if (addonsCount > 5) {
      color =
        "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300";
    } else if (addonsCount > 2) {
      color =
        "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300";
    } else if (addonsCount > 0) {
      color =
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300";
    }

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}
      >
        {addonsCount} {addonsCount === 1 ? "addon" : "addons"}
      </span>
    );
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
    schema: (
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
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  };

  if (!contentTypes.length) {
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
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            Nenhum content type encontrado
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Comece criando um novo para estruturar seu conteúdo.
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
            Content Types ({contentTypes.length})
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie as estruturas de dados do seu conteúdo
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {/* Coluna Nome */}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => requestSort("name")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Nome</span>
                    {icons.sort}
                  </div>
                </th>

                {/* Coluna Slug */}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => requestSort("slug")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Slug</span>
                    {icons.sort}
                  </div>
                </th>

                {/* Coluna Addons */}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => requestSort("addonsCount")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Addons</span>
                    {icons.sort}
                  </div>
                </th>

                {/* Coluna Criado */}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => requestSort("createdAt")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Criado</span>
                    {icons.sort}
                  </div>
                </th>

                {/* Coluna de ações */}
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedContentTypes.map((contentType) => (
                <tr
                  key={contentType._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {/* Coluna Nome */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white">
                          {icons.schema}
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {contentType.name}
                        </div>
                        {contentType.description && (
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {contentType.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Coluna Slug */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white font-mono">
                      {contentType.slug}
                    </div>
                  </td>

                  {/* Coluna Addons */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getAddonsBadge(contentType.addons?.length || 0)}
                  </td>

                  {/* Coluna Criado */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {contentType.createdAt
                      ? new Date(contentType.createdAt).toLocaleDateString(
                          "pt-BR"
                        )
                      : "—"}
                  </td>

                  {/* Coluna de ações */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => onEdit?.(contentType)}
                        className="inline-flex items-center"
                      >
                        {icons.edit}
                        <span className="ml-1 hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => onDelete?.(contentType._id)}
                        loading={loading}
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
