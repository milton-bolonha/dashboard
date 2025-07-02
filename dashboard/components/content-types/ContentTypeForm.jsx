"use client";

import { useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Input } from "@/components/ui/Input";
import Button from "@/components/ui/Button";

export default function ContentTypeForm({ contentType, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: contentType?.name || "",
    slug: contentType?.slug || "",
    description: contentType?.description || "",
    icon: contentType?.icon || "folder",
    addons: contentType?.addons || [],
    // ✅ CORREÇÃO: Só usar createDefaultSection se estiver criando (não editando)
    createDefaultSection: contentType ? false : true, // Se contentType existe = editando, então false
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
        {/* ✅ CORREÇÃO: Só mostrar checkbox quando criando (não editando) */}
        {!contentType && (
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
        )}
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
                    <option value="textInput">📝 Texto Curto</option>
                    <option value="textarea">📄 Texto Longo</option>
                    <option value="imageUpload">📷 Upload de Imagem</option>
                    <option value="cloudinaryUpload">
                      🌤️ Upload Cloudinary
                    </option>
                    <option value="cloudinaryGallery">
                      🌤️📁 Galeria Cloudinary
                    </option>
                    <option value="dateInput">📅 Data</option>
                    <option value="selectInput">📋 Lista de Opções</option>
                    <option value="numberInput">🔢 Número</option>
                    <option value="checkboxInput">☑️ Checkbox</option>
                  </select>
                </div>
              </div>

              {/* Configurações Avançadas */}
              <div className="space-y-3">
                {/* Preview de como ficará */}
                {(addon.placeholder || addon.helpText) && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg border">
                    <div className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                      📱 Preview - Como o usuário verá:
                    </div>
                    <div className="space-y-1">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        {addon.name || "Nome do Campo"}
                      </label>
                      <input
                        type="text"
                        placeholder={addon.placeholder || ""}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
                        disabled
                      />
                      {addon.helpText && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {addon.helpText}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Placeholder */}
                <Input
                  label="💬 Texto dentro do campo (placeholder)"
                  value={addon.placeholder || ""}
                  onChange={(e) =>
                    handleAddonChange(index, "placeholder", e.target.value)
                  }
                  placeholder="Ex: Digite o título do produto..."
                  helpText="Aparece em cinza dentro do campo vazio para orientar o usuário"
                />

                {/* Help Text */}
                <Input
                  label="❓ Instrução abaixo do campo (texto de ajuda)"
                  value={addon.helpText || ""}
                  onChange={(e) =>
                    handleAddonChange(index, "helpText", e.target.value)
                  }
                  placeholder="Ex: Este título aparecerá na página do produto"
                  helpText="Pequena explicação que aparece abaixo do campo para dar mais contexto"
                />

                {/* Configurações específicas por tipo */}
                {addon.type === "cloudinaryUpload" && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-3">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300">
                      🌤️ Configurações do Cloudinary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        label="Pasta no Cloudinary"
                        value={addon.config?.folder || ""}
                        onChange={(e) => {
                          const config = {
                            ...addon.config,
                            folder: e.target.value,
                          };
                          handleAddonChange(index, "config", config);
                        }}
                        placeholder="Ex: banners, avatars, produtos"
                      />
                      <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tamanho Máximo (MB)
                        </label>
                        <select
                          value={addon.config?.maxFileSize || 10485760}
                          onChange={(e) => {
                            const config = {
                              ...addon.config,
                              maxFileSize: parseInt(e.target.value),
                            };
                            handleAddonChange(index, "config", config);
                          }}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value={1048576}>1 MB</option>
                          <option value={5242880}>5 MB</option>
                          <option value={10485760}>10 MB</option>
                          <option value={52428800}>50 MB</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {addon.type === "cloudinaryGallery" && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-3">
                    <h4 className="text-sm font-medium text-blue-900 dark:text-blue-300">
                      🌤️📁 Configurações da Galeria Cloudinary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        label="Pasta no Cloudinary"
                        value={addon.config?.folder || ""}
                        onChange={(e) => {
                          const config = {
                            ...addon.config,
                            folder: e.target.value,
                          };
                          handleAddonChange(index, "config", config);
                        }}
                        placeholder="Ex: galeria, produtos, portfolio"
                      />
                      <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tamanho Máximo por Imagem (MB)
                        </label>
                        <select
                          value={addon.config?.maxFileSize || 10485760}
                          onChange={(e) => {
                            const config = {
                              ...addon.config,
                              maxFileSize: parseInt(e.target.value),
                            };
                            handleAddonChange(index, "config", config);
                          }}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value={1048576}>1 MB</option>
                          <option value={5242880}>5 MB</option>
                          <option value={10485760}>10 MB</option>
                          <option value={52428800}>50 MB</option>
                        </select>
                      </div>
                      <div className="flex flex-col">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Máximo de Imagens
                        </label>
                        <select
                          value={addon.config?.maxImages || 10}
                          onChange={(e) => {
                            const config = {
                              ...addon.config,
                              maxImages: parseInt(e.target.value),
                            };
                            handleAddonChange(index, "config", config);
                          }}
                          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                          <option value={3}>3 imagens</option>
                          <option value={5}>5 imagens</option>
                          <option value={10}>10 imagens</option>
                          <option value={20}>20 imagens</option>
                          <option value={50}>50 imagens</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {addon.type === "selectInput" && (
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg space-y-3">
                    <h4 className="text-sm font-medium text-green-900 dark:text-green-300">
                      📋 Opções da Lista
                    </h4>
                    <Input
                      label="Opções (separadas por vírgula)"
                      value={
                        addon.config?.options
                          ?.map((opt) => `${opt.value}:${opt.label}`)
                          .join(", ") || ""
                      }
                      onChange={(e) => {
                        const optionsStr = e.target.value;
                        const options = optionsStr
                          .split(",")
                          .map((opt) => {
                            const [value, label] = opt.trim().split(":");
                            return {
                              value: value?.trim(),
                              label: label?.trim() || value?.trim(),
                            };
                          })
                          .filter((opt) => opt.value);
                        const config = { ...addon.config, options };
                        handleAddonChange(index, "config", config);
                      }}
                      placeholder="Ex: op1:Opção 1, op2:Opção 2"
                      helpText="Formato: valor:label, valor2:label2"
                    />
                  </div>
                )}

                {addon.type === "numberInput" && (
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg space-y-3">
                    <h4 className="text-sm font-medium text-purple-900 dark:text-purple-300">
                      🔢 Configurações Numéricas
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <Input
                        label="Valor Mínimo"
                        type="number"
                        value={addon.config?.min || ""}
                        onChange={(e) => {
                          const config = {
                            ...addon.config,
                            min: parseFloat(e.target.value) || undefined,
                          };
                          handleAddonChange(index, "config", config);
                        }}
                      />
                      <Input
                        label="Valor Máximo"
                        type="number"
                        value={addon.config?.max || ""}
                        onChange={(e) => {
                          const config = {
                            ...addon.config,
                            max: parseFloat(e.target.value) || undefined,
                          };
                          handleAddonChange(index, "config", config);
                        }}
                      />
                      <Input
                        label="Incremento"
                        type="number"
                        value={addon.config?.step || 1}
                        onChange={(e) => {
                          const config = {
                            ...addon.config,
                            step: parseFloat(e.target.value) || 1,
                          };
                          handleAddonChange(index, "config", config);
                        }}
                      />
                    </div>
                  </div>
                )}
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
                  className="text-red-600 hover:text-red-700 border-red-300 hover:border-red-400"
                >
                  🗑️ Remover
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
