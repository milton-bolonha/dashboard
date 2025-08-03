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
  // ... (funções helper mantidas)
};

const getStatusColor = (status) => {
  // ... (funções helper mantidas)
};

export default function DeployPage() {
  const {
    currentWorkspace,
    loadWorkspaces,
    loading: workspaceLoading,
  } = useWorkspace(); // Obter o estado de loading do contexto
  const [deployments, setDeployments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  // ... (outros estados mantidos)
  const [error, setError] = useState(null);

  const fetchDeployments = useCallback(async () => {
    // CORREÇÃO: Não fazer a chamada se o workspace ainda não estiver carregado ou não existir
    if (!currentWorkspace) {
      setIsLoading(false); // Parar o loading da página se não houver workspace
      return;
    }

    setIsLoading(true); // Garante que o loading seja reativado a cada busca
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
    // CORREÇÃO: Só iniciar a busca quando o workspace terminar de carregar
    if (!workspaceLoading) {
      fetchDeployments();
      const interval = setInterval(fetchDeployments, 5000); // Polling continua igual
      return () => clearInterval(interval);
    }
  }, [workspaceLoading, fetchDeployments]);

  // ... (resto do componente, sem alterações na lógica interna, apenas na condição de renderização)

  // CORREÇÃO: Mostrar um estado de carregamento global enquanto o workspace é carregado
  if (workspaceLoading) {
    return (
      <div className="text-center py-8">
        <ArrowPathIcon className="h-8 w-8 mx-auto text-gray-400 animate-spin" />
        <p className="mt-2 text-gray-500">Carregando workspace...</p>
      </div>
    );
  }

  // Se não houver workspace após o carregamento, mostrar uma mensagem
  if (!currentWorkspace) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">
          Nenhum workspace selecionado. Crie um para começar.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* O resto do JSX da página permanece aqui, inalterado */}
      {/* ... */}
    </div>
  );
}
