"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";

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
    contentTypeId:
      section?.contentTypeId ||
      (contentTypes.length > 0 ? contentTypes[0]._id : ""),
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
          <label
            htmlFor="contentTypeId"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Content Type
          </label>
          <select
            id="contentTypeId"
            name="contentTypeId"
            value={formData.contentTypeId}
            onChange={handleChange}
            required
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            {contentTypes.map((ct) => (
              <option key={ct._id} value={ct._id}>
                {ct.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading}>
          Salvar Section
        </Button>
      </div>
    </form>
  );
}
