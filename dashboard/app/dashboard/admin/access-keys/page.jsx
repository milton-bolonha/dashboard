"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "@/lib/api";

// Ícones
const IconPlus = () => (
  <svg
    className="w-5 h-5"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
    />
  </svg>
);

const IconKey = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
    <path
      fillRule="evenodd"
      d="M18 8a6 6 0 01-7.743 5.743L10 14l-1 1-1 1H6v2H2v-4l4.257-4.257A6 6 0 1118 8zm-6-4a1 1 0 100 2 2 2 0 012 2 1 1 0 102 0 4 4 0 00-4-4z"
      clipRule="evenodd"
    />
  </svg>
);

const IconEye = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
    />
  </svg>
);

const IconTrash = () => (
  <svg
    className="w-4 h-4"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
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
  <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

const IconClose = () => (
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
);

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
    <span className="inline-block">
      <span
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help relative"
      >
        {children}
        {isVisible && (
          <div className="absolute z-50 px-3 py-2 text-sm text-white bg-gray-900 rounded-lg shadow-lg -top-2 left-full ml-2 w-64">
            <div className="absolute top-3 -left-1 w-2 h-2 bg-gray-900 rotate-45"></div>
            {content}
          </div>
        )}
      </span>
    </span>
  );
};

export default function AccessKeysAdminPage() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedKey, setSelectedKey] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState({});
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const isSuperAdmin = user?.publicMetadata?.role === "superadmin";

  useEffect(() => {
    if (isSuperAdmin) {
      loadKeys();
    }
  }, [isSuperAdmin]);

  const loadKeys = async () => {
    try {
      setLoading(true);
      setError("");
      const token = await getToken();
      const response = await fetchWithAuth("/api/admin/access-keys", token);

      if (response.ok) {
        const data = await response.json();
        setKeys(data);
      } else {
        setError("Erro ao carregar chaves");
      }
    } catch (error) {
      console.error("Erro:", error);
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async (keyData) => {
    try {
      setSaving(true);
      setError("");
      const token = await getToken();
      const response = await fetchWithAuth("/api/admin/access-keys", token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(keyData),
      });

      if (response.ok) {
        const newKey = await response.json();
        setKeys([newKey, ...keys]);
        setShowCreateModal(false);
        setSuccess(`Chave criada: ${newKey.code}`);
        setTimeout(() => setSuccess(""), 5000);
      } else {
        const error = await response.json();
        setError(error.error || "Erro ao criar chave");
      }
    } catch (error) {
      console.error("Erro:", error);
      setError("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  const revokeKey = async (keyId) => {
    if (!confirm("Tem certeza que deseja revogar esta chave?")) return;

    try {
      setDeleting((prev) => ({ ...prev, [keyId]: true }));
      setError("");

      const token = await getToken();
      const response = await fetchWithAuth(
        `/api/admin/access-keys/${keyId}/revoke`,
        token,
        { method: "POST" }
      );

      if (response.ok) {
        loadKeys();
        setSuccess("Chave revogada com sucesso");
        setTimeout(() => setSuccess(""), 5000);
      } else {
        setError("Erro ao revogar chave");
      }
    } catch (error) {
      console.error("Erro:", error);
      setError("Erro de conexão");
    } finally {
      setDeleting((prev) => ({ ...prev, [keyId]: false }));
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Acesso Restrito
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Esta área é restrita apenas para super administradores.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="mb-4 sm:mb-0">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center">
              <IconKey className="mr-3" />
              Chaves de Acesso
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Gerencie chaves para beta testers, promoções e demos
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IconPlus />
            Nova Chave
          </button>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center justify-between">
          <span>❌ {error}</span>
          <button
            onClick={() => setError("")}
            className="text-red-500 hover:text-red-700 cursor-pointer"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-center justify-between">
          <span>✅ {success}</span>
          <button
            onClick={() => setSuccess("")}
            className="text-green-500 hover:text-green-700 cursor-pointer"
          >
            <IconClose className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {keys.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total de Chaves
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            {keys.filter((k) => k.isActive).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Chaves Ativas
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
            {keys.reduce((acc, k) => acc + (k.usage?.currentUses || 0), 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Total de Usos
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            {keys.filter((k) => k.type === "plan").length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Chaves de Plano
          </div>
        </div>
      </div>

      {/* Tabela de Chaves */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Chaves Criadas
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center">
            <IconSpinner className="mx-auto text-blue-600 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              Carregando chaves...
            </p>
          </div>
        ) : keys.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-4">🔑</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Nenhuma chave criada
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Crie sua primeira chave de acesso para começar
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-300 dark:border-gray-600 font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <IconPlus />
              Criar Primeira Chave
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Chave
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Uso
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Criada
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {keys.map((key) => (
                  <tr
                    key={key._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-mono text-sm font-semibold text-blue-600 dark:text-blue-400">
                          {key.code}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                          {key.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          key.type === "plan"
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : key.type === "feature"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : key.type === "addon"
                            ? "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {key.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-2">
                        <span>{key.usage?.currentUses || 0}</span>
                        <span className="text-gray-400">/</span>
                        <span>{key.usage?.maxUses || "∞"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          key.isActive
                            ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {key.isActive ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                      {new Date(key.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedKey(key)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                        >
                          <IconEye />
                          Ver
                        </button>
                        {key.isActive && (
                          <button
                            onClick={() => revokeKey(key._id)}
                            disabled={deleting[key._id]}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {deleting[key._id] ? (
                              <IconSpinner className="w-4 h-4" />
                            ) : (
                              <IconTrash />
                            )}
                            {deleting[key._id] ? "Revogando..." : "Revogar"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modais */}
      {showCreateModal && (
        <CreateKeyModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateKey}
          saving={saving}
        />
      )}

      {selectedKey && (
        <KeyDetailsModal
          keyData={selectedKey}
          onClose={() => setSelectedKey(null)}
        />
      )}
    </div>
  );
}

// Modal de Criar Chave - Melhorado
function CreateKeyModal({ onClose, onSubmit, saving }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "plan",
    grants: {},
    usage: {
      maxUses: 1,
      allowMultiplePerUser: false,
      allowMultiplePerWorkspace: false,
    },
    restrictions: {
      allowedEmails: [],
      allowedDomains: [],
    },
    tags: [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === "checkbox" ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start pt-8 pb-8">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-6 sticky top-0 bg-white dark:bg-gray-900 z-10 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center rounded-t-xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Nova Chave de Acesso
            </h2>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 cursor-pointer"
            >
              <IconClose />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Informações Básicas
              </h3>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Nome da Chave
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-colors"
                  placeholder="Ex: Beta Testers Q1 2024"
                  disabled={saving}
                  required
                />
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
                  placeholder="Descreva o propósito desta chave..."
                  disabled={saving}
                />
              </div>

              <div>
                <label
                  htmlFor="type"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Tipo de Chave
                  <Tooltip content="Plan: Upgrade de plano, Feature: Ativar funcionalidade, Addon: Adicionar complemento">
                    <span className="ml-1 text-gray-400">
                      <IconInfo />
                    </span>
                  </Tooltip>
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-colors"
                  disabled={saving}
                  required
                >
                  <option value="plan">Plan - Upgrade de Plano</option>
                  <option value="feature">
                    Feature - Ativar Funcionalidade
                  </option>
                  <option value="addon">Addon - Adicionar Complemento</option>
                </select>
              </div>
            </div>

            {/* Configurações de Uso */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Configurações de Uso
              </h3>

              <div>
                <label
                  htmlFor="usage.maxUses"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  Máximo de Usos
                  <Tooltip content="Quantas vezes esta chave pode ser usada. 0 = ilimitado">
                    <span className="ml-1 text-gray-400">
                      <IconInfo />
                    </span>
                  </Tooltip>
                </label>
                <input
                  type="number"
                  id="usage.maxUses"
                  name="usage.maxUses"
                  value={formData.usage.maxUses}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white transition-colors"
                  min="0"
                  disabled={saving}
                />
                <p className="mt-1 text-sm text-gray-500">0 = uso ilimitado</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <input
                    id="usage.allowMultiplePerUser"
                    name="usage.allowMultiplePerUser"
                    type="checkbox"
                    checked={formData.usage.allowMultiplePerUser}
                    onChange={handleChange}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={saving}
                  />
                  <label
                    htmlFor="usage.allowMultiplePerUser"
                    className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex-1"
                  >
                    Permitir múltiplos usos por usuário
                    <p className="text-xs text-gray-500 mt-1">
                      O mesmo usuário pode usar a chave várias vezes
                    </p>
                  </label>
                </div>

                <div className="flex items-center p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <input
                    id="usage.allowMultiplePerWorkspace"
                    name="usage.allowMultiplePerWorkspace"
                    type="checkbox"
                    checked={formData.usage.allowMultiplePerWorkspace}
                    onChange={handleChange}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={saving}
                  />
                  <label
                    htmlFor="usage.allowMultiplePerWorkspace"
                    className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer flex-1"
                  >
                    Permitir múltiplos usos por workspace
                    <p className="text-xs text-gray-500 mt-1">
                      A chave pode ser usada em vários workspaces
                    </p>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end gap-3 sticky bottom-0 z-10 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving && <IconSpinner />}
              {saving ? "Criando..." : "Criar Chave"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal de Detalhes - Melhorado
function KeyDetailsModal({ keyData, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-start pt-8 pb-8">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
        {/* Header */}
        <div className="p-6 sticky top-0 bg-white dark:bg-gray-900 z-10 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center rounded-t-xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Detalhes da Chave
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition-colors cursor-pointer"
          >
            <IconClose />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Código da Chave
              </label>
              <div className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                {keyData.code}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Status
              </label>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  keyData.isActive
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                }`}
              >
                {keyData.isActive ? "Ativa" : "Inativa"}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Nome
              </label>
              <p className="text-gray-900 dark:text-white">{keyData.name}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Tipo
              </label>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  keyData.type === "plan"
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                    : keyData.type === "feature"
                    ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                    : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400"
                }`}
              >
                {keyData.type.toUpperCase()}
              </span>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Usos
              </label>
              <p className="text-gray-900 dark:text-white">
                {keyData.usage?.currentUses || 0} /{" "}
                {keyData.usage?.maxUses || "Ilimitado"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Criada em
              </label>
              <p className="text-gray-900 dark:text-white">
                {new Date(keyData.createdAt).toLocaleDateString("pt-BR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {keyData.description && (
            <div>
              <label className="block text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Descrição
              </label>
              <p className="text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                {keyData.description}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex justify-end sticky bottom-0 z-10 border-t border-gray-200 dark:border-gray-700 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
