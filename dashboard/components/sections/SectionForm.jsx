"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { IconPicker } from "@/components/ui/IconPicker";

export default function SectionForm({
  section,
  contentTypes,
  onSubmit,
  onCancel,
}) {
  const [formData, setFormData] = useState({
    name: section?.name || "",
    slug: section?.slug || "",
    description: section?.description || "",
    icon: section?.icon || "folder",
    order: section?.order || 0,
    contentTypeId:
      section?.contentTypeId ||
      (contentTypes.length > 0 ? contentTypes[0]._id : ""),
    isActive: section?.isActive !== undefined ? section.isActive : true,
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
          label="Nome da Section"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <div>
          <Input
            label="Slug (URL identificador)"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            placeholder="Ex: minha-secao (opcional, será gerado automaticamente)"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            O slug deve ser único. Se deixar vazio, será gerado automaticamente
            baseado no nome.
          </p>
        </div>

        <div>
          <Input
            label="Ordem no Menu"
            name="order"
            type="number"
            value={formData.order}
            onChange={handleChange}
            placeholder="0"
            min="0"
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Define a posição desta section no menu lateral. Menor número = mais
            acima.
          </p>
        </div>

        <Input
          label="Descrição (opcional)"
          name="description"
          value={formData.description}
          onChange={handleChange}
          placeholder="Descreva o propósito desta section..."
        />

        <IconPicker
          selectedIcon={formData.icon}
          onIconSelect={(icon) => setFormData((prev) => ({ ...prev, icon }))}
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content Type
          </label>
          <select
            name="contentTypeId"
            value={formData.contentTypeId}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required
          >
            {contentTypes.map((contentType) => (
              <option key={contentType._id} value={contentType._id}>
                {contentType.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <div className="flex items-center space-x-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="isActive"
                value="true"
                checked={formData.isActive === true}
                onChange={() =>
                  setFormData((prev) => ({ ...prev, isActive: true }))
                }
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Active
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="isActive"
                value="false"
                checked={formData.isActive === false}
                onChange={() =>
                  setFormData((prev) => ({ ...prev, isActive: false }))
                }
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Inactive
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          {section ? "Atualizar" : "Criar"} Section
        </Button>
      </div>
    </form>
  );
}
