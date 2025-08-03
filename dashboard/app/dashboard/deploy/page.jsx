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
  const [showNukeModal, setShowNukeModal] = useState(false);
  const [error, setError] = useState(null);
  const [siteStatus, setSiteStatus] = useState(null);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isNuking, setIsNuking] = useState(false);

  const fetchDeployments = useCallback(async () => {
    if (!currentWorkspace) return;
    try {
      const response = await fetch(
        `/api/deploy/netlify?workspaceId=${currentWorkspace._id}`
      );
      if (!response.ok) throw new Error("Falha ao buscar deployments.");
      const data = await response.json();
      setDeployments(data.slice(0, 10));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentWorkspace]);

  useEffect(() => {
    fetchDeployments();
    const interval = setInterval(fetchDeployments, 5000);
    return () => clearInterval(interval);
  }, [fetchDeployments]);

  const checkSiteStatus = async (url) => {
    setIsCheckingStatus(true);
    setSiteStatus(null);
    try {
      const response = await fetch("/api/deploy/check-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao verificar status");
      }

      setSiteStatus({
        code: data.status,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Falha ao checar status do site:", err);
      setSiteStatus({
        code: "ERRO",
        timestamp: new Date().toISOString(),
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  useEffect(() => {
    const lastDeploy = deployments?.[0];
    const siteUrl = currentWorkspace?.netlifyDeployment?.siteUrl;

    if (lastDeploy?.status === "concluido" && siteUrl) {
      const now = new Date();
      const lastCheck = siteStatus?.timestamp
        ? new Date(siteStatus.timestamp)
        : null;
      const secondsSinceLastCheck = lastCheck
        ? (now - lastCheck) / 1000
        : Infinity;

      if (secondsSinceLastCheck > 10) {
        checkSiteStatus(siteUrl);
      }
    }
  }, [deployments, currentWorkspace, siteStatus]);

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

  const handleNuke = async () => {
    if (!currentWorkspace) return;

    setError(null);
    setIsNuking(true);
    try {
      const response = await fetch("/api/deploy/nuke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workspaceId: currentWorkspace._id,
        }),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Falha ao executar nuke.");

      alert(result.message);
      setShowNukeModal(false);

      // Recarregar dados após o nuke
      fetchDeployments();

      // Forçar reload imediato do workspace para atualizar as informações
      setTimeout(() => {
        loadWorkspaces();
        console.log(
          "🔄 Workspace recarregado após nuke para atualizar informações"
        );
      }, 500);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsNuking(false);
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
          <div className="flex items-center space-x-3">
            {hasDeployment && (
              <Button
                onClick={() => setShowNukeModal(true)}
                disabled={isDeploying || isNuking || !currentWorkspace}
                variant="secondary"
                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
              >
                {isNuking ? "Removendo..." : "🗑️ Nuke"}
              </Button>
            )}
            <Button
              onClick={() => setShowConfigModal(true)}
              disabled={isDeploying || isNuking || !currentWorkspace}
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
      </div>

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
                href={currentWorkspace?.netlifyDeployment?.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-blue-600 dark:text-blue-400 hover:underline"
              >
                {currentWorkspace?.netlifyDeployment?.repoUrl}
              </a>
            </div>
            <div>
              <span className="font-medium text-blue-800 dark:text-blue-200">
                Site Netlify:
              </span>
              <div className="flex items-center space-x-2">
                <a
                  href={currentWorkspace?.netlifyDeployment?.siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>{currentWorkspace?.netlifyDeployment?.siteName}</span>
                  <ArrowUpRightIcon className="h-4 w-4 ml-1" />
                </a>
                {isCheckingStatus && (
                  <span className="text-xs text-blue-500 flex items-center">
                    <ArrowPathIcon className="h-3 w-3 mr-1 animate-spin" />{" "}
                    Verificando...
                  </span>
                )}
                {siteStatus && !isCheckingStatus && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      siteStatus.code >= 200 && siteStatus.code < 300
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {siteStatus.code}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Configurado em:{" "}
              {new Date(
                currentWorkspace?.netlifyDeployment?.createdAt
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

      {/* Modal de confirmação do Nuke */}
      {showNukeModal && (
        <Modal
          onClose={() => setShowNukeModal(false)}
          title="⚠️ Confirmar Remoção Total (Nuke)"
        >
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <h4 className="font-semibold text-red-800 mb-2">
                ⚠️ AÇÃO IRREVERSÍVEL
              </h4>
              <p className="text-sm text-red-700 mb-3">
                Esta ação irá remover COMPLETAMENTE todos os recursos de deploy
                deste workspace:
              </p>
              <ul className="text-xs text-red-600 space-y-1 ml-4">
                <li>• Site da Netlify será deletado</li>
                <li>• Repositório GitHub será removido</li>
                <li>• Histórico de deploys será apagado</li>
                <li>• Configurações de deploy serão perdidas</li>
              </ul>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-md p-3">
              <p className="text-sm text-gray-700">
                <strong>Workspace:</strong> {currentWorkspace?.name}
              </p>
              {hasDeployment && (
                <>
                  <p className="text-sm text-gray-700">
                    <strong>Site:</strong>{" "}
                    {currentWorkspace?.netlifyDeployment?.siteName}
                  </p>
                  <p className="text-sm text-gray-700">
                    <strong>Repositório:</strong>{" "}
                    {currentWorkspace?.netlifyDeployment?.repoUrl}
                  </p>
                </>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => setShowNukeModal(false)}
                disabled={isNuking}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleNuke}
                disabled={isNuking}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isNuking ? "Removendo..." : "🗑️ Confirmar Nuke"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
