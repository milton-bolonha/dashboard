"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { fetchWithWorkspace } from "@/lib/api";
import CreateWorkspaceScreen from "@/components/CreateWorkspaceScreen";
import Link from "next/link";

/**
 * Dashboard Stats Container
 * Gerencia a lógica de estatísticas e migração de dados
 */
export function DashboardStatsContainer() {
  const {
    currentWorkspace,
    workspaces,
    loading: workspaceLoading,
  } = useWorkspace();

  const [stats, setStats] = useState({
    sections: 0,
    items: 0,
    users: 1,
    plans: 0,
  });
  const [loading, setLoading] = useState(true);
  const [needsMigration, setNeedsMigration] = useState(false);
  const [migrationStatus, setMigrationStatus] = useState("");

  useEffect(() => {
    if (currentWorkspace) {
      loadStats();
    }
    checkMigrationStatus();
  }, [currentWorkspace]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetchWithWorkspace("/api/dashboard/stats");
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkMigrationStatus = async () => {
    try {
      const response = await fetch("/api/migrate");
      const data = await response.json();

      if (data.needsMigration) {
        setNeedsMigration(true);
        setMigrationStatus(
          `⚠️ Encontrados ${data.orphanData.contentTypes} content types e ${data.orphanData.sections} sections sem userId`
        );
      }
    } catch (error) {
      console.log("Erro ao verificar migração:", error);
    }
  };

  const runMigration = async () => {
    if (
      !window.confirm("Deseja migrar os dados órfãos para o usuário atual?")
    ) {
      return;
    }

    try {
      setMigrationStatus("🔄 Executando migração...");

      const response = await fetch("/api/migrate", { method: "POST" });
      const data = await response.json();

      if (data.success) {
        setMigrationStatus(`✅ ${data.message}`);
        setNeedsMigration(false);

        setTimeout(() => {
          loadStats();
          setMigrationStatus("");
          window.dispatchEvent(new CustomEvent("sectionsUpdated"));
        }, 3000);
      } else {
        setMigrationStatus(`❌ ${data.message}`);
      }
    } catch (error) {
      setMigrationStatus("❌ Erro na migração: " + error.message);
    }
  };

  const metricCards = [
    {
      title: "Sections",
      value: stats.sections,
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
      color: "blue",
      description: "Áreas de conteúdo ativas",
      trend: stats.sections > 0 ? "+100%" : "0%",
    },
    {
      title: "Items",
      value: stats.items,
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      color: "green",
      description: "Conteúdos publicados",
      trend: stats.items > 0 ? `+${stats.items}` : "0",
    },
    {
      title: "Users",
      value: stats.users,
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
          />
        </svg>
      ),
      color: "purple",
      description: "Usuários ativos",
      trend: "Ativo",
    },
    {
      title: "Plans",
      value: stats.plans,
      icon: (
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      ),
      color: "yellow",
      description: "Planos configurados",
      trend: "Em setup",
    },
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: {
        bg: "bg-blue-50 dark:bg-blue-900/20",
        text: "text-blue-600 dark:text-blue-400",
        border: "border-blue-200 dark:border-blue-800",
        icon: "text-blue-500",
      },
      green: {
        bg: "bg-green-50 dark:bg-green-900/20",
        text: "text-green-600 dark:text-green-400",
        border: "border-green-200 dark:border-green-800",
        icon: "text-green-500",
      },
      purple: {
        bg: "bg-purple-50 dark:bg-purple-900/20",
        text: "text-purple-600 dark:text-purple-400",
        border: "border-purple-200 dark:border-purple-800",
        icon: "text-purple-500",
      },
      yellow: {
        bg: "bg-yellow-50 dark:bg-yellow-900/20",
        text: "text-yellow-600 dark:text-yellow-400",
        border: "border-yellow-200 dark:border-yellow-800",
        icon: "text-yellow-500",
      },
    };
    return colors[color];
  };

  // Se não tem workspace e não está carregando, mostrar tela de criação
  if (!workspaceLoading && (!workspaces || workspaces.length === 0)) {
    return <CreateWorkspaceScreen />;
  }

  if (loading || workspaceLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visão geral do seu Dashboard Engine
          </p>
        </div>

        {/* Skeleton loading */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 animate-pulse"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                <div className="w-8 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
              <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Visão geral do seu Dashboard Engine
        </p>
      </div>

      {/* Alert de migração */}
      {needsMigration && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-yellow-400 mr-3 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Migração de Dados Necessária
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                {migrationStatus ||
                  "Dados antigos sem userId encontrados. Execute a migração para vê-los."}
              </p>
              {!migrationStatus.includes("🔄") &&
                !migrationStatus.includes("✅") && (
                  <button
                    onClick={runMigration}
                    className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm cursor-pointer"
                  >
                    Executar Migração
                  </button>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Status da migração */}
      {migrationStatus && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            {migrationStatus}
          </p>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricCards.map((metric, index) => {
          const colors = getColorClasses(metric.color);
          return (
            <div
              key={index}
              className={`group bg-white dark:bg-gray-800 rounded-xl border ${colors.border} p-6 hover:shadow-lg transition-all duration-200`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${colors.bg}`}>
                  <div className={colors.icon}>{metric.icon}</div>
                </div>
                <span
                  className={`text-sm font-medium px-2 py-1 rounded-full ${colors.bg} ${colors.text}`}
                >
                  {metric.trend}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-baseline space-x-2">
                  <span className={`text-3xl font-bold ${colors.text}`}>
                    {metric.value}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    {metric.title}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {metric.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Ações Rápidas
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/dashboard/content-types"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group"
          >
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg mr-3 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
              <svg
                className="w-5 h-5 text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Novo Content Type
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Criar estrutura de dados
              </p>
            </div>
          </a>

          <a
            href="/dashboard/sections"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group"
          >
            <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg mr-3 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
              <svg
                className="w-5 h-5 text-green-600 dark:text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Nova Section
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Organizar conteúdo
              </p>
            </div>
          </a>

          <a
            href="/dashboard/users"
            className="flex items-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors group"
          >
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg mr-3 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 transition-colors">
              <svg
                className="w-5 h-5 text-purple-600 dark:text-purple-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                Gerenciar Users
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Administrar usuários
              </p>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
