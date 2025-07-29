"use client";

import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Link from "next/link";

export default function ItemCard({
  item,
  section,
  onEdit,
  onDelete,
  contentTypeName,
}) {
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
  };

  return (
    <Card>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <h3
              className="font-bold text-gray-900 dark:text-white truncate"
              title={item.title}
            >
              {item.title}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Content Type:{" "}
              <span className="font-medium text-gray-700 dark:text-gray-300">
                {contentTypeName || "..."}
              </span>
            </p>
          </div>
          <div className="flex space-x-2 flex-shrink-0 ml-4">
            <Button variant="outline" size="small" onClick={() => onEdit(item)}>
              {icons.edit}
              <span className="ml-1 hidden sm:inline">Editar</span>
            </Button>
            <Button
              variant="outline"
              size="small"
              onClick={() => onDelete(item._id)}
              className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
            >
              {icons.delete}
              <span className="ml-1 hidden sm:inline">Deletar</span>
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
