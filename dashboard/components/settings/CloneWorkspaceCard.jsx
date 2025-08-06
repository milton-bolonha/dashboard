"use client";

import { useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { CopyIcon } from "@heroicons/react/24/outline";

export default function CloneWorkspaceCard() {
  const { currentWorkspace, loadWorkspaces, switchWorkspace } = useWorkspace();
  const router = useRouter();

  // Spinner component
  const Spinner = () => (
    <svg
      className="animate-spin h-4 w-4"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );

  const [showCloneModal, setShowCloneModal] = useState(false);
  const [isCloning, setIsCloning] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceSlug, setNewWorkspaceSlug] = useState("");
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const handleCloneWorkspace = async () => {
    if (!currentWorkspace || !newWorkspaceName.trim()) return;

    setIsCloning(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/workspaces/${currentWorkspace._id}/clone`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            newName: newWorkspaceName,
            newSlug: newWorkspaceSlug,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to clone workspace");
      }

      // Sucesso!
      setStats(data.stats);
      setShowCloneModal(false);

      // Atualizar lista de workspaces
      await loadWorkspaces();

      // Mudar para o novo workspace
      if (data.newWorkspace) {
        switchWorkspace(data.newWorkspace);
        router.push("/dashboard");
      }

      // Feedback de sucesso
      alert(
        `Workspace clonado com sucesso!\n\nEstatísticas:\n- Content Types: ${data.stats.contentTypes}\n- Sections: ${data.stats.sections}\n- Items: ${data.stats.items}`
      );
    } catch (err) {
      setError(err.message);
      console.error("Erro ao clonar workspace:", err);
    } finally {
      setIsCloning(false);
    }
  };

  const handleOpenModal = () => {
    setNewWorkspaceName(`${currentWorkspace?.name} (copy)`);
    setNewWorkspaceSlug(`${currentWorkspace?.slug}-copy-${Date.now()}`);
    setError(null);
    setStats(null);
    setShowCloneModal(true);
  };

  return (
    <>
      <Card title="Clonar Workspace">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Crie uma cópia completa deste workspace com todos os content types,
            sections e items. Ideal para criar templates ou backups.
          </p>
          <Button
            variant="secondary"
            onClick={handleOpenModal}
            disabled={!currentWorkspace}
          >
            <CopyIcon className="h-4 w-4 mr-2" />
            Clonar este Workspace
          </Button>
        </div>
      </Card>

      {showCloneModal && (
        <Modal
          onClose={() => !isCloning && setShowCloneModal(false)}
          title="Clonar Workspace"
        >
          <div className="space-y-4">
            <p>
              Você está prestes a clonar o workspace{" "}
              <span className="font-bold">{currentWorkspace?.name}</span>
            </p>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">O que será clonado:</h4>
              <ul className="text-sm space-y-1">
                <li>✅ Content Types (todos os addons e configurações)</li>
                <li>✅ Sections (todas as estratégias e configurações)</li>
                <li>✅ Items (todos os dados e conteúdo)</li>
                <li>❌ Deploys (não serão clonados)</li>
                <li>❌ API Keys (serão geradas novas)</li>
                <li>❌ Billing/Stripe (novo workspace = nova cobrança)</li>
              </ul>
            </div>

            <div className="space-y-3">
              <label className="block">
                <span className="text-sm font-medium">
                  Nome do novo workspace:
                </span>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={(e) => setNewWorkspaceName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                  disabled={isCloning}
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium">
                  Slug do novo workspace:
                </span>
                <input
                  type="text"
                  value={newWorkspaceSlug}
                  onChange={(e) => setNewWorkspaceSlug(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-600"
                  disabled={isCloning}
                />
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {error}
                </p>
              </div>
            )}

            {isCloning && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="flex items-center mb-3">
                  <Spinner />
                  <span className="font-medium ml-2">Clonando workspace...</span>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  Este processo pode levar alguns minutos dependendo da
                  quantidade de dados.
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <Button
                variant="secondary"
                onClick={() => setShowCloneModal(false)}
                disabled={isCloning}
              >
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleCloneWorkspace}
                disabled={!newWorkspaceName.trim() || isCloning}
              >
                {isCloning ? (
                  <>
                    <Spinner />
                    <span className="ml-2">Clonando...</span>
                  </>
                ) : (
                  "Clonar Workspace"
                )}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
} 