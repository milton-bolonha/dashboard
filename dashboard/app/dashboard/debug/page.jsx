"use client";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export default function DebugPage() {
  const { user } = useUser();
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      fetchWorkspaces();
    }
  }, [user]);

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);

      console.log("🔍 Fazendo requisição para /api/workspaces");
      const response = await fetch("/api/workspaces");

      console.log("📡 Response status:", response.status);
      console.log("📡 Response headers:", response.headers);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("📊 Dados recebidos:", data);

      setWorkspaces(data.workspaces || []);
    } catch (err) {
      console.error("❌ Erro ao buscar workspaces:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div className="p-6">Carregando usuário...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">🔍 Debug - Workspaces</h1>

      {/* Informações do usuário */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">👤 Usuário Atual</h2>
        <div className="text-sm text-gray-600 dark:text-gray-300">
          <p>
            <strong>ID:</strong> {user.id}
          </p>
          <p>
            <strong>Email:</strong> {user.emailAddresses[0]?.emailAddress}
          </p>
        </div>
      </div>

      {/* Botão para recarregar */}
      <div className="mb-6">
        <button
          onClick={fetchWorkspaces}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Carregando..." : "🔄 Recarregar Workspaces"}
        </button>
      </div>

      {/* Status */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">📊 Status</h2>
        <div className="text-sm">
          <p>
            <strong>Loading:</strong> {loading ? "Sim" : "Não"}
          </p>
          <p>
            <strong>Error:</strong> {error || "Nenhum"}
          </p>
          <p>
            <strong>Total workspaces:</strong> {workspaces.length}
          </p>
        </div>
      </div>

      {/* Lista de workspaces */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg">
        <h2 className="text-lg font-semibold mb-4">
          📋 Workspaces Encontrados
        </h2>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-300">
              Carregando...
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 p-4 rounded-lg">
            <p className="text-red-800 dark:text-red-200">❌ Erro: {error}</p>
          </div>
        )}

        {!loading && !error && workspaces.length === 0 && (
          <div className="text-center py-4 text-gray-500 dark:text-gray-400">
            Nenhum workspace encontrado
          </div>
        )}

        {workspaces.length > 0 && (
          <div className="space-y-4">
            {workspaces.map((workspace, index) => (
              <div
                key={workspace._id || index}
                className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg"
              >
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p>
                      <strong>Nome:</strong> {workspace.name}
                    </p>
                    <p>
                      <strong>Slug:</strong> {workspace.slug}
                    </p>
                    <p>
                      <strong>ID:</strong> {workspace._id}
                    </p>
                  </div>
                  <div>
                    <p>
                      <strong>Owner:</strong> {workspace.ownerId}
                    </p>
                    <p>
                      <strong>Ativo:</strong>{" "}
                      {workspace.isActive ? "Sim" : "Não"}
                    </p>
                    <p>
                      <strong>Criado:</strong>{" "}
                      {workspace.createdAt
                        ? new Date(workspace.createdAt).toLocaleString()
                        : "N/A"}
                    </p>
                  </div>
                </div>

                {workspace.members && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-sm font-medium">Membros:</p>
                    <div className="text-xs text-gray-600 dark:text-gray-300">
                      {workspace.members.map((member, i) => (
                        <p key={i}>
                          • {member.userId} ({member.role})
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
