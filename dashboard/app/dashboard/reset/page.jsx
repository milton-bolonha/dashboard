"use client";

import { useState } from "react";

export default function ResetPage() {
  const [analyzing, setAnalyzing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [result, setResult] = useState(null);

  const runAnalysis = async () => {
    try {
      setAnalyzing(true);
      const response = await fetch("/api/debug/real-analysis");
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
      } else {
        alert("Erro na análise");
      }
    } catch (error) {
      console.error("Erro:", error);
      alert(`Erro na análise: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const runReset = async () => {
    if (
      !confirm(
        "🔥 ATENÇÃO!\n\nEsta ação vai DELETAR TODOS os seus dados:\n- Content Types\n- Sections\n- Items\n- Workspaces\n\nE criar um workspace limpo do zero.\n\nTem certeza?"
      )
    ) {
      return;
    }

    try {
      setResetting(true);
      const response = await fetch("/api/debug/nuclear-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE_EVERYTHING" }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
        // Refresh a página após 3 segundos
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 3000);
      } else {
        const error = await response.json();
        alert(`Erro no reset: ${error.error}`);
      }
    } catch (error) {
      console.error("Erro:", error);
      alert(`Erro no reset: ${error.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-red-800 dark:text-red-200 mb-4">
          🔥 Reset Nuclear - Começar do Zero
        </h1>
        <p className="text-red-700 dark:text-red-300 mb-4">
          Esta página permite analisar seus dados atuais e fazer um reset
          completo se necessário.
        </p>
      </div>

      {/* Análise */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mb-6">
        <h2 className="text-xl font-semibold mb-4">
          📊 Passo 1: Análise dos Dados
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Primeiro, vamos ver exatamente o que está no seu banco de dados.
        </p>

        <button
          onClick={runAnalysis}
          disabled={analyzing}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {analyzing ? "Analisando..." : "🔍 Analisar Dados"}
        </button>

        {analysis && (
          <div className="mt-6 space-y-4">
            <h3 className="text-lg font-medium">📋 Resultados da Análise:</h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 dark:bg-blue-900 p-3 rounded text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {analysis.workspaces.total}
                </div>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  Workspaces
                </div>
              </div>
              <div className="bg-green-50 dark:bg-green-900 p-3 rounded text-center">
                <div className="text-2xl font-bold text-green-600">
                  {analysis.contentTypes.total}
                </div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  Content Types
                </div>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900 p-3 rounded text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {analysis.sections.total}
                </div>
                <div className="text-sm text-purple-700 dark:text-purple-300">
                  Sections
                </div>
              </div>
              <div className="bg-orange-50 dark:bg-orange-900 p-3 rounded text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {analysis.items.total}
                </div>
                <div className="text-sm text-orange-700 dark:text-orange-300">
                  Items
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900 p-4 rounded">
              <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                ⚠️ Problemas Detectados:
              </h4>
              <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <li>
                  Content Types sem workspace:{" "}
                  {analysis.problems.contentTypesWithoutWorkspace}
                </li>
                <li>
                  Sections sem workspace:{" "}
                  {analysis.problems.sectionsWithoutWorkspace}
                </li>
                <li>
                  Items sem workspace: {analysis.problems.itemsWithoutWorkspace}
                </li>
              </ul>
            </div>

            {analysis.contentTypes.data.length > 0 && (
              <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded">
                <h4 className="font-medium mb-2">📄 Content Types:</h4>
                <div className="space-y-1 text-sm">
                  {analysis.contentTypes.data.map((ct, i) => (
                    <div key={i} className="flex justify-between">
                      <span>{ct.name}</span>
                      <span
                        className={
                          ct.hasWorkspaceId ? "text-green-600" : "text-red-600"
                        }
                      >
                        {ct.hasWorkspaceId ? "✅ OK" : "❌ SEM WORKSPACE"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Reset */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
        <h2 className="text-xl font-semibold mb-4">
          🔥 Passo 2: Reset Nuclear
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Se há problemas nos dados, você pode deletar tudo e começar limpo.
        </p>

        <div className="bg-red-50 dark:bg-red-900 p-4 rounded mb-4">
          <h3 className="font-medium text-red-800 dark:text-red-200 mb-2">
            ⚠️ Esta ação irá:
          </h3>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            <li>• Deletar TODOS os content types</li>
            <li>• Deletar TODAS as sections</li>
            <li>• Deletar TODOS os items</li>
            <li>• Deletar TODOS os workspaces</li>
            <li>• Criar 1 workspace limpo</li>
          </ul>
        </div>

        <button
          onClick={runReset}
          disabled={resetting}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:bg-gray-400"
        >
          {resetting ? "Resetando..." : "🔥 RESET NUCLEAR"}
        </button>

        {result && (
          <div className="mt-6 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-4">
              ✅ Reset Concluído!
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {result.deleted.contentTypes}
                </div>
                <div className="text-sm text-red-700 dark:text-red-300">
                  CT Deletados
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {result.deleted.sections}
                </div>
                <div className="text-sm text-red-700 dark:text-red-300">
                  Sections Deletadas
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {result.deleted.items}
                </div>
                <div className="text-sm text-red-700 dark:text-red-300">
                  Items Deletados
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">1</div>
                <div className="text-sm text-green-700 dark:text-green-300">
                  Workspace Criado
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 p-4 rounded border">
              <p className="text-green-700 dark:text-green-300 mb-2">
                🎉{" "}
                <strong>
                  Workspace "{result.created.workspace.name}" criado!
                </strong>
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Redirecionando para dashboard em 3 segundos...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
