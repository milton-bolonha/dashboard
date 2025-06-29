"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function SectionsDebugPage() {
  const { user } = useUser();
  const { workspaces, currentWorkspace } = useWorkspace();
  const [allSections, setAllSections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAllSections();
    }
  }, [user]);

  const fetchAllSections = async () => {
    try {
      setLoading(true);

      // Buscar sections SEM filtro de workspace para ver todas
      const response = await fetch("/api/debug/sections");

      if (response.ok) {
        const data = await response.json();
        console.log("🔍 Todas as sections no sistema:", data);
        setAllSections(data.sections || []);
      }
    } catch (error) {
      console.error("❌ Erro ao buscar sections:", error);
    } finally {
      setLoading(false);
    }
  };

  const fixSectionWorkspace = async (sectionId) => {
    if (!currentWorkspace) {
      alert("Nenhum workspace atual selecionado");
      return;
    }

    try {
      const response = await fetch(`/api/debug/sections/${sectionId}/fix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId: currentWorkspace._id }),
      });

      if (response.ok) {
        alert("Section corrigida!");
        fetchAllSections();
      }
    } catch (error) {
      console.error("❌ Erro ao corrigir section:", error);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">
        🔍 Debug - Sections vs Workspaces
      </h1>

      {/* Workspace atual */}
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">🏢 Workspace Atual</h2>
        {currentWorkspace ? (
          <div>
            <p>
              <strong>Nome:</strong> {currentWorkspace.name}
            </p>
            <p>
              <strong>ID:</strong> {currentWorkspace._id}
            </p>
          </div>
        ) : (
          <p className="text-red-600">❌ Nenhum workspace selecionado</p>
        )}
      </div>

      {/* Lista de workspaces */}
      <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">📋 Todos os Workspaces</h2>
        {workspaces.length > 0 ? (
          <div className="space-y-2">
            {workspaces.map((ws) => (
              <div
                key={ws._id}
                className="p-2 bg-white dark:bg-gray-700 rounded"
              >
                <p>
                  <strong>{ws.name}</strong> - {ws._id}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p>Nenhum workspace encontrado</p>
        )}
      </div>

      {/* Todas as sections */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">
          📋 Todas as Sections no Sistema
        </h2>

        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2">Carregando...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 dark:border-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="border px-4 py-2 text-left">Nome</th>
                  <th className="border px-4 py-2 text-left">Slug</th>
                  <th className="border px-4 py-2 text-left">User ID</th>
                  <th className="border px-4 py-2 text-left">Workspace ID</th>
                  <th className="border px-4 py-2 text-left">Status</th>
                  <th className="border px-4 py-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {allSections.length > 0 ? (
                  allSections.map((section) => (
                    <tr key={section._id} className="border-b">
                      <td className="border px-4 py-2">{section.name}</td>
                      <td className="border px-4 py-2">{section.slug}</td>
                      <td className="border px-4 py-2 text-xs">
                        {section.userId}
                      </td>
                      <td className="border px-4 py-2">
                        {section.workspaceId ? (
                          <span className="text-green-600 text-xs">
                            {section.workspaceId}
                          </span>
                        ) : (
                          <span className="text-red-600 font-bold">
                            ❌ SEM WORKSPACE
                          </span>
                        )}
                      </td>
                      <td className="border px-4 py-2">
                        {section.workspaceId ? (
                          <span className="text-green-600">✅ OK</span>
                        ) : (
                          <span className="text-red-600">❌ PROBLEMA</span>
                        )}
                      </td>
                      <td className="border px-4 py-2">
                        {!section.workspaceId && (
                          <button
                            onClick={() => fixSectionWorkspace(section._id)}
                            className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700"
                          >
                            Corrigir
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="6"
                      className="border px-4 py-2 text-center text-gray-500"
                    >
                      Nenhuma section encontrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
