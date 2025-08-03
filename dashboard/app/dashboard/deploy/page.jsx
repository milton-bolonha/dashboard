"use client";

import { useState, useEffect, useCallback } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ArrowPathIcon,
  ArrowUpRightIcon,
} from "@heroicons/react/24/outline";

const getStatusIcon = (status) => {
  switch (status) {
    case "concluido":
      return <CheckIcon className="h-5 w-5 text-green-500" />;
    case "falhou":
      return <XMarkIcon className="h-5 w-5 text-red-500" />;
    case "iniciado":
    case "progresso":
      return <ClockIcon className="h-5 w-5 text-yellow-500 animate-spin" />;
    default:
      return <ClockIcon className="h-5 w-5 text-gray-500" />;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "concluido":
      return "bg-green-100 text-green-800";
    case "falhou":
      return "bg-red-100 text-red-800";
    case "iniciado":
    case "progresso":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function DeployPage() {
  const {
    currentWorkspace,
    loadWorkspaces,
    loading: workspaceLoading,
  } = useWorkspace();
  const [deployments, setDeployments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRefreshingWorkspace, setIsRefreshingWorkspace] = useState(false);
  const [deployConfig, setDeployConfig] = useState({
    githubToken: "",
    netlifyToken: "",
    customRepoUrl: "",
  });
  const [useCustomRepo, setUseCustomRepo] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [error, setError] = useState(null);
  const [siteStatus, setSiteStatus] = useState(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  const fetchDeployments = useCallback(async () => {
    if (!currentWorkspace) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/deploy/netlify?workspaceId=${currentWorkspace._id}`
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Falha ao buscar deployments.");
      }
      setDeployments(data.slice(0, 10));
    } catch (err) {
      console.error("Erro explícito ao buscar deployments:", err.message);
      setError(err.message); // Exibir o erro na tela
      setDeployments([]); // Garantir que a lista esteja vazia em caso de erro
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    if (!workspaceLoading) {
      fetchDeployments();
    }
  }, [workspaceLoading, fetchDeployments]);

  // Funções handleDeploy, checkSiteStatus, etc. permanecem as mesmas
  const handleDeploy = async () => {
    if (!currentWorkspace) return;

    setError(null);
    setIsDeploying(true);
    try {
      const response = await fetch("/api/deploy/netlify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: currentWorkspace._id,
          deployConfig,
        }),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Falha ao iniciar o deploy.");

      alert(result.message);
      setShowConfigModal(false);
      fetchDeployments();

      setTimeout(() => {
        loadWorkspaces();
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeploying(false);
    }
  };

  if (workspaceLoading) {
    return (
      <div className="text-center py-8">
        <ArrowPathIcon className="h-8 w-8 mx-auto text-gray-400 animate-spin" />
        <p className="mt-2 text-gray-500">Carregando workspace...</p>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          Nenhum workspace selecionado. Crie um para começar.
        </p>
      </div>
    );
  }

  const hasDeployment = currentWorkspace?.netlifyDeployment;
  const lastDeploy = deployments?.[0];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Deploy para Netlify
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Publique seu workspace como um site estático na Netlify com um clique.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">
              {hasDeployment ? "Novo Deploy" : "Deploy Rápido"}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {hasDeployment
                ? "Publique as alterações mais recentes do seu workspace."
                : "Conecte suas contas e publique seu site em minutos."}
            </p>
          </div>
          <Button
            onClick={() => setShowConfigModal(true)}
            disabled={isDeploying || !currentWorkspace}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isDeploying
              ? "Deployando..."
              : hasDeployment
              ? "Atualizar Site"
              : "Iniciar Primeiro Deploy"}
          </Button>
        </div>
      </div>

      {/* Renderização do resto da página... */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Histórico de Deploys</h3>
        </div>
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <ArrowPathIcon className="h-8 w-8 mx-auto text-gray-400 animate-spin" />
              <p className="mt-2 text-gray-500">Carregando histórico...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>
                <strong>Erro ao carregar histórico:</strong> {error}
              </p>
            </div>
          ) : deployments.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhum deploy realizado para este workspace ainda.
            </p>
          ) : (
            <ul className="space-y-4">
              {deployments.map((dep) => (
                <li
                  key={dep._id}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  {/* ... renderização do item de deploy */}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modal de configuração */}
      {showConfigModal && (
        <Modal
          onClose={() => setShowConfigModal(false)}
          title="Configurar Chaves de API"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                GitHub Personal Access Token
              </label>
              <Input
                type="password"
                placeholder="ghp_ ou github_pat_..."
                value={deployConfig.githubToken}
                onChange={(e) =>
                  setDeployConfig((prev) => ({
                    ...prev,
                    githubToken: e.target.value,
                  }))
                }
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Token necessário para criar repositórios e configurar GitHub
                Actions
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Netlify Personal Access Token
              </label>
              <Input
                type="password"
                placeholder="nfp_..."
                value={deployConfig.netlifyToken}
                onChange={(e) =>
                  setDeployConfig((prev) => ({
                    ...prev,
                    netlifyToken: e.target.value,
                  }))
                }
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                Token necessário para criar e gerenciar sites na Netlify
              </p>
            </div>

            <div className="flex items-start space-x-2">
              <Checkbox
                id="use-custom-repo"
                checked={useCustomRepo}
                onCheckedChange={setUseCustomRepo}
              />
              <div className="flex-1">
                <label
                  htmlFor="use-custom-repo"
                  className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Usar repositório customizado
                </label>
                <p className="text-xs text-gray-500">
                  Por padrão, um novo repositório será criado automaticamente
                </p>
              </div>
            </div>

            {useCustomRepo && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  URL do Repositório (Opcional)
                </label>
                <Input
                  type="url"
                  placeholder="https://github.com/usuario/repo"
                  value={deployConfig.customRepoUrl}
                  onChange={(e) =>
                    setDeployConfig((prev) => ({
                      ...prev,
                      customRepoUrl: e.target.value,
                    }))
                  }
                  className="w-full"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Deixe vazio para criar um novo repositório automaticamente
                </p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowConfigModal(false)}
                disabled={isDeploying}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleDeploy}
                disabled={
                  isDeploying ||
                  !deployConfig.githubToken ||
                  !deployConfig.netlifyToken
                }
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isDeploying ? "Iniciando Deploy..." : "Iniciar Deploy"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
