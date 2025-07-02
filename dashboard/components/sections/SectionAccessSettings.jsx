"use client";

import { useState, useEffect } from "react";
import { useAccess } from "@/hooks/useAccess";
import { toast } from "react-hot-toast";

export default function SectionAccessSettings({ section, onUpdate }) {
  const { plan, features } = useAccess();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [settings, setSettings] = useState({
    visibility: section?.access?.visibility || "workspace_member",
    publicSettings: section?.access?.publicSettings || {
      allowAnonymousView: false,
      allowAnonymousCreate: false,
      requireEmail: false,
      requireCaptcha: true,
    },
    allowedRoles: section?.access?.allowedRoles || [],
    allowedPlans: section?.access?.allowedPlans || [],
    minimumPlan: section?.access?.minimumPlan || "",
    customRuleId: section?.access?.customRuleId || "",
    deniedMessage: section?.access?.deniedMessage || "",
    upgradePrompt: section?.access?.upgradePrompt || "",
    upgradeUrl: section?.access?.upgradeUrl || "",
    monetization: section?.monetization || {
      isPaid: false,
      price: 0,
      stripePriceId: "",
      purchaseType: "one_time",
      usageCreditsRequired: 0,
    },
  });

  // Carregar planos disponíveis
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await fetch("/api/plans");
      if (response.ok) {
        const data = await response.json();
        setPlans(data.filter((p) => p.isActive));
      }
    } catch (error) {
      console.error("Erro ao carregar planos:", error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sections/${section._id}/access`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access: {
            visibility: settings.visibility,
            publicSettings: settings.publicSettings,
            allowedRoles: settings.allowedRoles,
            allowedPlans: settings.allowedPlans,
            minimumPlan: settings.minimumPlan,
            customRuleId: settings.customRuleId,
            deniedMessage: settings.deniedMessage,
            upgradePrompt: settings.upgradePrompt,
            upgradeUrl: settings.upgradeUrl,
          },
          monetization: settings.monetization,
        }),
      });

      if (response.ok) {
        toast.success("Configurações de acesso atualizadas!");
        if (onUpdate) onUpdate();
      } else {
        throw new Error("Erro ao salvar configurações");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVisibilityChange = (visibility) => {
    setSettings((prev) => ({ ...prev, visibility }));
  };

  const toggleRole = (role) => {
    setSettings((prev) => ({
      ...prev,
      allowedRoles: prev.allowedRoles.includes(role)
        ? prev.allowedRoles.filter((r) => r !== role)
        : [...prev.allowedRoles, role],
    }));
  };

  const togglePlan = (planId) => {
    setSettings((prev) => ({
      ...prev,
      allowedPlans: prev.allowedPlans.includes(planId)
        ? prev.allowedPlans.filter((p) => p !== planId)
        : [...prev.allowedPlans, planId],
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Configurações de Acesso</h3>

        {/* Tipo de visibilidade */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-3">
            Quem pode acessar esta seção?
          </label>
          <div className="space-y-2">
            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="visibility"
                value="public"
                checked={settings.visibility === "public"}
                onChange={(e) => handleVisibilityChange(e.target.value)}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Público</div>
                <div className="text-sm text-gray-600">
                  Qualquer pessoa pode ver, mesmo sem login
                </div>
              </div>
            </label>

            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="visibility"
                value="authenticated"
                checked={settings.visibility === "authenticated"}
                onChange={(e) => handleVisibilityChange(e.target.value)}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Usuários autenticados</div>
                <div className="text-sm text-gray-600">
                  Apenas usuários logados podem acessar
                </div>
              </div>
            </label>

            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="visibility"
                value="workspace_member"
                checked={settings.visibility === "workspace_member"}
                onChange={(e) => handleVisibilityChange(e.target.value)}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Membros do workspace</div>
                <div className="text-sm text-gray-600">
                  Apenas membros deste workspace (padrão)
                </div>
              </div>
            </label>

            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="visibility"
                value="role_based"
                checked={settings.visibility === "role_based"}
                onChange={(e) => handleVisibilityChange(e.target.value)}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Por papel (role)</div>
                <div className="text-sm text-gray-600">
                  Restringir por papel no workspace
                </div>
              </div>
            </label>

            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="visibility"
                value="plan_based"
                checked={settings.visibility === "plan_based"}
                onChange={(e) => handleVisibilityChange(e.target.value)}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Por plano</div>
                <div className="text-sm text-gray-600">
                  Disponível apenas para planos específicos
                </div>
              </div>
            </label>

            <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="visibility"
                value="custom"
                checked={settings.visibility === "custom"}
                onChange={(e) => handleVisibilityChange(e.target.value)}
                className="mr-3"
              />
              <div>
                <div className="font-medium">Regra customizada</div>
                <div className="text-sm text-gray-600">
                  Usar regra de acesso avançada
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* Configurações específicas por tipo de visibilidade */}
        {settings.visibility === "public" && (
          <div className="p-4 bg-blue-50 rounded-lg space-y-3">
            <h4 className="font-medium mb-2">Configurações Públicas</h4>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.publicSettings.allowAnonymousView}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    publicSettings: {
                      ...prev.publicSettings,
                      allowAnonymousView: e.target.checked,
                    },
                  }))
                }
                className="mr-2"
              />
              <span className="text-sm">Permitir visualização sem login</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={settings.publicSettings.allowAnonymousCreate}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    publicSettings: {
                      ...prev.publicSettings,
                      allowAnonymousCreate: e.target.checked,
                    },
                  }))
                }
                className="mr-2"
              />
              <span className="text-sm">
                Permitir criação de itens sem login
              </span>
            </label>

            {settings.publicSettings.allowAnonymousCreate && (
              <>
                <label className="flex items-center ml-6">
                  <input
                    type="checkbox"
                    checked={settings.publicSettings.requireEmail}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        publicSettings: {
                          ...prev.publicSettings,
                          requireEmail: e.target.checked,
                        },
                      }))
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Exigir email</span>
                </label>

                <label className="flex items-center ml-6">
                  <input
                    type="checkbox"
                    checked={settings.publicSettings.requireCaptcha}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        publicSettings: {
                          ...prev.publicSettings,
                          requireCaptcha: e.target.checked,
                        },
                      }))
                    }
                    className="mr-2"
                  />
                  <span className="text-sm">Exigir captcha</span>
                </label>
              </>
            )}
          </div>
        )}

        {settings.visibility === "role_based" && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-3">Papéis com acesso</h4>
            <div className="space-y-2">
              {["owner", "admin", "editor", "author", "viewer", "guest"].map(
                (role) => (
                  <label key={role} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.allowedRoles.includes(role)}
                      onChange={() => toggleRole(role)}
                      className="mr-2"
                    />
                    <span className="text-sm capitalize">{role}</span>
                  </label>
                )
              )}
            </div>
          </div>
        )}

        {settings.visibility === "plan_based" && (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-3">Planos com acesso</h4>

            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                Plano mínimo necessário
              </label>
              <select
                value={settings.minimumPlan}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    minimumPlan: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="">Nenhum (especificar planos)</option>
                {plans.map((p) => (
                  <option key={p._id} value={p._id}>
                    {p.name} e superiores
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium mb-2">
                Ou escolha planos específicos:
              </p>
              {plans.map((plan) => (
                <label key={plan._id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.allowedPlans.includes(plan._id)}
                    onChange={() => togglePlan(plan._id)}
                    className="mr-2"
                  />
                  <span className="text-sm">{plan.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Monetização */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium mb-3">Monetização</h4>

          <label className="flex items-center mb-4">
            <input
              type="checkbox"
              checked={settings.monetization.isPaid}
              onChange={(e) =>
                setSettings((prev) => ({
                  ...prev,
                  monetization: {
                    ...prev.monetization,
                    isPaid: e.target.checked,
                  },
                }))
              }
              className="mr-2"
            />
            <span className="text-sm">Esta seção é paga</span>
          </label>

          {settings.monetization.isPaid && (
            <div className="space-y-4 ml-6">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tipo de cobrança
                </label>
                <select
                  value={settings.monetization.purchaseType}
                  onChange={(e) =>
                    setSettings((prev) => ({
                      ...prev,
                      monetization: {
                        ...prev.monetization,
                        purchaseType: e.target.value,
                      },
                    }))
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                >
                  <option value="one_time">Pagamento único</option>
                  <option value="subscription">Assinatura</option>
                  <option value="usage_based">Por uso (créditos)</option>
                </select>
              </div>

              {settings.monetization.purchaseType === "one_time" && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Preço (R$)
                  </label>
                  <input
                    type="number"
                    value={settings.monetization.price}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        monetization: {
                          ...prev.monetization,
                          price: parseFloat(e.target.value),
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                    step="0.01"
                  />
                </div>
              )}

              {settings.monetization.purchaseType === "subscription" && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Stripe Price ID
                  </label>
                  <input
                    type="text"
                    value={settings.monetization.stripePriceId}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        monetization: {
                          ...prev.monetization,
                          stripePriceId: e.target.value,
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="price_..."
                  />
                </div>
              )}

              {settings.monetization.purchaseType === "usage_based" && (
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Créditos necessários por uso
                  </label>
                  <input
                    type="number"
                    value={settings.monetization.usageCreditsRequired}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        monetization: {
                          ...prev.monetization,
                          usageCreditsRequired: parseInt(e.target.value),
                        },
                      }))
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                    min="0"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mensagens customizadas */}
        <div className="mt-6">
          <h4 className="font-medium mb-3">Mensagens Customizadas</h4>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Mensagem de acesso negado
              </label>
              <textarea
                value={settings.deniedMessage}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    deniedMessage: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
                placeholder="Você não tem permissão para acessar esta seção."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Mensagem de upgrade
              </label>
              <textarea
                value={settings.upgradePrompt}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    upgradePrompt: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
                rows={2}
                placeholder="Faça upgrade para acessar este conteúdo premium."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                URL de upgrade customizada
              </label>
              <input
                type="text"
                value={settings.upgradeUrl}
                onChange={(e) =>
                  setSettings((prev) => ({
                    ...prev,
                    upgradeUrl: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="/billing?feature=premium-section"
              />
            </div>
          </div>
        </div>

        {/* Botões de ação */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Salvando..." : "Salvar Configurações"}
          </button>
        </div>
      </div>
    </div>
  );
}
