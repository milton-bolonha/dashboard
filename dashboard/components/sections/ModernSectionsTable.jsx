"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import Link from "next/link";

export function ModernSectionsTable({
  sections = [],
  contentTypes = [],
  onEdit,
  onDelete,
  loading = false,
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

  // Função para ordenar sections
  const sortedSections = React.useMemo(() => {
    let sortableSections = [...sections];
    if (sortConfig.key) {
      sortableSections.sort((a, b) => {
        let aValue = a[sortConfig.key] || "";
        let bValue = b[sortConfig.key] || "";

        // Para contentType, buscar o nome
        if (sortConfig.key === "contentType") {
          const aContentType = contentTypes.find(
            (ct) => ct._id === a.contentTypeId
          );
          const bContentType = contentTypes.find(
            (ct) => ct._id === b.contentTypeId
          );
          aValue = aContentType?.name || "";
          bValue = bContentType?.name || "";
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
    return sortableSections;
  }, [sections, contentTypes, sortConfig]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // Função para renderizar badge de status
  const getStatusBadge = (isActive) => {
    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isActive
            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300"
            : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300"
        }`}
      >
        {isActive ? "Ativo" : "Inativo"}
      </span>
    );
  };

  // Mapa de content types para busca rápida
  const contentTypeMap = React.useMemo(() => {
    return contentTypes.reduce((acc, ct) => {
      acc[ct._id] = ct;
      return acc;
    }, {});
  }, [contentTypes]);

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
    view: (
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
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
      </svg>
    ),
  };

  if (!sections.length) {
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
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            Nenhuma section encontrada
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Crie uma nova section para começar a gerenciar seus items.
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
            Sections ({sections.length})
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie suas áreas de conteúdo
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

                {/* Coluna Content Type */}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => requestSort("contentType")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Content Type</span>
                    {icons.sort}
                  </div>
                </th>

                {/* Coluna Status */}
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => requestSort("isActive")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
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
              {sortedSections.map((section) => (
                <tr
                  key={section._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {/* Coluna Nome */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {section.name}
                    </div>
                    {section.description && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {section.description}
                      </div>
                    )}
                  </td>

                  {/* Coluna Slug */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    /{section.slug}
                  </td>

                  {/* Coluna Content Type */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {contentTypeMap[section.contentTypeId] ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                        {contentTypeMap[section.contentTypeId].name}
                      </span>
                    ) : (
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        —
                      </span>
                    )}
                  </td>

                  {/* Coluna Status */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(section.isActive)}
                  </td>

                  {/* Coluna de ações */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Link href={`/dashboard/sections/${section.slug}`}>
                        <Button
                          variant="outline"
                          size="small"
                          className="inline-flex items-center"
                        >
                          {icons.view}
                          <span className="ml-1 hidden sm:inline">Ver</span>
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => onEdit?.(section)}
                        className="inline-flex items-center"
                      >
                        {icons.edit}
                        <span className="ml-1 hidden sm:inline">Editar</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => onDelete?.(section._id)}
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
