"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { fetchWithWorkspace } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/Checkbox";

export default function TransferOwnershipCard() {
  const { user } = useUser();
  const router = useRouter();
  const { currentWorkspace, switchWorkspace, loadWorkspaces } = useWorkspace();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [targetIdentifier, setTargetIdentifier] = useState("");
  const [confirmationText, setConfirmationText] = useState("");
  const [isHack, setIsHack] = useState(false);

  const isOwner = user?.id === currentWorkspace?.ownerId;

  const handleTransfer = async () => {
    if (confirmationText !== currentWorkspace?.name) {
      alert("O nome do workspace não confere. Transferência cancelada.");
      return;
    }

    setIsLoading(true);

    const isUserId = targetIdentifier.startsWith("user_");
    const payload = {
      ...(isUserId
        ? { newOwnerId: targetIdentifier }
        : { newOwnerEmail: targetIdentifier }),
      isHack,
    };

    try {
      const response = await fetchWithWorkspace(
        `/api/workspaces/${currentWorkspace._id}/transfer`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Falha ao transferir o workspace");
      }

      alert(
        `Propriedade do workspace '${currentWorkspace.name}' transferida com sucesso!`
      );

      setIsModalOpen(false);

      // Lógica pós-transferência
      const allWorkspaces = await loadWorkspaces();
      const ownedWorkspaces = allWorkspaces.filter(
        (ws) => ws.ownerId === user.id
      );

      if (ownedWorkspaces.length > 0) {
        // Mudar para o primeiro workspace que o usuário ainda possui
        switchWorkspace(ownedWorkspaces[0]);
      } else {
        // Se não possui mais nenhum, redirecionar para a criação
        router.push("/dashboard/workspaces/new");
      }
    } catch (err) {
      console.error(err);
      alert(`Erro: ${err.message}`);
    } finally {
      setIsLoading(false);
      setConfirmationText("");
      setTargetIdentifier("");
      setIsHack(false);
    }
  };

  if (!isOwner) {
    return null;
  }

  return (
    <>
      <Card title="Transfer Workspace Ownership">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Transfira a propriedade deste workspace para outro usuário por
            e-mail ou ID de usuário. Você se tornará um administrador.
          </p>
          <Input
            type="text"
            placeholder="E-mail ou ID do novo proprietário"
            value={targetIdentifier}
            onChange={(e) => setTargetIdentifier(e.target.value)}
          />
          <div className="flex items-center space-x-2">
            <Checkbox
              id="hack-checkbox"
              checked={isHack}
              onCheckedChange={setIsHack}
            />
            <label
              htmlFor="hack-checkbox"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Hack (Pular verificação do Clerk)
            </label>
          </div>
          <Button
            variant="danger"
            onClick={() => setIsModalOpen(true)}
            disabled={!targetIdentifier.trim()}
          >
            Transferir Propriedade
          </Button>
        </div>
      </Card>

      {isModalOpen && (
        <Modal
          onClose={() => setIsModalOpen(false)}
          title="Confirmar Transferência de Propriedade"
        >
          <div className="space-y-4">
            <p>
              Você está prestes a transferir a propriedade do workspace "
              <span className="font-bold">{currentWorkspace?.name}</span>" para
              "<span className="font-bold">{targetIdentifier}</span>".
            </p>
            <p className="text-sm text-red-600 dark:text-red-400">
              Esta ação não pode ser desfeita. Você perderá as permissões de
              proprietário e se tornará um administrador.
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Para confirmar, digite o nome do workspace abaixo:
            </p>
            <Input
              type="text"
              placeholder={currentWorkspace?.name}
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
            />
            <div className="flex justify-end space-x-4">
              <Button
                variant="secondary"
                onClick={() => setIsModalOpen(false)}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={handleTransfer}
                disabled={
                  isLoading || confirmationText !== currentWorkspace?.name
                }
              >
                {isLoading
                  ? "Transferindo..."
                  : "Eu entendo, transferir propriedade"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
