"use client";

import { useState, useEffect } from "react";
import { useMembership } from "@/lib/state/membership-context";

/**
 * Página de teste para limites e bloqueios
 * Acesse: http://localhost:3000/test-limits
 * 
 * Esta página permite testar limites sem quebrar o app principal
 */
export default function TestLimitsPage() {
  const { isMember, isGuest, usage, limits, evaluateUsage, consumeUsage, markMember, resetGuestUsage } = useMembership();
  const [status, setStatus] = useState<string>("");

  useEffect(() => {
    updateStatus();
  }, [usage, isMember]);

  const updateStatus = () => {
    const membership = localStorage.getItem("insights_membership_status") || "guest";
    const usageData = localStorage.getItem("insights_guest_usage_v1");
    setStatus(JSON.stringify({
      membership,
      isMember,
      isGuest,
      usage,
      limits,
      usageData: usageData ? JSON.parse(usageData) : null,
    }, null, 2));
  };

  const simulateLimit = (action: "tileChat" | "contactChat" | "regenerate" | "createContact" | "createWorkspace", count: number) => {
    const usageData = JSON.parse(localStorage.getItem("insights_guest_usage_v1") || '{"version":1,"lastReset":' + Date.now() + ',"counts":{}}');
    usageData.counts[action] = count;
    localStorage.setItem("insights_guest_usage_v1", JSON.stringify(usageData));
    updateStatus();
    alert(`✅ Limite ${action} definido para ${count}/${limits[action]}`);
  };

  const testAction = (action: "tileChat" | "contactChat" | "regenerate" | "createContact" | "createWorkspace") => {
    const preview = evaluateUsage(action);
    if (preview.allowed) {
      const result = consumeUsage(action);
      alert(`✅ Ação ${action} permitida! Usado: ${result.used}/${result.limit}`);
    } else {
      alert(`❌ Ação ${action} BLOQUEADA! Usado: ${preview.used}/${preview.limit}\n\nModal de upgrade deve aparecer!`);
    }
    updateStatus();
  };

  const resetAll = () => {
    localStorage.removeItem("insights_membership_status");
    localStorage.removeItem("insights_guest_usage_v1");
    resetGuestUsage();
    updateStatus();
    alert("✅ Tudo resetado!");
  };

  const setMember = () => {
    markMember();
    updateStatus();
    alert("✅ Agora você é MEMBER (sem limites)!");
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
        <h1 className="text-3xl font-bold mb-6">🧪 Teste de Limites e Bloqueios</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status Atual</h2>
          <div className="mb-4">
            <div className="flex gap-4 mb-2">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${isMember ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}>
                {isMember ? "✅ MEMBER" : "👤 GUEST"}
              </span>
            </div>
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
                    Usado: <span className="font-semibold">{used}</span> / {limit}
                  </div>
                  <div className="text-xs text-slate-600">
                    Restante: <span className="font-semibold">{remaining}</span>
                  </div>
                  <div className="mt-2 h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${remaining > 0 ? "bg-blue-500" : "bg-red-500"}`}
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
                alert("✅ URL atualizada com ?checkout=success\nRecarregue a página!");
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded font-semibold hover:bg-blue-600"
            >
              🛒 Simular Checkout Success
            </button>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-900 mb-2">⚠️ Instruções</h3>
          <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
            <li>Use "Simular Limites" para definir limites máximos</li>
            <li>Use "Testar Ações" para verificar se ações são bloqueadas</li>
            <li>Quando limite é atingido, modal de upgrade deve aparecer no app principal</li>
            <li>Use "Tornar-se MEMBER" para testar sem limites</li>
            <li>Use "Resetar Tudo" para voltar ao estado inicial</li>
          </ol>
        </div>
      </div>
    </div>
  );
}

