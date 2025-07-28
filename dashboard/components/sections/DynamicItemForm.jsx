"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import RecursiveFormRenderer from "./RecursiveFormRenderer"; // Importar o novo componente
import { useWorkspace } from "@/contexts/WorkspaceContext";
import get from "lodash/get";
import set from "lodash/set";

export default function DynamicItemForm({
  item,
  section,
  contentType,
  onSubmit,
  onCancel,
}) {
  const { currentWorkspace } = useWorkspace();
  const [formData, setFormData] = useState({
    title: item?.title || "",
    status: item?.status || "draft",
    ...item?.data,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (item) {
      const initialData = {
        title: item.title || item.name || "",
        status: item.status || "draft",
        ...item.data,
      };
      setFormData(initialData);
    } else if (contentType?.addons) {
      setFormData({ title: "", status: "draft" });
    }
  }, [item, contentType]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddonChange = (e) => {
    const { name, value } = e.target;
    const newFormData = { ...formData };
    set(newFormData, name, value);
    setFormData(newFormData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { title, status, ...data } = formData;
    await onSubmit({ title, status, data });
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações Básicas */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Informações Básicas
        </h3>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Título do Item *
            <span className="text-xs text-gray-500 ml-1">
              (usado na listagem e URL)
            </span>
          </label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            placeholder="Digite o título do item..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            required
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="draft">Rascunho</option>
            <option value="published">Publicado</option>
            <option value="archived">Arquivado</option>
          </select>
        </div>
      </div>

      {/* Campos Customizados */}
      {contentType?.addons?.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Campos Customizados ({contentType.name})
          </h3>
          <RecursiveFormRenderer
            addons={contentType.addons}
            formData={formData.data} // Passa apenas a parte 'data' para os campos customizados
            handleAddonChange={(e) => {
              const { name, value } = e.target;
              const newFormData = { ...formData };
              set(newFormData, `data.${name}`, value); // Adiciona 'data.' ao path
              setFormData(newFormData);
            }}
            workspaceSlug={currentWorkspace?.slug}
            sectionSlug={section?.slug}
            path={[]} // Começa o path a partir de 'data'
          />
        </div>
      )}

      {/* Botões */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
        <Button type="button" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {item ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}
