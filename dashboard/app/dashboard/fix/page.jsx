"use client";

import { useState } from "react";

export default function FixPage() {
  const [fixing, setFixing] = useState(false);
  const [result, setResult] = useState(null);

  const runFix = async () => {
    if (
      !confirm(
        "🔧 CORREÇÃO DE RELACIONAMENTOS\n\nEsta ação irá:\n- Analisar todos os workspaces\n- Identificar content types usados incorretamente\n- Criar cópias de content types onde necessário\n- Corrigir relacionamentos entre sections e content types\n- Deletar sections órfãs\n\nContinuar?"
      )
    ) {
      return;
    }

    try {
      setFixing(true);
      const response = await fetch("/api/debug/fix-relationships", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        const error = await response.json();
        alert(`Erro na correção: ${error.error}`);
      }
    } catch (error) {
      console.error("Erro:", error);
      alert(`Erro na correção: ${error.message}`);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-4">
          🔧 Correção de Relacionamentos
        </h1>
        <p className="text-blue-700 dark:text-blue-300 mb-4">
          Baseado na análise dos seus dados, o problema são{" "}
          <strong>relacionamentos quebrados</strong> entre content types e
          sections de workspaces diferentes.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">
          📊 Problema Identificado:
        </h2>

        <div className="bg-red-50 dark:bg-red-900 p-4 rounded mb-4">
          <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">
            ❌ Relacionamentos Quebrados:
          </h3>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            <li>
              • Section "primeira" (workspace "Deletar") → usa content type
              "teeets" (workspace "Meu Workspace")
            </li>
            <li>
              • Section "ttt" (workspace "Deletar") → usa content type "teeets"
              (workspace "Meu Workspace")
            </li>
            <li>
              • Section "ttttte" (workspace "Autores Apaixonados-3") → usa
              content type "teeets" (workspace "Meu Workspace")
            </li>
          </ul>
        </div>

        <div className="bg-green-50 dark:bg-green-900 p-4 rounded mb-4">
          <h3 className="font-medium text-green-800 dark:text-green-200 mb-2">
            ✅ O que a correção fará:
          </h3>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <li>
              • Criar cópias dos content types para cada workspace que precisa
            </li>
            <li>
              • Atualizar sections para usar os content types corretos do seu
              workspace
            </li>
            <li>
              • Deletar sections órfãs (que referenciam content types
              inexistentes)
            </li>
            <li>• Garantir isolamento perfeito entre workspaces</li>
          </ul>
        </div>

        <button
          onClick={runFix}
          disabled={fixing}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded disabled:bg-gray-400"
        >
          {fixing ? "Corrigindo..." : "🔧 Corrigir Relacionamentos"}
        </button>
      </div>

      {result && (
        <div className="bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-4">
            ✅ Correção Concluída!
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded">
              <div className="text-2xl font-bold text-green-600">
                {result.contentTypesCreated}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Content Types Criados
              </div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded">
              <div className="text-2xl font-bold text-blue-600">
                {result.sectionsFixed}
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                Sections Corrigidas
              </div>
            </div>
            <div className="text-center p-3 bg-white dark:bg-gray-800 rounded">
              <div className="text-2xl font-bold text-red-600">
                {result.sectionsDeleted}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">
                Sections Órfãs Deletadas
              </div>
            </div>
          </div>

          {result.details && result.details.length > 0 && (
            <div className="bg-white dark:bg-gray-800 p-4 rounded border">
              <h3 className="font-medium mb-2">📋 Detalhes das Correções:</h3>
              <ul className="text-sm space-y-1">
                {result.details.map((detail, i) => (
                  <li key={i} className="text-gray-700 dark:text-gray-300">
                    • {detail}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900 rounded border">
            <h3 className="font-medium mb-2">🎯 Próximos Passos:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>
                Acesse <strong>/dashboard</strong> para verificar
              </li>
              <li>Teste trocar entre workspaces</li>
              <li>
                Verifique se content types aparecem apenas no workspace correto
              </li>
              <li>Teste criar/editar content types e sections</li>
              <li>Verifique se sections individuais carregam sem erro</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
