"use client";

import React, { useState } from "react";
import Button from "@/components/ui/Button";
import Link from "next/link";
import { DragDropTable } from "@/components/ui/DragDropTable";
import { fetchWithWorkspace } from "@/lib/api";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export function ModernSectionsTable({
  sections = [],
  contentTypes = [],
  onEdit,
  onDelete,
  onReorder,
  loading = false,
}) {
  const { currentWorkspace } = useWorkspace();
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [isReordering, setIsReordering] = useState(false);
  const [reorderMode, setReorderMode] = useState(false);

  const orderedSections = React.useMemo(() => {
    return [...sections].sort((a, b) => (a.order || 0) - (b.order || 0));
  }, [sections]);

  const sortedSections = React.useMemo(() => {
    if (reorderMode) return orderedSections;

    let sortableSections = [...orderedSections];
    if (sortConfig.key) {
      sortableSections.sort((a, b) => {
        let aValue = a[sortConfig.key] || "";
        let bValue = b[sortConfig.key] || "";

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
  }, [orderedSections, contentTypes, sortConfig, reorderMode]);

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const handleReorder = async (reorderedSections) => {
    try {
      setIsReordering(true);

      const response = await fetchWithWorkspace("/api/sections/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sections: reorderedSections,
          workspaceId: currentWorkspace?._id,
        }),
      });

      if (!response.ok) {
        throw new Error("Falha ao reordenar sections");
      }

      if (onReorder) {
        onReorder(reorderedSections);
      }

      console.log("✅ Sections reordenadas com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao reordenar:", error);
      alert("Erro ao reordenar sections. Tente novamente.");
    } finally {
      setIsReordering(false);
    }
  };

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

  const contentTypeMap = React.useMemo(() => {
    return contentTypes.reduce((acc, ct) => {
      acc[ct._id] = ct;
      return acc;
    }, {});
  }, [contentTypes]);

  const renderSectionRow = (section, index) => (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-4">
            {reorderMode && (
              <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-sm font-medium">
                {index + 1}
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  {section.name}
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  /{section.slug}
                </span>
                {contentTypeMap[section.contentTypeId] && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                    {contentTypeMap[section.contentTypeId].name}
                  </span>
                )}
                {getStatusBadge(section.isActive)}
              </div>
              {section.description && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {section.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {!reorderMode && (
          <div className="flex space-x-2">
            <Link href={`/dashboard/sections/${section.slug}`}>
              <Button variant="outline" size="small">
                {icons.view}
                <span className="ml-1 hidden sm:inline">Ver</span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="small"
              onClick={() => onEdit?.(section)}
            >
              {icons.edit}
              <span className="ml-1 hidden sm:inline">Editar</span>
            </Button>
            <Button
              variant="outline"
              size="small"
              onClick={() => onDelete?.(section._id)}
              className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
            >
              {icons.delete}
              <span className="ml-1 hidden sm:inline">Deletar</span>
            </Button>
          </div>
        )}
      </div>
    </div>
  );

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
    reorder: (
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
          d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
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
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Sections ({sections.length})
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {reorderMode
                ? "Arraste as sections para reordenar o menu"
                : "Gerencie suas áreas de conteúdo"}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant={reorderMode ? "primary" : "outline"}
              size="small"
              onClick={() => setReorderMode(!reorderMode)}
              disabled={isReordering}
            >
              {icons.reorder}
              <span className="ml-2">
                {reorderMode ? "Finalizar" : "Reordenar Menu"}
              </span>
            </Button>
          </div>
        </div>

        {reorderMode ? (
          <div className="space-y-2">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3 mb-4">
              <div className="flex items-center space-x-2">
                <svg
                  className="w-5 h-5 text-blue-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Modo Reordenação:</strong> Arraste as sections pelos
                  ícones ⋮⋮ para definir a ordem no menu. As mudanças são salvas
                  automaticamente.
                </p>
              </div>
            </div>

            <DragDropTable
              items={sortedSections}
              onReorder={handleReorder}
              renderRow={renderSectionRow}
              className="space-y-2"
            />

            {isReordering && (
              <div className="text-center py-4">
                <div className="inline-flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm">Salvando nova ordem...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-100 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => requestSort("order")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>#</span>
                      {icons.sort}
                    </div>
                  </th>

                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-100 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => requestSort("name")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Nome</span>
                      {icons.sort}
                    </div>
                  </th>

                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-100 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => requestSort("slug")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Slug</span>
                      {icons.sort}
                    </div>
                  </th>

                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-100 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => requestSort("contentType")}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Content Type</span>
                      {icons.sort}
                    </div>
                  </th>

                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-100 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    onClick={() => requestSort("isActive")}
                  >
                    <div className="flex items-center space-x-1">
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
                {sortedSections.map((section, index) => (
                  <tr
                    key={section._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="inline-flex items-center justify-center w-6 h-6 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-xs font-medium">
                          {(section.order || 0) + 1}
                        </span>
                      </div>
                    </td>

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

                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      /{section.slug}
                    </td>

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

                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(section.isActive)}
                    </td>

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
        )}
      </div>
    </div>
  );
}
