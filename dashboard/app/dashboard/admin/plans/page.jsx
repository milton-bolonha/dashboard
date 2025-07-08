"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

// Ícones
const IconPlus = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    />
  </svg>
);

const IconEdit = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5l12.232-12.232z"
    />
  </svg>
);

const IconTrash = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

const IconSpinner = () => (
  <svg
    className="animate-spin h-5 w-5 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

// Ícones para Limites - Usando ícones mais simples e confiáveis
const IconWorkspaces = (props) => (
  <svg {...props} fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
  </svg>
);

const IconUsers = (props) => (
  <svg {...props} fill="currentColor" viewBox="0 0 20 20">
    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
  </svg>
);

const IconSections = (props) => (
  <svg {...props} fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
      clipRule="evenodd"
    />
  </svg>
);

const IconItems = (props) => (
  <svg {...props} fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
      clipRule="evenodd"
    />
  </svg>
);

const IconStorage = (props) => (
  <svg {...props} fill="currentColor" viewBox="0 0 20 20">
    <path d="M3 4a2 2 0 00-2 2v1h18V6a2 2 0 00-2-2H3zM3 10a2 2 0 00-2 2v1h18v-1a2 2 0 00-2-2H3zM1 16a2 2 0 002 2h14a2 2 0 002-2v-1H1v1z" />
  </svg>
);

const IconApi = (props) => (
  <svg {...props} fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"
      clipRule="evenodd"
    />
  </svg>
);

// Ícone de Info para Tooltips
const IconInfo = () => (
  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
      clipRule="evenodd"
    />
  </svg>
);

// Componente de Tooltip
const Tooltip = ({ children, content }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg -top-2 left-full ml-2 w-64">
          <div className="absolute top-3 -left-1 w-2 h-2 bg-gray-900 rotate-45"></div>
          {content}
        </div>
      )}
    </div>
  );
};

