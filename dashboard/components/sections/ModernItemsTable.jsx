"use client";

import React from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { PencilIcon, TrashIcon } from "@heroicons/react/24/solid";
import { useTableColumns } from "@/hooks/useTableColumns";
import { buildUrl } from "@/lib/cloudinary";

export function ModernItemsTable({
  items = [],
  section,
  contentType,
  onDelete,
  deletingItemId,
  loading = false,
}) {
  const { columns, getColumnValue } = useTableColumns(contentType);

  if (loading) {
    return <div>Carregando itens...</div>;
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Nenhum item encontrado nesta seção.</p>
        <div className="mt-4">
          <Link href={`/dashboard/sections/${section.slug}/items/new/edit`}>
            <Button>Criar o Primeiro Item</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
        <thead className="bg-gray-50 dark:bg-gray-800">
          <tr>
            {columns &&
              columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {col.label}
                </th>
              ))}
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {items.map((item) => (
            <tr key={item._id}>
              {columns &&
                columns.map((col) => (
                  <td
                    key={col.key}
                    className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200"
                  >
                    {col.key === "data.image" ||
                    col.key === "data.image_url" ? (
                      <img
                        src={buildUrl(getColumnValue(item, col.key))}
                        alt={item.title || "Imagem do item"}
                        className="h-10 w-10 rounded-md object-cover"
                      />
                    ) : (
                      getColumnValue(item, col.key)
                    )}
                  </td>
                ))}
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-4">
                  <Link
                    href={`/dashboard/sections/${section.slug}/items/${item._id}/edit`}
                  >
                    <Button variant="outline" size="small">
                      <PencilIcon className="h-4 w-4" />
                      <span className="ml-2">Edit</span>
                    </Button>
                  </Link>
                  <Button
                    onClick={() => onDelete(item._id)}
                    variant="destructive"
                    size="small"
                    disabled={deletingItemId === item._id}
                  >
                    <TrashIcon className="h-4 w-4" />
                    <span className="ml-2">
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
  );
}
