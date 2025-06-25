"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function ContentTypeForm({ contentType, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: contentType?.name || "",
    slug: contentType?.slug || "",
    description: contentType?.description || "",
    icon: contentType?.icon || "folder",
    addons: contentType?.addons || [],
    createDefaultSection: true,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAddonChange = (index, field, value) => {
    const newAddons = [...formData.addons];
    newAddons[index][field] = value;
    setFormData((prev) => ({ ...prev, addons: newAddons }));
  };

  const addAddon = () => {
    setFormData((prev) => ({
      ...prev,
      addons: [
        ...prev.addons,
        { id: uuidv4(), name: "", type: "textInput", required: false },
      ],
    }));
  };

  const removeAddon = (index) => {
    const newAddons = formData.addons.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, addons: newAddons }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <Input
          label="Nome do Content Type"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <Input
          label="Slug (API Identifier)"
          name="slug"
          value={formData.slug}
          onChange={handleChange}
          placeholder="Ex: blog-posts (opcional, será gerado automaticamente)"
        />
        <Input
          label="Descrição"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />
        <div className="pt-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              name="createDefaultSection"
              checked={formData.createDefaultSection}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Criar uma Section no menu para este Content Type
            </span>
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-7">
            Recomendado. Desmarque apenas se for usar este Content Type em
            múltiplas Sections customizadas.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Add-ons (Campos)
        </h3>
        <div className="space-y-4">
          {formData.addons.map((addon, index) => (
            <div
              key={addon.id}
              className="p-4 border rounded-md dark:border-gray-700 space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Nome do Campo"
                  value={addon.name}
                  onChange={(e) =>
                    handleAddonChange(index, "name", e.target.value)
                  }
                  required
                />
                <div className="flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo do Campo
                  </label>
                  <select
                    value={addon.type}
                    onChange={(e) =>
                      handleAddonChange(index, "type", e.target.value)
                    }
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  >
                    <option value="textInput">Texto Curto</option>
                    <option value="textarea">Texto Longo</option>
                    <option value="imageUpload">Upload de Imagem</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={addon.required}
                    onChange={(e) =>
                      handleAddonChange(index, "required", e.target.checked)
                    }
                    className="rounded"
                  />
                  <span>Obrigatório</span>
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="small"
                  onClick={() => removeAddon(index)}
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={addAddon}
          className="mt-4"
        >
          Adicionar Campo
        </Button>
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          Salvar Content Type
        </Button>
      </div>
    </form>
  );
}
