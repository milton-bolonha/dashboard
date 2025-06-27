"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function DynamicItemForm({
  item,
  section,
  contentType,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    title: item?.title || "",
    status: item?.status || "rascunho",
    data: item?.data || {},
  });
  const [loading, setLoading] = useState(false);

  // Inicializar dados dos addons quando contentType mudar
  useEffect(() => {
    if (!item && contentType?.addons) {
      const initialData = {};
      contentType.addons.forEach((addon) => {
        if (addon.type === "textInput" || addon.type === "textarea") {
          initialData[addon.id] = "";
        } else if (addon.type === "imageUpload") {
          initialData[addon.id] = null;
        }
      });
      setFormData((prev) => ({ ...prev, data: initialData }));
    }
  }, [contentType, item]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddonChange = (e) => {
    const { name, value, type, files } = e.target;

    // Para upload de arquivos
    if (type === "file" && files?.[0]) {
      setFormData((prev) => ({
        ...prev,
        data: { ...prev.data, [name]: files[0].name },
      }));
    } else {
      // Para campos normais
      setFormData((prev) => ({
        ...prev,
        data: { ...prev.data, [name]: value },
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validar campos obrigatórios dos addons
      if (contentType?.addons) {
        for (const addon of contentType.addons) {
          if (addon.required && !formData.data[addon.id]) {
            alert(`O campo "${addon.name}" é obrigatório.`);
            setLoading(false);
            return;
          }
        }
      }

      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  // CONFIGURAÇÃO: Verificar se título customizado está definido nos addons
  const titleAddon = contentType?.addons?.find(
    (addon) =>
      addon.type === "textInput" &&
      (addon.id === "title" ||
        addon.id === "titulo" ||
        addon.name?.toLowerCase().includes("título"))
  );

  // Se há addon de título customizado, usar ele em vez do padrão
  const useCustomTitle = !!titleAddon;
  const titleLabel = titleAddon?.name || "Título do Item";

  const isEditing = !!item;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seção: Informações Básicas */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Informações Básicas
        </h3>

        {/* Título - Apenas se NÃO há addon customizado */}
        {!useCustomTitle && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título do Item *
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
        )}

        {/* Status */}
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
            <option value="rascunho">Rascunho</option>
            <option value="publicado">Publicado</option>
            <option value="arquivado">Arquivado</option>
          </select>
        </div>
      </div>

      {/* Seção: Campos Customizados */}
      {contentType?.addons && contentType.addons.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Campos Customizados
            <span className="text-sm text-gray-500 ml-2">
              ({contentType.name})
            </span>
          </h3>

          {contentType.addons.map((addon) => {
            // Se este addon é para título e estamos usando título customizado
            if (useCustomTitle && addon === titleAddon) {
              return (
                <div key={addon.id} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {addon.name} {addon.required && "*"}
                    <span className="text-xs text-blue-600 ml-1">
                      (será usado como título principal)
                    </span>
                  </label>
                  <input
                    type="text"
                    name={addon.id}
                    value={formData.data[addon.id] || ""}
                    onChange={handleAddonChange}
                    placeholder={
                      addon.placeholder ||
                      `Digite ${addon.name.toLowerCase()}...`
                    }
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required={addon.required}
                  />
                </div>
              );
            }

            // Renderizar addon normal
            switch (addon.type) {
              case "textInput":
                return (
                  <div key={addon.id} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {addon.name} {addon.required && "*"}
                    </label>
                    <input
                      type="text"
                      name={addon.id}
                      value={formData.data[addon.id] || ""}
                      onChange={handleAddonChange}
                      placeholder={
                        addon.placeholder ||
                        `Digite ${addon.name.toLowerCase()}...`
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required={addon.required}
                    />
                  </div>
                );

              case "textarea":
                return (
                  <div key={addon.id} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {addon.name} {addon.required && "*"}
                    </label>
                    <textarea
                      name={addon.id}
                      value={formData.data[addon.id] || ""}
                      onChange={handleAddonChange}
                      placeholder={
                        addon.placeholder ||
                        `Digite ${addon.name.toLowerCase()}...`
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required={addon.required}
                    />
                  </div>
                );

              case "imageUpload":
                return (
                  <div key={addon.id} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {addon.name} {addon.required && "*"}
                    </label>
                    <input
                      type="file"
                      name={addon.id}
                      onChange={handleAddonChange}
                      accept="image/*"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      required={addon.required && !formData.data[addon.id]}
                    />
                    {formData.data[addon.id] && (
                      <p className="text-sm text-gray-500 mt-1">
                        Arquivo atual: {formData.data[addon.id]}
                      </p>
                    )}
                  </div>
                );

              default:
                return null;
            }
          })}
        </div>
      )}

      {/* Botões */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 cursor-pointer"
        >
          {loading ? "Salvando..." : item ? "Atualizar Item" : "Criar Item"}
        </button>
      </div>
    </form>
  );
}
