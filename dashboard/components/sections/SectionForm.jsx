"use client";

import { useState, useEffect } from "react";
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
    strategy: section?.strategy || "collection", // Padrão 'collection'
    description: section?.description || "",
    icon: section?.icon || "folder",
    order: section?.order || 0,
    contentTypeId: section?.contentTypeId || "", // Começar vazio
    status: section?.status || "draft", // ✅ CORREÇÃO: Usar status
    publicAccess: {
      isPublic: section?.publicAccess?.isPublic || false,
    },
  });
  const [loading, setLoading] = useState(false);
  const noContentTypes = !contentTypes || contentTypes.length === 0;

  // Efeito para sincronizar o contentTypeId quando a lista de contentTypes carregar
  useEffect(() => {
    // Só atualiza se for um formulário de CRIAÇÃO e o contentTypeId ainda não estiver setado
    if (!section && contentTypes.length > 0 && !formData.contentTypeId) {
      setFormData((prev) => ({
        ...prev,
        contentTypeId: contentTypes[0]._id,
      }));
    }
  }, [contentTypes, section, formData.contentTypeId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "publicAccess.isPublic") {
      setFormData((prev) => ({
        ...prev,
        publicAccess: { ...prev.publicAccess, isPublic: checked },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
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
            Tipo de Seção
          </label>
          <div className="space-y-2">
            <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600">
              <input
                type="radio"
                name="strategy"
                value="collection"
                checked={formData.strategy === "collection"}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm">
                <strong className="font-medium text-gray-900 dark:text-white">
                  Coleção de Múltiplos Itens
                </strong>
                <p className="text-gray-500 dark:text-gray-400">
                  Ideal para posts de blog, produtos, membros, etc.
                </p>
              </span>
            </label>
            <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600">
              <input
                type="radio"
                name="strategy"
                value="singleton"
                checked={formData.strategy === "singleton"}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm">
                <strong className="font-medium text-gray-900 dark:text-white">
                  Item Único
                </strong>
                <p className="text-gray-500 dark:text-gray-400">
                  Perfeito para configurações de uma página, como 'Header' ou
                  'Footer'.
                </p>
              </span>
            </label>
            <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600">
              <input
                type="radio"
                name="strategy"
                value="grouping"
                checked={formData.strategy === "grouping"}
                onChange={handleChange}
                className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
              />
              <span className="ml-3 text-sm">
                <strong className="font-medium text-gray-900 dark:text-white">
                  Agrupamento de Tipos Diferentes
                </strong>
                <p className="text-gray-500 dark:text-gray-400">
                  Ideal para configurações heterogêneas com múltiplos Content
                  Types.
                </p>
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Content Type
          </label>
          <select
            name="contentTypeId"
            value={formData.contentTypeId}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            required={formData.strategy !== "grouping"}
          >
            <option value="">Selecione um Content Type</option>
            {contentTypes.map((contentType) => (
              <option key={contentType._id} value={contentType._id}>
                {contentType.name}
              </option>
            ))}
          </select>
          {formData.strategy === "grouping" && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Para seções de agrupamento, o Content Type será definido
              individualmente para cada item.
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            name="publicAccess.isPublic"
            checked={formData.publicAccess.isPublic}
            onChange={handleChange}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label
            htmlFor="isPublic"
            className="text-sm text-gray-700 dark:text-gray-300"
          >
            Tornar esta seção pública
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Status
          </label>
          <div className="flex items-center space-x-3">
            <label className="flex items-center">
              <input
                type="radio"
                name="status"
                value="published"
                checked={formData.status === "published"}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Published
              </span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                name="status"
                value="draft"
                checked={formData.status === "draft"}
                onChange={handleChange}
                className="mr-2"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                Draft
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t dark:border-gray-700">
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" loading={loading} disabled={noContentTypes}>
          {section ? "Atualizar" : "Criar"} Section
        </Button>
      </div>

      {noContentTypes && (
        <div className="mt-4 text-center text-sm text-red-600 dark:text-red-400 p-3 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-800">
          <p>
            <strong>Atenção:</strong> Não é possível criar uma Seção pois não
            existem Content Types.
          </p>
          <p className="mt-1">
            Por favor,{" "}
            <a href="/dashboard/content-types" className="underline font-bold">
              crie um Content Type primeiro
            </a>
            .
          </p>
        </div>
      )}
    </form>
  );
}
