"use client";

import { useState, useEffect } from "react";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import CloudinaryUploadField from "@/components/ui/CloudinaryUploadField";
import CloudinaryGalleryField from "@/components/ui/CloudinaryGalleryField";
import { useWorkspace } from "@/contexts/WorkspaceContext";

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
    data: item?.data || {},
  });
  const [loading, setLoading] = useState(false);

  const workspaceSlug = currentWorkspace?.slug || null;
  const sectionSlug = section?.slug || null;

  useEffect(() => {
    if (!item && contentType?.addons) {
      const initialData = {};
      contentType.addons.forEach((addon) => {
        if (addon.type === "textInput" || addon.type === "textarea") {
          initialData[addon.id] = "";
        } else if (addon.type === "imageUpload") {
          initialData[addon.id] = null;
        } else if (addon.type === "dateInput") {
          initialData[addon.id] = "";
        } else if (addon.type === "selectInput") {
          initialData[addon.id] = "";
        } else if (addon.type === "numberInput") {
          initialData[addon.id] = "";
        } else if (addon.type === "checkboxInput") {
          initialData[addon.id] = false;
        } else if (addon.type === "cloudinaryUpload") {
          initialData[addon.id] = "";
        } else if (addon.type === "cloudinaryGallery") {
          initialData[addon.id] = [];
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

    if (type === "file" && files?.[0]) {
      setFormData((prev) => ({
        ...prev,
        data: { ...prev.data, [name]: files[0].name },
      }));
    } else {
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

  const isEditing = !!item;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Seção: Informações Básicas */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Informações Básicas
        </h3>

        {/* Organização automática sem mostrar detalhes técnicos */}

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
            switch (addon.type) {
              case "cloudinaryUpload":
                return (
                  <CloudinaryUploadField
                    key={addon.id}
                    addon={addon}
                    value={formData.data[addon.id] || ""}
                    onChange={handleAddonChange}
                    required={addon.required}
                    workspaceSlug={workspaceSlug}
                    sectionSlug={sectionSlug}
                  />
                );

              case "cloudinaryGallery":
                return (
                  <CloudinaryGalleryField
                    key={addon.id}
                    addon={addon}
                    value={formData.data[addon.id] || []}
                    onChange={handleAddonChange}
                    required={addon.required}
                    workspaceSlug={workspaceSlug}
                    sectionSlug={sectionSlug}
                  />
                );

              case "textInput":
                return (
                  <div key={addon.id} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {addon.name}{" "}
                      {addon.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    {addon.helpText && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {addon.helpText}
                      </p>
                    )}
                    <input
                      type="text"
                      name={addon.id}
                      value={formData.data[addon.id] || ""}
                      onChange={handleAddonChange}
                      placeholder={
                        addon.placeholder ||
                        `Digite ${addon.name.toLowerCase()}...`
                      }
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                      required={addon.required}
                    />
                  </div>
                );

              case "textarea":
                return (
                  <div key={addon.id} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {addon.name}{" "}
                      {addon.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    {addon.helpText && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {addon.helpText}
                      </p>
                    )}
                    <textarea
                      name={addon.id}
                      value={formData.data[addon.id] || ""}
                      onChange={handleAddonChange}
                      placeholder={
                        addon.placeholder ||
                        `Digite ${addon.name.toLowerCase()}...`
                      }
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors resize-y"
                      required={addon.required}
                    />
                  </div>
                );

              case "imageUpload":
                return (
                  <div key={addon.id} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {addon.name}{" "}
                      {addon.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    {addon.helpText && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {addon.helpText}
                      </p>
                    )}
                    <input
                      type="file"
                      name={addon.id}
                      onChange={handleAddonChange}
                      accept="image/*"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors"
                      required={addon.required && !formData.data[addon.id]}
                    />
                    {formData.data[addon.id] && (
                      <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded-md">
                        <p className="text-sm text-green-700 dark:text-green-300">
                          ✅ Arquivo atual: {formData.data[addon.id]}
                        </p>
                      </div>
                    )}
                  </div>
                );

              case "dateInput":
                return (
                  <div key={addon.id} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {addon.name}{" "}
                      {addon.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    {addon.helpText && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {addon.helpText}
                      </p>
                    )}
                    <input
                      type="date"
                      name={addon.id}
                      value={formData.data[addon.id] || ""}
                      onChange={handleAddonChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                      required={addon.required}
                    />
                  </div>
                );

              case "selectInput":
                const options = addon.config?.options || [
                  { value: "option1", label: "Opção 1" },
                  { value: "option2", label: "Opção 2" },
                  { value: "option3", label: "Opção 3" },
                ];
                return (
                  <div key={addon.id} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {addon.name}{" "}
                      {addon.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    {addon.helpText && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {addon.helpText}
                      </p>
                    )}
                    <select
                      name={addon.id}
                      value={formData.data[addon.id] || ""}
                      onChange={handleAddonChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                      required={addon.required}
                    >
                      <option value="">Selecione...</option>
                      {options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                );

              case "numberInput":
                return (
                  <div key={addon.id} className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {addon.name}{" "}
                      {addon.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </label>
                    {addon.helpText && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                        {addon.helpText}
                      </p>
                    )}
                    <input
                      type="number"
                      name={addon.id}
                      value={formData.data[addon.id] || ""}
                      onChange={handleAddonChange}
                      min={addon.config?.min}
                      max={addon.config?.max}
                      step={addon.config?.step || 1}
                      placeholder={addon.placeholder || "Digite um número..."}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-colors"
                      required={addon.required}
                    />
                  </div>
                );

              case "checkboxInput":
                return (
                  <div key={addon.id} className="mb-4">
                    <div className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        name={addon.id}
                        checked={formData.data[addon.id] || false}
                        onChange={(e) => {
                          const { name, checked } = e.target;
                          setFormData((prev) => ({
                            ...prev,
                            data: { ...prev.data, [name]: checked },
                          }));
                        }}
                        className="mt-1 w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 transition-colors"
                      />
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          {addon.name}{" "}
                          {addon.required && (
                            <span className="text-red-500">*</span>
                          )}
                        </label>
                        {addon.helpText && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {addon.helpText}
                          </p>
                        )}
                      </div>
                    </div>
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
