"use client";

import { useState, useEffect, useCallback } from "react";
import { useMembership } from "@/lib/state/membership-context";
import { useUser } from "@clerk/nextjs";

/**
 * Página de teste para limites e bloqueios
 * Acesse: http://localhost:3000/test-limits
 *
 * Esta página permite testar limites sem quebrar o app principal
 * Mostra dados reais do MongoDB quando usuário está logado
 */
export default function TestLimitsPage() {
  const {
    isMember,
    isGuest,
    usage,
    limits,
    evaluateUsage,
    consumeUsage,
    markMember,
    resetGuestUsage,
  } = useMembership();
  const { user: clerkUser } = useUser();
  const [status, setStatus] = useState<string>("");
  const [userStatus, setUserStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Buscar dados reais do MongoDB quando usuário está logado
  useEffect(() => {
    const fetchUserStatus = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/user/status");
        const data = await response.json();
        setUserStatus(data);
      } catch (error) {
        console.error("Erro ao buscar status do usuário:", error);
        setUserStatus(null);
      } finally {
        setLoading(false);
      }
    };

    if (clerkUser) {
      fetchUserStatus();
    } else {
      setUserStatus(null);
      setLoading(false);
    }
  }, [clerkUser]);

  useEffect(() => {
    updateStatus();
  }, [usage, isMember, userStatus, limits]);

  const updateStatus = useCallback(() => {
    const membership =
      localStorage.getItem("insights_membership_status") || "guest";
    const usageDataRaw = localStorage.getItem("insights_guest_usage_v1");
    const usageData = usageDataRaw ? JSON.parse(usageDataRaw) : null;

    // Verificar se usage está sendo resetado
    const now = Date.now();
    const lastReset = usageData?.lastReset || 0;
    const daysSinceReset = (now - lastReset) / (24 * 60 * 60 * 1000);
    const willReset = daysSinceReset >= 1;

    const statusData: any = {
      membership,
      isMember,
      isGuest,
      usage,
      limits,
      usageData: usageData,
      usageDebug: {
        raw: usageDataRaw,
        lastReset: lastReset ? new Date(lastReset).toISOString() : null,
        daysSinceReset: daysSinceReset.toFixed(2),
        willReset,
        version: usageData?.version,
        counts: usageData?.counts,
      },
    };

    // Adicionar dados reais do MongoDB se disponível
    if (userStatus) {
      statusData.mongodbUser = {
        isAuthenticated: userStatus.isAuthenticated,
        email: userStatus.email,
        plan: userStatus.plan,
        usage: userStatus.usage,
        limits: userStatus.limits,
        stripeCustomerId: userStatus.stripeCustomerId,
        subscriptionStatus: userStatus.subscriptionStatus,
        source: userStatus.source,
      };
    }

    setStatus(JSON.stringify(statusData, null, 2));
  }, [usage, limits, isMember, isGuest, userStatus]);

  const simulateLimit = (
    action:
      | "tileChat"
      | "contactChat"
      | "regenerate"
      | "createContact"
      | "createWorkspace",
    count: number
  ) => {
    try {
      const usageData = JSON.parse(
        localStorage.getItem("insights_guest_usage_v1") ||
          '{"version":1,"lastReset":' + Date.now() + ',"counts":{}}'
      );
      usageData.counts[action] = count;
      localStorage.setItem(
        "insights_guest_usage_v1",
        JSON.stringify(usageData)
      );

      // Forçar atualização do contexto recarregando a página ou forçando re-render
      console.log(
        `[Test Limits] 🔧 Simulando limite ${action}: ${count}/${limits[action]}`
      );

      // Aguardar um pouco para o contexto atualizar
      setTimeout(() => {
        updateStatus();
        alert(
          `✅ Limite ${action} definido para ${count}/${limits[action]}\n\nRecarregue a página para ver as mudanças refletidas no contexto.`
        );
      }, 100);
    } catch (error) {
      console.error("[Test Limits] ❌ Erro ao simular limite:", error);
      alert(
        `❌ Erro ao simular limite: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const testAction = (
    action:
      | "tileChat"
      | "contactChat"
      | "regenerate"
      | "createContact"
      | "createWorkspace"
  ) => {
    try {
      console.log(`[Test Limits] 🧪 Testando ação: ${action}`);
      const preview = evaluateUsage(action);
      console.log(`[Test Limits] 📊 Preview:`, preview);

      if (preview.allowed) {
        const result = consumeUsage(action);
        console.log(`[Test Limits] ✅ Resultado:`, result);

        // Aguardar um pouco para o contexto atualizar
        setTimeout(() => {
          updateStatus();
          alert(
            `✅ Ação ${action} permitida!\n\nUsado: ${result.used}/${result.limit}\nRestante: ${result.remaining}`
          );
        }, 100);
      } else {
        alert(
          `❌ Ação ${action} BLOQUEADA!\n\nUsado: ${preview.used}/${preview.limit}\nRestante: ${preview.remaining}\n\nModal de upgrade deve aparecer no app principal!`
        );
        updateStatus();
      }
    } catch (error) {
      console.error("[Test Limits] ❌ Erro ao testar ação:", error);
      alert(
        `❌ Erro ao testar ação: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  };

  const resetAll = () => {
    localStorage.removeItem("insights_membership_status");
    localStorage.removeItem("insights_guest_usage_v1");
    resetGuestUsage();
    updateStatus();
    alert("✅ Tudo resetado!");
  };

  const setMember = () => {
    try {
      markMember();
      console.log("[Test Limits] ✅ Marcado como MEMBER");

      setTimeout(() => {
        updateStatus();
        alert(
          "✅ Agora você é MEMBER (sem limites)!\n\nRecarregue a página para ver as mudanças."
        );
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error("[Test Limits] ❌ Erro ao tornar-se member:", error);
      alert(
        `❌ Erro: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  };

  const setGuest = () => {
    localStorage.setItem("insights_membership_status", "guest");
    updateStatus();
    alert("✅ Agora você é GUEST (com limites)!");
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">
          🧪 Teste de Limites e Bloqueios
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Status Atual</h2>
            <button
              onClick={() => {
                console.log("[Test Limits] 🔄 Forçando atualização...");
                updateStatus();
                // Forçar re-render do contexto também
                window.location.reload();
              }}
              className="px-3 py-1 bg-slate-200 text-slate-700 rounded text-sm font-semibold hover:bg-slate-300 cursor-pointer"
            >
              🔄 Atualizar (Recarregar)
            </button>
          </div>
          <div className="mb-4">
            <div className="flex gap-4 mb-2 flex-wrap">
              <span
                className={`px-3 py-1 rounded-full text-sm font-semibold ${
                  isMember
                    ? "bg-green-100 text-green-800"
                    : "bg-yellow-100 text-yellow-800"
                }`}
              >
                {isMember ? "✅ MEMBER" : "👤 GUEST"}
              </span>
              {userStatus && (
                <>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      userStatus.isAuthenticated
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {userStatus.isAuthenticated
                      ? "🔐 AUTENTICADO"
                      : "🚫 NÃO AUTENTICADO"}
                  </span>
                  {userStatus.plan && (
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        userStatus.plan === "PRO_PLUS"
                          ? "bg-purple-100 text-purple-800"
                          : userStatus.plan === "PRO"
                          ? "bg-indigo-100 text-indigo-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      📦 PLANO: {userStatus.plan}
                    </span>
                  )}
                  {userStatus.source && (
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-slate-100 text-slate-800">
                      📍 Fonte: {userStatus.source}
                    </span>
                  )}
                </>
              )}
              {loading && (
                <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
                  ⏳ Carregando...
                </span>
              )}
            </div>
            {userStatus && userStatus.isAuthenticated && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-blue-900 mb-2">
                  📊 Dados do MongoDB:
                </h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <div>
                    Email: <strong>{userStatus.email || "N/A"}</strong>
                  </div>
                  <div>
                    Plano: <strong>{userStatus.plan}</strong>
                  </div>
                  {userStatus.stripeCustomerId && (
                    <div>
                      Stripe Customer:{" "}
                      <strong className="font-mono text-xs">
                        {userStatus.stripeCustomerId}
                      </strong>
                    </div>
                  )}
                  {userStatus.subscriptionStatus && (
                    <div>
                      Status Assinatura:{" "}
                      <strong>{userStatus.subscriptionStatus}</strong>
                    </div>
                  )}
                  {userStatus.usage && (
                    <div className="mt-2">
                      <div className="font-semibold">Usage:</div>
                      <ul className="ml-4 space-y-1">
                        <li>
                          Tokens: {userStatus.usage.tokensUsed} /{" "}
                          {userStatus.limits?.monthlyTokens || "N/A"}
                        </li>
                        <li>
                          Companies: {userStatus.usage.companiesCount} /{" "}
                          {userStatus.limits?.maxCompanies || "N/A"}
                        </li>
                        <li>
                          Contacts: {userStatus.usage.contactsCount} /{" "}
                          {userStatus.limits?.maxContactsPerCompany || "N/A"}
                        </li>
                        <li>
                          Files: {userStatus.usage.filesUploaded} /{" "}
                          {userStatus.limits?.maxFilesPerCompany || "N/A"}
                        </li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <pre className="bg-slate-100 p-4 rounded text-xs overflow-auto max-h-96">
            {status}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Limites Atuais</h2>
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(limits).map(([action, limit]) => {
              const used = usage[action as keyof typeof usage];
              const remaining = limit - used;
              return (
                <div key={action} className="border rounded p-3">
                  <div className="font-semibold text-sm mb-1">{action}</div>
                  <div className="text-xs text-slate-600">
                    Usado: <span className="font-semibold">{used}</span> /{" "}
                    {limit}
                  </div>
                  <div className="text-xs text-slate-600">
                    Restante: <span className="font-semibold">{remaining}</span>
                  </div>
                  <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        remaining > 0 ? "bg-blue-500" : "bg-red-500"
                      }`}
                      style={{ width: `${(used / limit) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Simular Limites</h2>
          <p className="text-sm text-slate-600 mb-4">
            Defina limites manualmente para testar bloqueios
          </p>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(limits).map(([action, limit]) => (
              <div key={action} className="flex gap-2">
                <button
                  onClick={() => simulateLimit(action as any, limit)}
                  className="flex-1 px-3 py-2 bg-red-500 text-white rounded text-sm font-semibold hover:bg-red-600"
                >
                  {action}: {limit}/{limit} (MAX)
                </button>
                <button
                  onClick={() => simulateLimit(action as any, limit - 1)}
                  className="px-3 py-2 bg-yellow-500 text-white rounded text-sm font-semibold hover:bg-yellow-600"
                >
                  {limit - 1}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Testar Ações</h2>
          <p className="text-sm text-slate-600 mb-4">
            Clique para testar se a ação é permitida ou bloqueada
          </p>
          <div className="grid grid-cols-2 gap-3">
            {Object.keys(limits).map((action) => {
              // Não chamar evaluateUsage durante render - usar dados do usage diretamente
              const used = usage[action as keyof typeof usage] || 0;
              const limit = limits[action as keyof typeof limits];
              const allowed = used < limit;
              return (
                <button
                  key={action}
                  onClick={() => testAction(action as any)}
                  className={`px-4 py-3 rounded font-semibold text-sm ${
                    allowed
                      ? "bg-green-500 text-white hover:bg-green-600"
                      : "bg-red-500 text-white hover:bg-red-600"
                  }`}
                >
                  {allowed ? "✅" : "❌"} {action}
                  <div className="text-xs mt-1 opacity-90">
                    {used}/{limit}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Controles</h2>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={resetAll}
              className="px-4 py-2 bg-slate-500 text-white rounded font-semibold hover:bg-slate-600"
            >
              🔄 Resetar Tudo
            </button>
            <button
              onClick={setMember}
              className="px-4 py-2 bg-green-500 text-white rounded font-semibold hover:bg-green-600"
            >
              ✅ Tornar-se MEMBER
            </button>
            <button
              onClick={setGuest}
              className="px-4 py-2 bg-yellow-500 text-white rounded font-semibold hover:bg-yellow-600"
            >
              👤 Tornar-se GUEST
            </button>
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set("checkout", "success");
                window.history.replaceState({}, "", url);
                alert(
                  "✅ URL atualizada com ?checkout=success\nRecarregue a página!"
                );
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600 cursor-pointer"
            >
              🛒 Simular Checkout Success
            </button>
            <button
              onClick={() => {
                const usageData = localStorage.getItem(
                  "insights_guest_usage_v1"
                );
                const membership = localStorage.getItem(
                  "insights_membership_status"
                );
                alert(
                  `📊 Debug LocalStorage:\n\nMembership: ${membership}\n\nUsage Data:\n${
                    usageData || "null"
                  }`
                );
                updateStatus();
              }}
              className="px-4 py-2 bg-purple-500 text-white rounded font-semibold hover:bg-purple-600 cursor-pointer"
            >
              🔍 Debug LocalStorage
            </button>
            <button
              onClick={async () => {
                try {
                  const response = await fetch("/api/user/status");
                  const data = await response.json();
                  alert(
                    `📊 Status do Usuário:\n\n${JSON.stringify(data, null, 2)}`
                  );
                  setUserStatus(data);
                  updateStatus();
                } catch (e) {
                  alert(
                    `❌ Erro: ${e instanceof Error ? e.message : String(e)}`
                  );
                }
              }}
              className="px-4 py-2 bg-indigo-500 text-white rounded font-semibold hover:bg-indigo-600 cursor-pointer"
            >
              🔄 Atualizar Status MongoDB
            </button>
            <button
              onClick={() => {
                try {
                  // Forçar incremento manual para testar
                  console.log("[Test Limits] 🧪 Testando incremento manual...");
                  const result = consumeUsage("createWorkspace");
                  console.log("[Test Limits] 🧪 Resultado:", result);

                  setTimeout(() => {
                    updateStatus();
                    alert(
                      `🧪 Teste Manual:\n\nAção: createWorkspace\nPermitido: ${result.allowed}\nUsado: ${result.used}/${result.limit}\nRestante: ${result.remaining}\n\nRecarregue a página para ver atualizado.`
                    );
                  }, 100);
                } catch (error) {
                  console.error(
                    "[Test Limits] ❌ Erro no teste manual:",
                    error
                  );
                  alert(
                    `❌ Erro: ${
                      error instanceof Error ? error.message : String(error)
                    }`
                  );
                }
              }}
              className="px-4 py-2 bg-pink-500 text-white rounded font-semibold hover:bg-pink-600 cursor-pointer"
            >
              🧪 Testar Incremento Manual
            </button>
            <button
              onClick={() => {
                console.log("[Test Limits] 🔄 Forçando refresh completo...");
                if (typeof window !== "undefined") {
                  window.location.reload();
                }
              }}
              className="px-4 py-2 bg-teal-500 text-white rounded font-semibold hover:bg-teal-600 cursor-pointer"
            >
              🔄 Refresh Completo
            </button>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">
            ℹ️ Informações sobre Usage
          </h3>
          <div className="text-sm text-blue-800 space-y-2">
            <p>
              <strong>⚠️ Importante:</strong> O sistema de tracking só conta
              ações manuais do usuário:
            </p>
            <ul className="list-disc list-inside ml-2 space-y-1">
              <li>
                <strong>createWorkspace:</strong> Contado quando você cria um
                workspace (não conta tiles gerados automaticamente)
              </li>
              <li>
                <strong>tileChat:</strong> Contado quando você faz chat com um
                tile
              </li>
              <li>
                <strong>contactChat:</strong> Contado quando você faz chat com
                um contact
              </li>
              <li>
                <strong>regenerate:</strong> Contado quando você regenera um
                tile
              </li>
              <li>
                <strong>createContact:</strong> Contado quando você cria um
                contact manualmente
              </li>
            </ul>
            <p className="mt-2">
              <strong>💡 Nota:</strong> Se você tem 8 tiles mas usage mostra 0,
              isso é normal! Os tiles foram gerados automaticamente quando você
              criou o workspace, então não contam para o limite.
            </p>
            <p className="mt-2">
              <strong>🔄 Reset:</strong> O usage é resetado automaticamente após
              24 horas.
            </p>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Instruções</h3>
          <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
            <li>Use "Simular Limites" para definir limites máximos</li>
            <li>Use "Testar Ações" para verificar se ações são bloqueadas</li>
            <li>
              Quando limite é atingido, modal de upgrade deve aparecer no app
              principal
            </li>
            <li>Use "Tornar-se MEMBER" para testar sem limites</li>
            <li>Use "Resetar Tudo" para voltar ao estado inicial</li>
            <li>
              Use "Debug LocalStorage" para ver dados brutos do localStorage
            </li>
            <li>
              Use "Atualizar Status MongoDB" para buscar dados reais do banco
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
