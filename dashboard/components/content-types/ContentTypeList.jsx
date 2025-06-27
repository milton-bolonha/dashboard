"use client";

import Button from "@/components/ui/Button";

export default function ContentTypeList({ contentTypes, onEdit, onDelete }) {
  if (contentTypes.length === 0) {
    return (
      <div className="text-center py-10 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          Nenhum Content Type encontrado
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Comece criando um novo para estruturar seu conteúdo.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow overflow-hidden rounded-md">
      <ul role="list" className="divide-y divide-gray-200 dark:divide-gray-700">
        {contentTypes.map((contentType) => (
          <li key={contentType._id}>
            <div className="px-4 py-4 sm:px-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400 truncate">
                  {contentType.name}
                </p>
                <div className="ml-2 flex-shrink-0 flex">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {contentType.addons?.length || 0} addons
                  </span>
                </div>
              </div>
              <div className="mt-2 sm:flex sm:justify-between">
                <div className="sm:flex">
                  <p className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <svg
                      className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400 dark:text-gray-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                    /{contentType.slug}
                  </p>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 space-x-2">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={() => onEdit(contentType)}
                  >
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="small"
                    onClick={() => onDelete(contentType._id)}
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
