"use client";

import { useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import Button from "@/components/ui/Button";

export default function MigrationPage() {
  const { currentWorkspace } = useWorkspace();
  const [migrating, setMigrating] = useState(false);
  const [result, setResult] = useState(null);

  const runMigration = async () => {
    if (!currentWorkspace) {
      alert("Nenhum workspace selecionado");
      return;
    }

    if (
      !confirm(
        `🚑 MIGRAÇÃO URGENTE\n\nMigrar TODOS os dados órfãos (sem workspaceId) para o workspace "${currentWorkspace.name}"?\n\nEsta ação irá:\n- Associar content types órfãos ao workspace atual\n- Associar sections órfãs ao workspace atual  \n- Deletar relacionamentos quebrados\n\nContinuar?`
      )
    ) {
      return;
    }

    try {
      setMigrating(true);
      setResult(null);

      const response = await fetch("/api/debug/migrate-orphaned-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-workspace-id": currentWorkspace._id,
        },
        body: JSON.stringify({ targetWorkspaceId: currentWorkspace._id }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        const error = await response.json();
        throw new Error(error.error || "Falha na migração");
      }
    } catch (error) {
      console.error("Erro na migração:", error);
      alert(`Erro na migração: ${error.message}`);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-orange-50 dark:bg-orange-900 border border-orange-200 dark:border-orange-800 rounded-lg p-6 mb-6">
        <h1 className="text-2xl font-bold text-orange-800 dark:text-orange-200 mb-4">
          🚑 Migração Urgente de Dados
        </h1>
        <p className="text-orange-700 dark:text-orange-300 mb-4">
          Esta página é temporária para resolver problemas de dados órfãos
          (content types e sections sem workspaceId).
        </p>
      </div>

      {currentWorkspace ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
          <h2 className="text-xl font-semibold mb-4">
            📍 Workspace de Destino: {currentWorkspace.name}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            ID: {currentWorkspace._id}
          </p>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              🔧 O que esta migração fará:
            </h3>
            <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
              <li>Associar content types órfãos ao workspace atual</li>
              <li>Associar sections órfãs ao workspace atual</li>
              <li>Associar items órfãos ao workspace atual</li>
              <li>Deletar sections com relacionamentos quebrados</li>
            </ul>

            <div className="pt-6 border-t dark:border-gray-700">
              <Button
                onClick={runMigration}
                disabled={migrating}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {migrating ? "Migrando..." : "🚑 Executar Migração"}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
            ❌ Nenhum Workspace Selecionado
          </h2>
          <p className="text-red-700 dark:text-red-300">
            Selecione um workspace no topo da página antes de executar a
            migração.
          </p>
        </div>
      )}

      {result && (
        <div className="mt-6 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-800 dark:text-green-200 mb-4">
            ✅ Migração Concluída
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {result.migratedContentTypes}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Content Types
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {result.migratedSections}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Sections
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {result.migratedItems}
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Items
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {result.deletedBrokenSections}
              </div>
              <div className="text-sm text-red-700 dark:text-red-300">
                Sections Quebradas
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded border">
            <h3 className="font-medium mb-2">📋 Próximos Passos:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>
                Acesse <strong>/dashboard</strong> para verificar se os números
                estão corretos
              </li>
              <li>Teste criar/editar sections e content types</li>
              <li>Verifique se o isolamento por workspace está funcionando</li>
              <li>Reporte se ainda há problemas</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
