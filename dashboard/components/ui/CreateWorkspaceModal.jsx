"use client";

import { useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import Modal from "./Modal"; // Assumindo que você tem um componente Modal genérico

export function CreateWorkspaceModal({ isOpen, onClose }) {
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("O nome do workspace é obrigatório.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await createWorkspace({ name, description });
      onClose(); // Fechar o modal em caso de sucesso
    } catch (err) {
      setError(err.message || "Ocorreu um erro desconhecido.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Novo Workspace">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>
        )}
        <div>
          <label
            htmlFor="workspace-name"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Nome do Workspace
          </label>
          <input
            type="text"
            id="workspace-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600"
            placeholder="Meu Novo Projeto"
            required
          />
        </div>
        <div>
          <label
            htmlFor="workspace-description"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            Descrição (Opcional)
          </label>
          <textarea
            id="workspace-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm dark:bg-gray-800 dark:border-gray-600"
            placeholder="Uma breve descrição sobre o que é este workspace."
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none disabled:opacity-50"
          >
            {loading ? "Criando..." : "Criar Workspace"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
