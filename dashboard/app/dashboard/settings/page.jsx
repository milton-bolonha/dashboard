"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { fetchWithWorkspace } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import TransferOwnershipCard from "@/components/settings/TransferOwnershipCard";
import CloneWorkspaceCard from "@/components/settings/CloneWorkspaceCard";

export default function SettingsPage() {
  const { user } = useUser();
  const { currentWorkspace, workspaces, switchWorkspace, loadWorkspaces } =
    useWorkspace();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDeleteWorkspace = async () => {
    if (!currentWorkspace) {
      setError("No workspace selected.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetchWithWorkspace(
        `/api/workspaces/${currentWorkspace._id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete workspace");
      }

      // Sucesso
      setIsModalOpen(false);
      alert("Workspace deleted successfully!");

      // Atualizar a lista de workspaces e mudar para o primeiro da lista
      await loadWorkspaces();
      const remainingWorkspaces = workspaces.filter(
        (w) => w._id !== currentWorkspace._id
      );
      if (remainingWorkspaces.length > 0) {
        switchWorkspace(remainingWorkspaces[0]);
      } else {
        // Se não houver mais workspaces, a UI deve lidar com este estado
        window.location.reload(); // Recarregar para estado inicial
      }
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Manage your workspace and dashboard preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Database">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Clean up unused data and optimize performance.
            </p>
            <Button variant="secondary">Clean Database</Button>
          </div>
        </Card>

        <Card title="Backup">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Export your content types and sections for this workspace.
            </p>
            <Button variant="secondary">Export Data</Button>
          </div>
        </Card>

        <Card title="API Keys">
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Manage API access for external integrations.
            </p>
            <Button variant="secondary">Generate API Key</Button>
          </div>
        </Card>
      </div>

      <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-red-600 dark:text-red-400">
          Danger Zone
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          <TransferOwnershipCard />
          <CloneWorkspaceCard />
          <Card title="Delete Current Workspace">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Permanently delete the '
                <span className="font-bold">{currentWorkspace?.name}</span>'
                workspace and all of its contents. This action is irreversible.
              </p>
              <Button
                variant="danger"
                onClick={() => setIsModalOpen(true)}
                disabled={isLoading}
              >
                Delete this Workspace
              </Button>
            </div>
          </Card>

          <Card title="Reset Dashboard">
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Reset all data across all workspaces. This action cannot be
                undone.
              </p>
              <Button
                variant="danger"
                disabled={true} // Desabilitar por segurança
              >
                Reset Entire Dashboard
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {isModalOpen && (
        <Modal
          onClose={() => setIsModalOpen(false)}
          title="Confirm Workspace Deletion"
        >
          <div className="space-y-4">
            <p>
              Are you absolutely sure you want to delete the workspace "
              <span className="font-bold">{currentWorkspace?.name}</span>"?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">
              This will permanently delete all associated Content Types,
              Sections, and Items. This action cannot be undone.
            </p>
            {error && <p className="text-red-500">{error}</p>}
            <div className="flex justify-end space-x-4">
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={handleDeleteWorkspace}
                disabled={isLoading}
              >
                {isLoading ? "Deleting..." : "Yes, delete this workspace"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
