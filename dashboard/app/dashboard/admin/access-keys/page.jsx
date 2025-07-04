"use client";

import { useState, useEffect } from "react";
import { useUser, useAuth } from "@clerk/nextjs";
import { fetchWithAuth } from "@/lib/api";

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

  // Verificar se é super admin
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
      console.log("🔑 Clerk Token (loadKeys):", token);
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
      console.log("🔑 Clerk Token (handleCreateKey):", token);
      console.log("📦 Sending Key Data:", keyData);
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
      console.log("🔑 Clerk Token (revokeKey):", token);
      const response = await fetchWithAuth(
        `/api/admin/access-keys/${keyId}/revoke`,
        token,
        {
          method: "POST",
        }
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
      <div className="p-8 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Acesso Restrito
        </h1>
        <p className="text-gray-600">
          Esta área é restrita apenas para super administradores.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            🔑 Gerenciamento de Chaves de Acesso
          </h1>
          <p className="text-gray-600 mt-2">
            Crie e gerencie chaves para beta testers, promoções e demos
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          disabled={saving}
          className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Criando..." : "+ Nova Chave"}
        </button>
      </div>

      {/* Alertas */}
      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          ❌ {error}
          <button
            onClick={() => setError("")}
            className="float-right text-red-500 hover:text-red-700"
          >
            ✕
          </button>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
          ✅ {success}
          <button
            onClick={() => setSuccess("")}
            className="float-right text-green-500 hover:text-green-700"
          >
            ✕
          </button>
        </div>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="text-2xl font-bold text-blue-600">{keys.length}</div>
          <div className="text-sm text-gray-600">Total de Chaves</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="text-2xl font-bold text-green-600">
            {keys.filter((k) => k.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Chaves Ativas</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="text-2xl font-bold text-orange-600">
            {keys.reduce((acc, k) => acc + (k.usage?.currentUses || 0), 0)}
          </div>
          <div className="text-sm text-gray-600">Total de Usos</div>
        </div>
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="text-2xl font-bold text-purple-600">
            {keys.filter((k) => k.type === "plan").length}
          </div>
          <div className="text-sm text-gray-600">Chaves de Plano</div>
        </div>
      </div>

      {/* Lista de Chaves */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">Chaves Criadas</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Carregando chaves...</p>
          </div>
        ) : keys.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-4">🔑</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhuma chave criada
            </h3>
            <p className="text-gray-600 mb-4">
              Crie sua primeira chave de acesso para começar
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? "Criando..." : "Criar Primeira Chave"}
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Chave
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criada
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {keys.map((key) => (
                  <tr key={key._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-mono text-sm font-bold text-blue-600">
                          {key.code}
                        </div>
                        <div className="text-sm text-gray-600">{key.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          key.type === "plan"
                            ? "bg-green-100 text-green-800"
                            : key.type === "feature"
                            ? "bg-blue-100 text-blue-800"
                            : key.type === "addon"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {key.type.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {key.usage?.currentUses || 0} /{" "}
                      {key.usage?.maxUses || "Ilimitado"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          key.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {key.isActive ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(key.createdAt).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => setSelectedKey(key)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver
                      </button>
                      {key.isActive && (
                        <button
                          onClick={() => revokeKey(key._id)}
                          disabled={deleting[key._id]}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deleting[key._id] ? "Revogando..." : "Revogar"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Criar Chave */}
      {showCreateModal && (
        <CreateKeyModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateKey}
          saving={saving}
        />
      )}

      {/* Modal de Detalhes */}
      {selectedKey && (
        <KeyDetailsModal
          keyData={selectedKey}
          onClose={() => setSelectedKey(null)}
        />
      )}
    </div>
  );
}

// Modal de Criar Chave
function CreateKeyModal({ onClose, onSubmit, saving }) {
  const { getToken } = useAuth();
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Nova Chave de Acesso</h2>
            <button
              onClick={onClose}
              disabled={saving}
              className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Ex: Beta Testers Q1 2024"
                disabled={saving}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                rows={3}
                placeholder="Descrição opcional..."
                disabled={saving}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full px-3 py-2 border rounded-lg"
                disabled={saving}
              >
                <option value="plan">
                  Plano - Libera acesso completo a um plano
                </option>
                <option value="feature">
                  Feature - Libera features específicas
                </option>
                <option value="addon">Addon - Libera addons específicos</option>
                <option value="custom">Custom - Permissões customizadas</option>
              </select>
            </div>

            {formData.type === "plan" && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  ID do Plano
                </label>
                <select
                  value={formData.grants.planId || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      grants: { ...formData.grants, planId: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  disabled={saving}
                  required
                >
                  <option value="">Selecione um plano</option>
                  <option value="plan_business">Business</option>
                  <option value="plan_enterprise">Enterprise</option>
                </select>

                <label className="block text-sm font-medium mt-4 mb-2">
                  Duração (dias) - deixe vazio para permanente
                </label>
                <input
                  type="number"
                  value={formData.grants.planDuration || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      grants: {
                        ...formData.grants,
                        planDuration: parseInt(e.target.value) || null,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="30"
                  disabled={saving}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Máximo de Usos
              </label>
              <input
                type="number"
                value={formData.usage.maxUses}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    usage: {
                      ...formData.usage,
                      maxUses: parseInt(e.target.value),
                    },
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
                min="1"
                disabled={saving}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Emails Permitidos (separados por vírgula)
              </label>
              <textarea
                value={formData.restrictions.allowedEmails.join(", ")}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    restrictions: {
                      ...formData.restrictions,
                      allowedEmails: e.target.value
                        .split(",")
                        .map((email) => email.trim())
                        .filter(Boolean),
                    },
                  })
                }
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
                placeholder="user1@example.com, user2@example.com"
                disabled={saving}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Criando Chave..." : "Criar Chave"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Modal de Detalhes
function KeyDetailsModal({ keyData, onClose }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">Detalhes da Chave</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-bold text-lg mb-2">{keyData.name}</h3>
              <p className="text-2xl font-mono text-blue-600 font-bold mb-2">
                {keyData.code}
              </p>
              <p className="text-gray-600">{keyData.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Informações</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>Tipo:</strong> {keyData.type}
                  </div>
                  <div>
                    <strong>Status:</strong>{" "}
                    {keyData.isActive ? "Ativa" : "Inativa"}
                  </div>
                  <div>
                    <strong>Criada:</strong>{" "}
                    {new Date(keyData.createdAt).toLocaleDateString("pt-BR")}
                  </div>
                </div>
              </div>

              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Uso</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>Usado:</strong> {keyData.usage?.currentUses || 0}{" "}
                    vezes
                  </div>
                  <div>
                    <strong>Máximo:</strong>{" "}
                    {keyData.usage?.maxUses || "Ilimitado"}
                  </div>
                  <div>
                    <strong>Última ativação:</strong>{" "}
                    {keyData.lastUsedAt
                      ? new Date(keyData.lastUsedAt).toLocaleDateString("pt-BR")
                      : "Nunca"}
                  </div>
                </div>
              </div>
            </div>

            {keyData.restrictions?.allowedEmails?.length > 0 && (
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Emails Permitidos</h4>
                <div className="flex flex-wrap gap-1">
                  {keyData.restrictions.allowedEmails.map((email, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs"
                    >
                      {email}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {keyData.type === "plan" && keyData.grants?.planId && (
              <div className="bg-white border rounded-lg p-4">
                <h4 className="font-semibold mb-2">Plano Concedido</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <strong>ID:</strong> {keyData.grants.planId}
                  </div>
                  {keyData.grants.planDuration && (
                    <div>
                      <strong>Duração:</strong> {keyData.grants.planDuration}{" "}
                      dias
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
