"use client";
import { useState } from "react";
import { useUser } from "@clerk/nextjs";

export default function SyncPage() {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSync = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch("/api/sync/clerk-users", {
        method: "POST",
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data);
      } else {
        throw new Error(data.error || "Erro na sincronização");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/sync/clerk-users");

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Sincronização Clerk → Workspaces
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Faça login para acessar esta página.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          🔄 Sincronização Clerk → Workspaces
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Sincronize usuários do Clerk criando workspaces automaticamente para
          cada usuário.
        </p>

        <div className="space-y-4 mb-6">
          <button
            onClick={checkStatus}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Verificando..." : "🔍 Verificar Status"}
          </button>

          <button
            onClick={handleSync}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed ml-4"
          >
            {loading ? "Sincronizando..." : "🚀 Sincronizar Agora"}
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
              <span className="text-blue-800 dark:text-blue-200">
                Processando...
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
            <div className="flex">
              <div className="text-red-400 mr-3">❌</div>
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Erro na Sincronização
                </h3>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  {error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex">
              <div className="text-green-400 mr-3">✅</div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-green-800 dark:text-green-200">
                  {result.message || "Operação concluída"}
                </h3>

                {result.report && (
                  <div className="mt-3 text-sm text-green-700 dark:text-green-300">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <div className="font-medium">Total</div>
                        <div className="text-lg">{result.report.total}</div>
                      </div>
                      <div>
                        <div className="font-medium">Criados</div>
                        <div className="text-lg text-green-600">
                          {result.report.created}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Existentes</div>
                        <div className="text-lg text-yellow-600">
                          {result.report.existing}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Erros</div>
                        <div className="text-lg text-red-600">
                          {result.report.errors}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {result.stats && (
                  <div className="mt-3 text-sm text-green-700 dark:text-green-300">
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="font-medium">Usuários Clerk</div>
                        <div className="text-lg">{result.stats.clerkUsers}</div>
                      </div>
                      <div>
                        <div className="font-medium">Workspaces</div>
                        <div className="text-lg">{result.stats.workspaces}</div>
                      </div>
                      <div>
                        <div className="font-medium">Precisam Sync</div>
                        <div className="text-lg">{result.stats.needSync}</div>
                      </div>
                    </div>
                    <p className="mt-2 text-sm">{result.recommendation}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mt-6">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            ℹ️ Como funciona
          </h3>
          <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
            <li>• Busca todos os usuários cadastrados no Clerk</li>
            <li>• Verifica quais usuários não têm workspace ainda</li>
            <li>• Cria workspace automático para usuários sem workspace</li>
            <li>• Cada workspace criado tem plano "Free" por padrão</li>
            <li>• Usuário torna-se "owner" do seu workspace</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
