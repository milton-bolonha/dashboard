"use client";
import { useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  ChevronDownIcon,
  PlusIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";

export function WorkspaceSelector() {
  const {
    workspaces,
    currentWorkspace,
    switchWorkspace,
    createWorkspace,
    loading,
    canPerformAction,
    loadWorkspaces,
  } = useWorkspace();

  const [isOpen, setIsOpen] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null); // ID do workspace para confirmar deleção

  if (loading) {
    return (
      <div className="flex items-center space-x-2 animate-pulse">
        <div className="w-6 h-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
        <div className="w-24 h-4 bg-gray-300 dark:bg-gray-600 rounded"></div>
      </div>
    );
  }

  if (!currentWorkspace) {
    return (
      <div className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
        <BuildingOfficeIcon className="w-5 h-5" />
        <span className="hidden sm:block">Carregando...</span>
      </div>
    );
  }

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      console.log("🚀 Criando workspace:", newWorkspaceName);

      // Usar o createWorkspace do contexto
      await createWorkspace({
        name: newWorkspaceName,
        description: `Workspace criado pelo usuário`,
      });

      console.log("✅ Workspace criado com sucesso!");
      setNewWorkspaceName("");
      setShowCreateForm(false);
      setIsOpen(false);
    } catch (error) {
      console.error("❌ Erro ao criar workspace:", error);
      alert("Erro ao criar workspace: " + error.message);
    }
  };

  const handleDeleteWorkspace = async (workspaceId, workspaceName) => {
    if (workspaces.length <= 1) {
      alert("Não é possível deletar o último workspace!");
      return;
    }

    if (workspaceId === currentWorkspace._id) {
      alert(
        "Não é possível deletar o workspace atual. Troque para outro workspace primeiro."
      );
      return;
    }

    try {
      console.log(`🗑️ Deletando workspace: ${workspaceName}`);

      const response = await fetch(`/api/workspaces/${workspaceId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Falha ao deletar workspace");
      }

      const result = await response.json();
      console.log("✅ Workspace deletado:", result);

      // Recarregar workspaces
      await loadWorkspaces();

      setConfirmDelete(null);
      alert(`Workspace "${workspaceName}" deletado com sucesso!`);
    } catch (error) {
      console.error("❌ Erro ao deletar workspace:", error);
      alert("Erro ao deletar workspace: " + error.message);
    }
  };

  return (
    <div className="relative">
      {/* Workspace atual */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700 rounded-lg transition-colors cursor-pointer"
      >
        <BuildingOfficeIcon className="w-5 h-5" />
        <span className="hidden sm:block truncate max-w-32">
          {currentWorkspace.name}
        </span>
        <ChevronDownIcon className="w-4 h-4" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Workspaces
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
            </p>
          </div>

          {/* Lista de workspaces */}
          <div className="py-2 max-h-60 overflow-y-auto">
            {workspaces.map((workspace) => (
              <div
                key={workspace._id}
                className={`group flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-700 ${
                  workspace._id === currentWorkspace._id
                    ? "bg-blue-50 dark-bg-gray-700"
                    : ""
                }`}
              >
                <button
                  onClick={() => {
                    if (workspace._id !== currentWorkspace._id) {
                      switchWorkspace(workspace);
                    }
                    setIsOpen(false);
                  }}
                  className={`flex-1 px-4 py-2 text-left text-sm cursor-pointer transition-colors flex items-center space-x-3 ${
                    workspace._id === currentWorkspace._id
                      ? "text-blue-700 dark:text-blue-300"
                      : "text-gray-700 dark:text-gray-200"
                  }`}
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                    {workspace.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium truncate">{workspace.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                      {workspace.plan}
                    </p>
                  </div>
                </button>

                <div className="flex items-center space-x-2 px-2">
                  {workspace._id === currentWorkspace._id && (
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  )}

                  {/* 🚨 TEMPORARIAMENTE DESABILITADO - Delete workspace */}
                  {false && (
                    <button
                      onClick={() =>
                        handleDeleteWorkspace(workspace._id, workspace.name)
                      }
                      className={`ml-2 text-xs px-2 py-1 rounded ${
                        confirmDelete === workspace._id
                          ? "bg-red-600 text-white"
                          : "bg-red-100 text-red-600 hover:bg-red-200"
                      }`}
                      title={
                        confirmDelete === workspace._id
                          ? "Clique novamente para confirmar"
                          : "Deletar workspace"
                      }
                    >
                      {confirmDelete === workspace._id ? "Confirmar?" : "🗑"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Criar novo workspace */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-3">
            {!showCreateForm ? (
              <button
                onClick={() => setShowCreateForm(true)}
                disabled={!canPerformAction("createWorkspace")}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Criar workspace</span>
              </button>
            ) : (
              <form onSubmit={handleCreateWorkspace} className="space-y-2">
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  placeholder="Nome do workspace"
                  className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    disabled={!newWorkspaceName.trim()}
                    className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  >
                    Criar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setNewWorkspaceName("");
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Overlay para fechar dropdown */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 cursor-default"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