const PlanFormModal = ({ plan, isOpen, onClose, onSave, isSaving, error }) => {
  if (!isOpen) return null;

  // Função para converter o nome do plano em um slug
  const slugify = (text) =>
    text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, "-") // Substituir espaços por -
      .replace(/[^\w-]+/g, "") // Remover caracteres inválidos
      .replace(/--+/g, "-") // Substituir múltiplos - por um único -
      .replace(/^-+/, "") // Cortar - do início
      .replace(/-+$/, ""); // Cortar - do fim

  const [formData, setFormData] = useState(() => {
    const initialData = plan || {
      name: "",
      slug: "",
      description: "",
      hierarchy: 0,
      isActive: true,
      isDefault: false,
      stripePriceIds: { monthly: "", yearly: "" },
      limits: {
        workspaces: 1,
        workspaceMembers: 5,
        sections: 10,
        itemsPerSection: 100,
        storage: 1, // Padrão de 1GB
        apiCalls: 1000,
      },
    };

    // Converte o valor de storage para GB para exibição
    if (initialData.limits.storage > 100000) {
      // Se for um valor em bytes
      initialData.limits.storage =
        initialData.limits.storage / 1024 / 1024 / 1024;
    }

    return initialData;
  });

  // Estado para controlar se o slug está sendo editado manualmente
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === "name" && !slugManuallyEdited) {
      setFormData((prev) => ({
        ...prev,
        name: value,
        slug: slugify(value),
      }));
    } else {
      if (name === "slug") {
        setSlugManuallyEdited(true);
      }
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleLimitChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      limits: { ...prev.limits, [name]: Number(value) },
    }));
  };

  const handleStripeIdChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      stripePriceIds: { ...prev.stripePriceIds, [name]: value },
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSave = {
      ...formData,
      limits: {
        ...formData.limits,
        // Converte de volta para bytes antes de salvar
        storage: formData.limits.storage * 1024 * 1024 * 1024,
      },
    };
    onSave(dataToSave);
  };

  const limitDetails = {
    workspaces: {
      icon: IconWorkspaces,
      label: "Workspaces",
      description: "Número de workspaces permitidos",
      tooltip:
        "Cada workspace é um ambiente isolado onde os usuários podem organizar seu conteúdo. Planos básicos geralmente permitem 1-3 workspaces.",
    },
    workspaceMembers: {
      icon: IconUsers,
      label: "Membros por Workspace",
      description: "Usuários que podem ser convidados",
      tooltip:
        "Quantos usuários podem ser adicionados como colaboradores em cada workspace. Inclui proprietários, editores e visualizadores.",
    },
    sections: {
      icon: IconSections,
      label: "Seções",
      description: "Seções de conteúdo por workspace",
      tooltip:
        "Seções são categorias principais de conteúdo (ex: Blog, Produtos, Páginas). Cada seção pode conter múltiplos itens.",
    },
    itemsPerSection: {
      icon: IconItems,
      label: "Itens por Seção",
      description: "Itens máximos em cada seção",
      tooltip:
        "Número máximo de posts, produtos ou páginas que podem ser criados dentro de cada seção de conteúdo.",
    },
    storage: {
      icon: IconStorage,
      label: "Armazenamento",
      description: "Espaço total de arquivos (GB)",
      tooltip:
        "Espaço em disco para upload de imagens, documentos e outros arquivos. 1 GB = aproximadamente 1000 fotos de alta qualidade.",
    },
    apiCalls: {
      icon: IconApi,
      label: "Chamadas de API",
      description: "Requisições por mês",
      tooltip:
        "Número de chamadas que aplicações externas podem fazer à API por mês. Útil para integrações e automações.",
    },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start pt-8 pb-8">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto relative">
        <form onSubmit={handleSubmit}>
          <div className="p-6 sticky top-0 bg-white dark:bg-gray-900 z-10 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center rounded-t-xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {plan?._id ? "Editar Plano" : "Novo Plano"}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className="p-6 space-y-8">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                <p className="font-medium">Erro ao salvar</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {/* Informações Básicas */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Informações Básicas
                </h3>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label
                      htmlFor="name"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Nome do Plano
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-colors"
                      placeholder="Ex: Gratuito, Profissional, Enterprise"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Nome que será exibido aos usuários.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="slug"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Identificador (Slug)
                      <Tooltip content="O slug é usado internamente para identificar o plano. É gerado automaticamente mas pode ser editado se necessário.">
                        <span className="ml-1 text-gray-400">
                          <IconInfo />
                        </span>
                      </Tooltip>
                    </label>
                    <input
                      type="text"
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-colors"
                      placeholder="ex: gratuito, profissional"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Gerado automaticamente, mas editável.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="description"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Descrição
                    </label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-colors"
                      placeholder="Descreva os principais benefícios e características deste plano."
                    />
                  </div>
                </div>
              </div>

              {/* Configurações */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Configurações
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="hierarchy"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                    >
                      Ordem de Exibição
                      <Tooltip content="Define a ordem em que os planos aparecem na página de preços. Números menores aparecem primeiro.">
                        <span className="ml-1 text-gray-400">
                          <IconInfo />
                        </span>
                      </Tooltip>
                    </label>
                    <input
                      type="number"
                      id="hierarchy"
                      name="hierarchy"
                      value={formData.hierarchy}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-colors"
                      placeholder="0"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Menores números aparecem primeiro.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <input
                        id="isActive"
                        name="isActive"
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={handleChange}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isActive"
                        className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex-1"
                      >
                        Plano Ativo
                        <p className="text-xs text-gray-500 mt-1">
                          Quando ativo, o plano aparece nas opções de upgrade
                        </p>
                      </label>
                    </div>

                    <div className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <input
                        id="isDefault"
                        name="isDefault"
                        type="checkbox"
                        checked={formData.isDefault}
                        onChange={handleChange}
                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label
                        htmlFor="isDefault"
                        className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex-1"
                      >
                        <span className="flex items-center">
                          Plano Padrão
                          <Tooltip content="O plano padrão é automaticamente atribuído a novos usuários que se cadastram.">
                            <span className="ml-1 text-gray-400">
                              <IconInfo />
                            </span>
                          </Tooltip>
                        </span>
                        <p className="text-xs text-gray-500 mt-1">
                          Usuários que se cadastram recebem este plano
                          inicialmente
                        </p>
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stripe */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Integração com Stripe
                  <Tooltip content="Configure os IDs de preços do Stripe para habilitar pagamentos. Estes IDs devem ser criados no seu painel do Stripe primeiro.">
                    <span className="ml-2 text-gray-400">
                      <IconInfo />
                    </span>
                  </Tooltip>
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  IDs de preços criados no seu painel do Stripe para cobrança.
                  Deixe em branco se o plano for gratuito.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="monthly"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      💳 ID de Preço Mensal
                    </label>
                    <input
                      type="text"
                      id="monthly"
                      name="monthly"
                      value={formData.stripePriceIds.monthly}
                      onChange={handleStripeIdChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-colors font-mono text-sm"
                      placeholder="price_1234567890"
                    />
                    <p className="text-xs text-gray-500">
                      Ex: price_1234567890
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label
                      htmlFor="yearly"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      📅 ID de Preço Anual
                    </label>
                    <input
                      type="text"
                      id="yearly"
                      name="yearly"
                      value={formData.stripePriceIds.yearly}
                      onChange={handleStripeIdChange}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-colors font-mono text-sm"
                      placeholder="price_0987654321"
                    />
                    <p className="text-xs text-gray-500">
                      Ex: price_0987654321
                    </p>
                  </div>
                </div>
              </div>

              {/* Limites */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Limites de Recursos
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Defina os limites para os recursos principais deste plano.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.keys(formData.limits).map((key) => {
                    const detail = limitDetails[key] || {
                      label: key.replace(/([A-Z])/g, " $1"),
                      description: "",
                      icon: null,
                    };
                    return (
                      <div
                        key={key}
                        className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <label
                            htmlFor={key}
                            className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            {detail.icon && (
                              <detail.icon className="w-5 h-5 mr-2 text-blue-500" />
                            )}
                            <span>{detail.label}</span>
                          </label>
                          {detail.tooltip && (
                            <Tooltip content={detail.tooltip}>
                              <span className="text-gray-400 cursor-help">
                                <IconInfo />
                              </span>
                            </Tooltip>
                          )}
                        </div>
                        <input
                          type="number"
                          id={key}
                          name={key}
                          value={formData.limits[key]}
                          onChange={handleLimitChange}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white transition-colors text-center font-mono text-lg"
                          min="0"
                        />
                        <p className="mt-2 text-xs text-gray-500">
                          {detail.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end gap-3 sticky bottom-0 z-10 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving && <IconSpinner />}
              {plan?._id ? "Salvar Alterações" : "Criar Plano"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function PlansAdminPage() {
  const { user } = useUser();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [modalError, setModalError] = useState("");

  // Verificar role via API segura
  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const response = await fetch("/api/auth/check-role");
        if (response.ok) {
          const data = await response.json();
          setIsSuperAdmin(data.isSuperAdmin);
        }
      } catch (error) {
        console.error("Erro ao verificar role:", error);
        setIsSuperAdmin(false);
      } finally {
        setCheckingRole(false);
      }
    };

    if (user) {
      checkSuperAdmin();
    } else {
      setCheckingRole(false);
    }
  }, [user]);

  useEffect(() => {
    if (isSuperAdmin) {
      loadPlans();
    }
  }, [isSuperAdmin]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await fetch("/api/admin/plans");
      if (response.ok) {
        const data = await response.json();
        // Ordenar por hierarquia caso a API não o faça
        data.sort((a, b) => a.hierarchy - b.hierarchy);
        setPlans(data);
      } else {
        throw new Error("Falha ao carregar os planos.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (plan) => {
    setCurrentPlan(plan);
    setIsModalOpen(true);
    setModalError("");
  };

  const handleAddNewPlan = () => {
    setCurrentPlan(null);
    setIsModalOpen(true);
    setModalError("");
  };

  const handleDelete = async (planId) => {
    if (
      !confirm(
        "Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita."
      )
    )
      return;

    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        loadPlans(); // Recarregar a lista
      } else {
        const result = await response.json();
        setError(result.error || "Falha ao excluir o plano.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSavePlan = async (planData) => {
    setIsSaving(true);
    setModalError("");

    const isEditing = !!planData._id;
    const url = isEditing
      ? `/api/admin/plans/${planData._id}`
      : "/api/admin/plans";
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planData),
      });

      if (response.ok) {
        setIsModalOpen(false);
        loadPlans();
      } else {
        const result = await response.json();
        setModalError(
          result.error || `Falha ao ${isEditing ? "salvar" : "criar"} o plano.`
        );
      }
    } catch (err) {
      setModalError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (checkingRole) {
    return (
      <div className="p-8 text-center">
        <IconSpinner />
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Verificando permissões...
        </p>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return (
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              vectorEffect="non-scaling-stroke"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Acesso Restrito
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Esta área é restrita apenas para super administradores.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center">
        <IconSpinner />
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Carregando planos...
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Gerenciamento de Planos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Crie e gerencie os planos de assinatura do sistema.
          </p>
        </div>
        <button
          onClick={handleAddNewPlan}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <IconPlus />
          Novo Plano
        </button>
      </header>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          <p>
            <strong>Erro:</strong> {error}
          </p>
        </div>
      )}

      <PlanFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSavePlan}
        plan={currentPlan}
        isSaving={isSaving}
        error={modalError}
      />

      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nome do Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Price ID (Mensal)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Hierarquia
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {plans.map((plan) => (
                <tr
                  key={plan._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {plan.name}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {plan.slug}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        plan.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {plan.isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-sm text-gray-600 dark:text-gray-400">
                    {plan.stripePriceIds?.monthly || "Não definido"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                    {plan.hierarchy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end items-center gap-2">
                      <button
                        onClick={() => handleEdit(plan)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer"
                        title="Editar Plano"
                      >
                        <IconEdit />
                      </button>
                      <button
                        onClick={() => handleDelete(plan._id)}
                        className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors cursor-pointer"
                        title="Excluir Plano"
                      >
                        <IconTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {plans.length === 0 && !loading && (
            <div className="text-center py-12">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Nenhum plano encontrado
              </h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Comece adicionando um novo plano para o seu sistema.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
