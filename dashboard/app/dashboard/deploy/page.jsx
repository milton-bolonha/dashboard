"use client";

import { useState, useEffect, useCallback } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import Button from "@/components/ui/Button"; // Corrigido: import default
import Modal from "@/components/ui/Modal"; // Corrigido: import default
import { Input } from "@/components/ui/Input"; // Corrigido: import nomeado
import { Checkbox } from "@/components/ui/Checkbox"; // Adicionar import
import {
  CheckIcon,
  XMarkIcon,
  ClockIcon,
  ArrowPathIcon,
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
  const { currentWorkspace, loadWorkspaces } = useWorkspace();
  const [deployments, setDeployments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isRefreshingWorkspace, setIsRefreshingWorkspace] = useState(false);
  const [deployConfig, setDeployConfig] = useState({
    githubToken: "",
    netlifyToken: "",
    customRepoUrl: "", // Garantir que comece vazio
  });
  const [useCustomRepo, setUseCustomRepo] = useState(false); // Estado para o checkbox
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [error, setError] = useState(null);

  const handleCustomRepoToggle = (checked) => {
    setUseCustomRepo(checked);
    if (!checked) {
      // Limpar a URL se o usuário desmarcar a opção
      setDeployConfig((prev) => ({ ...prev, customRepoUrl: "" }));
    }
  };

  const fetchDeployments = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      const response = await fetch(
        `/api/deploy/netlify?workspaceId=${currentWorkspace._id}`
      );
      if (!response.ok) throw new Error("Falha ao buscar deployments.");
      const data = await response.json();
      setDeployments(data.slice(0, 10)); // Mostrar apenas os 10 mais recentes
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchDeployments();
    const interval = setInterval(fetchDeployments, 5000); // Polling a cada 5 segundos
    return () => clearInterval(interval);
  }, [fetchDeployments]);

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

      // Atualizar tanto os deployments quanto o workspace (para capturar netlifyDeployment)
      fetchDeployments();

      // Aguardar um pouco mais e recarregar workspace para capturar netlifyDeployment
      const refreshWorkspace = () => {
        setIsRefreshingWorkspace(true);
        setTimeout(() => {
          loadWorkspaces();
          console.log(
            "🔄 Workspace recarregado para capturar informações de deploy"
          );
          setIsRefreshingWorkspace(false);
        }, 3000);
      };

      refreshWorkspace();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsDeploying(false);
    }
  };

  // Estados de deploy
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

      {/* Informações de Deploy Existente */}
      {hasDeployment ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
            🚀 Site Configurado
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-blue-800 dark:text-blue-200">
                Repositório GitHub:
              </span>
              <a
                href={currentWorkspace.netlifyDeployment.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 dark:text-blue-400 hover:underline"
              >
                {currentWorkspace.netlifyDeployment.repoUrl}
              </a>
            </div>
            <div>
              <span className="font-medium text-blue-800 dark:text-blue-200">
                Site Netlify:
              </span>
              <a
                href={currentWorkspace.netlifyDeployment.siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 dark:text-blue-400 hover:underline"
              >
                {currentWorkspace.netlifyDeployment.siteName}
              </a>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Configurado em:{" "}
              {new Date(
                currentWorkspace.netlifyDeployment.createdAt
              ).toLocaleString()}
            </p>
            {lastDeploy && (
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                  lastDeploy.status
                )}`}
              >
                Último deploy: {lastDeploy.status}
              </span>
            )}
          </div>
        </div>
      ) : deployments.length > 0 ? (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-100 mb-3">
            ⚠️ Deploy Incompleto
          </h3>
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
            Foram encontrados deploys anteriores, mas as informações do
            repositório e site não foram salvas. Isso pode acontecer se o deploy
            não foi concluído ou se houve um erro.
          </p>
          <div className="flex items-center space-x-4">
            {lastDeploy && (
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                  lastDeploy.status
                )}`}
              >
                Último status: {lastDeploy.status}
              </span>
            )}
            {isRefreshingWorkspace ? (
              <p className="text-xs text-yellow-700 dark:text-yellow-300 flex items-center">
                <ArrowPathIcon className="h-3 w-3 mr-1 animate-spin" />
                Atualizando informações...
              </p>
            ) : (
              <p className="text-xs text-yellow-700 dark:text-yellow-300">
                Faça um novo deploy para configurar corretamente
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
            📋 Primeiro Deploy
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Este workspace ainda não foi deployado. O primeiro deploy criará:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-4">
            <li>• Um repositório GitHub privado para seu site</li>
            <li>• Um site na Netlify conectado ao repositório</li>
            <li>• Configuração automática de deploy via GitHub Actions</li>
          </ul>
        </div>
      )}

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6"
          role="alert"
        >
          <strong className="font-bold">Erro!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      )}

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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(dep.status)}
                      <div>
                        <p className="font-mono text-sm font-medium">
                          {dep._id}
                        </p>
                        <p className="text-xs text-gray-500">
                          Iniciado em:{" "}
                          {new Date(dep.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        dep.status
                      )}`}
                    >
                      {dep.status}
                    </span>
                  </div>
                  {dep.finalUrl && (
                    <div className="mt-3 text-sm">
                      <span className="font-semibold">URL Final:</span>{" "}
                      <a
                        href={dep.finalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        {dep.finalUrl}
                      </a>
                    </div>
                  )}
                  {dep.error && (
                    <div className="mt-3 text-sm text-red-600">
                      <span className="font-semibold">Erro:</span> {dep.error}{" "}
                      (Etapa: {dep.failedStep})
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showConfigModal && (
        <Modal
          onClose={() => setShowConfigModal(false)}
          title="Configurar Chaves de API"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                GitHub Token
              </label>
              <Input
                type="password"
                value={deployConfig.githubToken}
                onChange={(e) =>
                  setDeployConfig((prev) => ({
                    ...prev,
                    githubToken: e.target.value,
                  }))
                }
                placeholder="ghp_xxxxxxxx ou github_pat_xxxxxxxx"
              />
              <p className="text-xs text-gray-500 mt-1">
                Token com permissões de `repo`.{" "}
                <a
                  href="https://github.com/settings/tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600"
                >
                  Criar token
                </a>
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Netlify Token
              </label>
              <Input
                type="password"
                value={deployConfig.netlifyToken}
                onChange={(e) =>
                  setDeployConfig((prev) => ({
                    ...prev,
                    netlifyToken: e.target.value,
                  }))
                }
                placeholder="nfp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              />
              <p className="text-xs text-gray-500 mt-1">
                Token de acesso pessoal da Netlify.{" "}
                <a
                  href="https://app.netlify.com/user/applications#personal-access-tokens"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600"
                >
                  Criar token
                </a>
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="custom-repo-toggle"
                  checked={useCustomRepo}
                  onCheckedChange={handleCustomRepoToggle}
                />
                <label
                  htmlFor="custom-repo-toggle"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Usar um template de repositório customizado
                </label>
              </div>

              {useCustomRepo && (
                <div>
                  <Input
                    type="text"
                    value={deployConfig.customRepoUrl || ""}
                    onChange={(e) =>
                      setDeployConfig((prev) => ({
                        ...prev,
                        customRepoUrl: e.target.value,
                      }))
                    }
                    placeholder="https://github.com/usuario/meu-template"
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Seu template precisa ser compatível com a API pública do
                    DashMaster.
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                onClick={handleDeploy}
                disabled={
                  isDeploying ||
                  !deployConfig.githubToken ||
                  !deployConfig.netlifyToken
                }
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {isDeploying ? "Iniciando..." : "Confirmar e Iniciar Deploy"}
              </Button>
              <Button
                onClick={() => setShowConfigModal(false)}
                variant="secondary"
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
