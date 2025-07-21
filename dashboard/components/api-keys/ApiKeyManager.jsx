"use client";

import { useState, useEffect } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import Button from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// Componente simples para um modal
const Modal = ({ show, onClose, title, children }) => {
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-2xl">
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export function ApiKeyManager() {
  const { currentWorkspace } = useWorkspace();
  const [keys, setKeys] = useState([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [generatedKey, setGeneratedKey] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  console.log("ApiKeyManager rendered. Current Workspace:", currentWorkspace);

  const fetchKeys = async () => {
    if (!currentWorkspace) {
      console.log("fetchKeys: Abortando, nenhum workspace selecionado.");
      setLoading(false);
      return;
    }
    console.log(
      `fetchKeys: Buscando chaves para o workspace ${currentWorkspace._id}`
    );
    setLoading(true);
    try {
      const response = await fetch(
        `/api/workspaces/${currentWorkspace._id}/api-keys`
      );
      if (response.ok) {
        const data = await response.json();
        setKeys(data);
      }
    } catch (error) {
      console.error("Failed to fetch API keys:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("ApiKeyManager useEffect triggered.");
    fetchKeys();
  }, [currentWorkspace]);

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!newKeyName || !currentWorkspace) {
      console.log(
        "handleCreateKey: Abortando, nome da chave ou workspace faltando."
      );
      return;
    }

    try {
      const response = await fetch(
        `/api/workspaces/${currentWorkspace._id}/api-keys`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newKeyName }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setGeneratedKey(data.apiKey);
        setShowModal(true);
        setNewKeyName("");
        fetchKeys(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to create API key:", error);
    }
  };

  const handleDeleteKey = async (keyId) => {
    if (
      !currentWorkspace ||
      !confirm(
        "Tem certeza que deseja excluir esta chave? Esta ação é irreversível."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/workspaces/${currentWorkspace._id}/api-keys/${keyId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setKeys(keys.filter((key) => key.id !== keyId));
      } else {
        console.error("Failed to delete API key");
        // TODO: Mostrar um toast/notificação de erro para o usuário
      }
    } catch (error) {
      console.error("Failed to delete API key:", error);
    }
  };

  if (!currentWorkspace) {
    return <p>Selecione um workspace para gerenciar as chaves de API.</p>;
  }

  if (loading) {
    return <p>Carregando chaves de API...</p>;
  }

  return (
    <div>
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-bold mb-2">Criar Nova Chave</h3>
        <form onSubmit={handleCreateKey} className="flex items-center gap-4">
          <Input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Nome da chave (ex: gatsby-landing)"
            className="flex-grow"
          />
          <Button type="submit">Criar</Button>
        </form>
      </div>

      <div className="space-y-4">
        {keys.length > 0 ? (
          keys.map((key) => (
            <div
              key={key.id}
              className="flex justify-between items-center bg-white p-4 rounded-lg shadow"
            >
              <div>
                <p className="font-bold">{key.name}</p>
                <p className="text-sm text-gray-500 font-mono">
                  {key.last4}...
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => handleDeleteKey(key.id)}
              >
                Excluir
              </Button>
            </div>
          ))
        ) : (
          <p>Nenhuma chave de API encontrada para este workspace.</p>
        )}
      </div>

      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        title="Chave de API Gerada"
      >
        <p className="mb-4">
          Copie esta chave. Você não poderá vê-la novamente.
        </p>
        <div className="bg-gray-100 p-3 rounded font-mono break-all">
          {generatedKey}
        </div>
        <Button
          onClick={() => navigator.clipboard.writeText(generatedKey)}
          className="mt-4"
        >
          Copiar
        </Button>
      </Modal>
    </div>
  );
}
