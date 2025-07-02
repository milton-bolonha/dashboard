"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAccess } from "@/hooks/useAccess";
import { toast } from "react-hot-toast";

export default function PlansAdminPage() {
  const router = useRouter();
  const { canSync } = useAccess();
  const [plans, setPlans] = useState([]);
  const [features, setFeatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState(null);
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Verificar permissão de super admin
  useEffect(() => {
    if (!canSync("manage", "system")) {
      router.push("/dashboard");
    }
  }, [canSync, router]);

  // Carregar dados
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [plansRes, featuresRes] = await Promise.all([
        fetch("/api/admin/plans"),
        fetch("/api/admin/features"),
      ]);

      if (plansRes.ok && featuresRes.ok) {
        setPlans(await plansRes.json());
        setFeatures(await featuresRes.json());
      }
    } catch (error) {
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const handleSavePlan = async (planData) => {
    try {
      const url = editingPlan
        ? `/api/admin/plans/${editingPlan._id}`
        : "/api/admin/plans";

      const method = editingPlan ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planData),
      });

      if (response.ok) {
        toast.success(editingPlan ? "Plano atualizado!" : "Plano criado!");
        setShowPlanModal(false);
        setEditingPlan(null);
        loadData();
      } else {
        throw new Error("Erro ao salvar plano");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleDeletePlan = async (planId) => {
    if (!confirm("Tem certeza que deseja excluir este plano?")) return;

    try {
      const response = await fetch(`/api/admin/plans/${planId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Plano excluído!");
        loadData();
      }
    } catch (error) {
      toast.error("Erro ao excluir plano");
    }
  };

  if (loading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Gerenciar Planos</h1>
          <p className="text-gray-600">
            Configure planos, limites e permissões do sistema
          </p>
        </div>

        {/* Botão de adicionar */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => {
              setEditingPlan(null);
              setShowPlanModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Adicionar Plano
          </button>
        </div>

        {/* Lista de planos */}
        <div className="grid gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan._id}
              plan={plan}
              onEdit={() => {
                setEditingPlan(plan);
                setShowPlanModal(true);
              }}
              onDelete={() => handleDeletePlan(plan._id)}
            />
          ))}
        </div>

        {/* Modal de edição/criação */}
        {showPlanModal && (
          <PlanModal
            plan={editingPlan}
            features={features}
            onSave={handleSavePlan}
            onClose={() => {
              setShowPlanModal(false);
              setEditingPlan(null);
            }}
          />
        )}
      </div>
    </div>
  );
}

// Componente do card de plano
function PlanCard({ plan, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-xl font-semibold">{plan.name}</h3>
          <p className="text-gray-600">{plan.description}</p>
          <p className="text-sm text-gray-500 mt-1">Slug: {plan.slug}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
          >
            Editar
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1 text-red-600 hover:bg-red-50 rounded"
          >
            Excluir
          </button>
        </div>
      </div>

      {/* Limites */}
      <div className="mb-4">
        <h4 className="font-medium mb-2">Limites:</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Workspaces:</span>{" "}
            <span className="font-medium">{plan.limits?.workspaces || 0}</span>
          </div>
          <div>
            <span className="text-gray-600">Membros:</span>{" "}
            <span className="font-medium">
              {plan.limits?.workspaceMembers || 0}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Seções:</span>{" "}
            <span className="font-medium">{plan.limits?.sections || 0}</span>
          </div>
          <div>
            <span className="text-gray-600">Itens/Seção:</span>{" "}
            <span className="font-medium">
              {plan.limits?.itemsPerSection || 0}
            </span>
          </div>
          <div>
            <span className="text-gray-600">API Calls:</span>{" "}
            <span className="font-medium">{plan.limits?.apiCalls || 0}</span>
          </div>
          <div>
            <span className="text-gray-600">Storage:</span>{" "}
            <span className="font-medium">
              {formatBytes(plan.limits?.storage || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* Features */}
      {plan.features?.length > 0 && (
        <div>
          <h4 className="font-medium mb-2">Features ativas:</h4>
          <div className="flex flex-wrap gap-2">
            {plan.features.map((feature) => (
              <span
                key={feature.featureId}
                className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm"
              >
                {feature.featureId}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Status */}
      <div className="mt-4 flex items-center gap-4">
        {plan.isDefault && (
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
            Plano Padrão
          </span>
        )}
        <span
          className={`px-2 py-1 rounded text-sm ${
            plan.isActive
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {plan.isActive ? "Ativo" : "Inativo"}
        </span>
      </div>
    </div>
  );
}

// Modal de edição/criação de plano
function PlanModal({ plan, features, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: plan?.name || "",
    slug: plan?.slug || "",
    description: plan?.description || "",
    hierarchy: plan?.hierarchy || 0,
    isActive: plan?.isActive ?? true,
    isDefault: plan?.isDefault || false,
    stripePriceIds: plan?.stripePriceIds || { monthly: "", yearly: "" },
    limits: plan?.limits || {
      workspaces: 1,
      workspaceMembers: 5,
      sections: 10,
      itemsPerSection: 100,
      storage: 1073741824,
      apiCalls: 1000,
    },
    features: plan?.features || [],
    permissions: plan?.permissions || [],
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const toggleFeature = (featureId) => {
    const exists = formData.features.find((f) => f.featureId === featureId);

    if (exists) {
      setFormData({
        ...formData,
        features: formData.features.filter((f) => f.featureId !== featureId),
      });
    } else {
      setFormData({
        ...formData,
        features: [...formData.features, { featureId, enabled: true }],
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">
            {plan ? "Editar Plano" : "Novo Plano"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informações básicas */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nome do Plano
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Slug (identificador único)
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  pattern="[a-z0-9-]+"
                  required
                />
              </div>
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
              />
            </div>

            {/* Stripe Price IDs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Stripe Price ID (Mensal)
                </label>
                <input
                  type="text"
                  value={formData.stripePriceIds.monthly}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stripePriceIds: {
                        ...formData.stripePriceIds,
                        monthly: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="price_..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Stripe Price ID (Anual)
                </label>
                <input
                  type="text"
                  value={formData.stripePriceIds.yearly}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stripePriceIds: {
                        ...formData.stripePriceIds,
                        yearly: e.target.value,
                      },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="price_..."
                />
              </div>
            </div>

            {/* Limites */}
            <div>
              <h3 className="font-medium mb-3">Limites do Plano</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Workspaces
                  </label>
                  <input
                    type="number"
                    value={formData.limits.workspaces}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limits: {
                          ...formData.limits,
                          workspaces: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Membros/Workspace
                  </label>
                  <input
                    type="number"
                    value={formData.limits.workspaceMembers}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limits: {
                          ...formData.limits,
                          workspaceMembers: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Seções
                  </label>
                  <input
                    type="number"
                    value={formData.limits.sections}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limits: {
                          ...formData.limits,
                          sections: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Itens/Seção
                  </label>
                  <input
                    type="number"
                    value={formData.limits.itemsPerSection}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limits: {
                          ...formData.limits,
                          itemsPerSection: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    API Calls/mês
                  </label>
                  <input
                    type="number"
                    value={formData.limits.apiCalls}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limits: {
                          ...formData.limits,
                          apiCalls: parseInt(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">
                    Storage (GB)
                  </label>
                  <input
                    type="number"
                    value={formData.limits.storage / (1024 * 1024 * 1024)}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        limits: {
                          ...formData.limits,
                          storage:
                            parseInt(e.target.value) * 1024 * 1024 * 1024,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Features */}
            <div>
              <h3 className="font-medium mb-3">Features Incluídas</h3>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {features.map((feature) => (
                  <label
                    key={feature._id}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.features.some(
                        (f) => f.featureId === feature._id
                      )}
                      onChange={() => toggleFeature(feature._id)}
                      className="rounded"
                    />
                    <span className="text-sm">{feature.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Configurações */}
            <div className="flex items-center gap-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm">Plano Ativo</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) =>
                    setFormData({ ...formData, isDefault: e.target.checked })
                  }
                  className="rounded"
                />
                <span className="text-sm">Plano Padrão</span>
              </label>

              <div className="flex items-center space-x-2">
                <label className="text-sm">Hierarquia:</label>
                <input
                  type="number"
                  value={formData.hierarchy}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      hierarchy: parseInt(e.target.value),
                    })
                  }
                  className="w-20 px-2 py-1 border rounded"
                  min="0"
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {plan ? "Atualizar" : "Criar"} Plano
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// Função auxiliar para formatar bytes
function formatBytes(bytes) {
  if (bytes === 0) return "0 Bytes";
  if (bytes === -1) return "Ilimitado";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}
