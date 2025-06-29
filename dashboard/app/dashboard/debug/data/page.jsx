"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function DataDebugPage() {
  const { currentWorkspace } = useWorkspace();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/debug/data-analysis");
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data.analysis);
      }
    } catch (error) {
      console.error("Erro ao carregar análise:", error);
    } finally {
      setLoading(false);
    }
  };

  const migrateOrphanedData = async () => {
    if (!currentWorkspace) {
      alert("Nenhum workspace selecionado para migração");
      return;
    }

    if (
      !confirm(
        `Migrar dados órfãos para o workspace "${currentWorkspace.name}"?`
      )
    ) {
      return;
    }

    try {
      setMigrating(true);
      const response = await fetch("/api/debug/migrate-orphaned-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": currentWorkspace._id,
        },
        body: JSON.stringify({ targetWorkspaceId: currentWorkspace._id }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Migração concluída:\n- Content Types: ${result.migratedContentTypes}\n- Sections: ${result.migratedSections}\n- Items: ${result.migratedItems}`
        );
        loadAnalysis(); // Recarregar análise
      } else {
        const error = await response.json();
        alert(`Erro na migração: ${error.error}`);
      }
    } catch (error) {
      console.error("Erro na migração:", error);
      alert(`Erro na migração: ${error.message}`);
    } finally {
      setMigrating(false);
    }
  };

  useEffect(() => {
    loadAnalysis();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">🔍 Análise de Dados</h1>
        <div className="text-gray-600">Carregando análise...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">🔍 Análise Completa de Dados</h1>
        <div className="space-x-2">
          <button
            onClick={loadAnalysis}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            🔄 Recarregar
          </button>
          {analysis &&
            (analysis.contentTypes.withoutWorkspace > 0 ||
              analysis.sections.withoutWorkspace > 0) && (
              <button
                onClick={migrateOrphanedData}
                disabled={migrating || !currentWorkspace}
                className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 disabled:bg-gray-400"
              >
                {migrating ? "Migrando..." : "🚑 Migrar Dados Órfãos"}
              </button>
            )}
        </div>
      </div>

      {currentWorkspace && (
        <div className="bg-blue-50 dark:bg-blue-900 p-4 rounded-lg mb-6">
          <h2 className="font-semibold text-blue-800 dark:text-blue-200">
            📍 Workspace Atual: {currentWorkspace.name}
          </h2>
          <p className="text-sm text-blue-600 dark:text-blue-300">
            ID: {currentWorkspace._id}
          </p>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Resumo Geral */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">📊 Resumo Geral</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {analysis.workspaces.total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Workspaces
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {analysis.contentTypes.total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Content Types
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-2xl font-bold text-purple-600">
                  {analysis.sections.total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Sections
                </div>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <div className="text-2xl font-bold text-orange-600">
                  {analysis.items.total}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Items
                </div>
              </div>
            </div>
          </div>

          {/* Recomendações */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">🎯 Recomendações</h2>
            <ul className="space-y-2">
              {analysis.recommendations?.map((rec, index) => (
                <li
                  key={index}
                  className={`flex items-center space-x-2 ${
                    rec.includes("❌") ? "text-red-600" : "text-green-600"
                  }`}
                >
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Content Types Órfãos */}
          {analysis.contentTypes.withoutWorkspace > 0 && (
            <div className="bg-red-50 dark:bg-red-900 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-red-800 dark:text-red-200">
                ❌ Content Types Órfãos (
                {analysis.contentTypes.withoutWorkspace})
              </h2>
              <div className="space-y-2">
                {analysis.contentTypes.orphaned.map((ct) => (
                  <div
                    key={ct.id}
                    className="bg-white dark:bg-gray-700 p-3 rounded border-l-4 border-red-500"
                  >
                    <div className="font-medium">{ct.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Slug: {ct.slug} | ID: {ct.id} | WorkspaceId:{" "}
                      {ct.workspaceId}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sections Órfãs */}
          {analysis.sections.withoutWorkspace > 0 && (
            <div className="bg-orange-50 dark:bg-orange-900 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-orange-800 dark:text-orange-200">
                ⚠️ Sections Órfãs ({analysis.sections.withoutWorkspace})
              </h2>
              <div className="space-y-2">
                {analysis.sections.orphaned.map((s) => (
                  <div
                    key={s.id}
                    className="bg-white dark:bg-gray-700 p-3 rounded border-l-4 border-orange-500"
                  >
                    <div className="font-medium">{s.name}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">
                      Slug: {s.slug} | ContentType: {s.contentTypeId} |
                      WorkspaceId: {s.workspaceId}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Relacionamentos Quebrados */}
          {analysis.brokenRelationships.sectionsWithInvalidContentType.length >
            0 && (
            <div className="bg-red-50 dark:bg-red-900 p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-red-800 dark:text-red-200">
                💔 Relacionamentos Quebrados (
                {
                  analysis.brokenRelationships.sectionsWithInvalidContentType
                    .length
                }
                )
              </h2>
              <div className="space-y-2">
                {analysis.brokenRelationships.sectionsWithInvalidContentType.map(
                  (rel) => (
                    <div
                      key={rel.sectionId}
                      className="bg-white dark:bg-gray-700 p-3 rounded border-l-4 border-red-600"
                    >
                      <div className="font-medium">{rel.sectionName}</div>
                      <div className="text-sm text-red-600">
                        Section ID: {rel.sectionId} → Content Type ID inválido:{" "}
                        {rel.invalidContentTypeId}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Workspaces */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              🏢 Workspaces ({analysis.workspaces.total})
            </h2>
            <div className="space-y-2">
              {analysis.workspaces.list.map((ws) => (
                <div
                  key={ws.id}
                  className="bg-gray-50 dark:bg-gray-700 p-3 rounded"
                >
                  <div className="font-medium">{ws.name}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    Slug: {ws.slug} | Owner: {ws.ownerId} | ID: {ws.id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
