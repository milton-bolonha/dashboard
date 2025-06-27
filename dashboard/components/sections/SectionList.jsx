"use client";

import Button from "@/components/ui/Button";
import Link from "next/link";

export default function SectionList({
  sections,
  contentTypes,
  onEdit,
  onDelete,
}) {
  if (sections.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Nenhuma Section encontrada
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Crie uma nova section para começar a gerenciar seus items.
        </p>
      </div>
    );
  }

  const contentTypeMap = contentTypes.reduce((acc, ct) => {
    acc[ct._id] = ct.name;
    return acc;
  }, {});

  return (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-md">
      <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
        {sections.map((section) => (
          <li key={section._id}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <Link href={`/dashboard/sections/${section.slug}`}>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate hover:underline">
                    {section.name}
                  </p>
                </Link>
                <div className="ml-2 flex-shrink-0 flex">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    {contentTypeMap[section.contentTypeId] || "Desconhecido"}
                  </span>
                </div>
              </div>
              <div className="mt-2 sm:flex sm:justify-between">
                <div className="sm:flex">
                  <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    /{section.slug}
                  </p>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 space-x-2">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => onEdit(section)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => onDelete(section._id)}
                  >
                    Deletar
                  </Button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
