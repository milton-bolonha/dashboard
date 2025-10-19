"use client";

import Modal from "./ui/Modal";

/**
 * Modal mostrado quando user tenta criar workspace com nome duplicado
 *
 * @param {object} props
 * @param {boolean} props.isOpen
 * @param {string} props.workspaceName - Nome que user tentou criar
 * @param {object} props.existingWorkspace - Workspace existente com esse nome
 * @param {Function} props.onChoice - Callback com escolha do user
 * @param {Function} props.onClose
 */
export default function WorkspaceDuplicateModal({
  isOpen,
  workspaceName,
  existingWorkspace,
  onChoice,
  onClose,
}) {
  const handleChoice = (choice) => {
    onChoice(choice, existingWorkspace);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Workspace já existe">
      <div className="space-y-4">
        <p className="text-gray-600">
          Você já tem um workspace chamado <strong>"{workspaceName}"</strong>. O
          que deseja fazer?
        </p>

        <div className="space-y-3">
          {/* Opção 1: Ir para workspace existente */}
          <button
            onClick={() => handleChoice("switch")}
            className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="font-semibold text-gray-900">
              Ir para esse workspace
            </div>
            <div className="text-sm text-gray-500">
              Abrir o workspace "{existingWorkspace?.name}"
            </div>
          </button>

          {/* Opção 2: Adicionar como company (Week 3) */}
          <button
            onClick={() => handleChoice("add-company")}
            disabled
            className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="font-semibold text-gray-900">
              Adicionar como company
            </div>
            <div className="text-sm text-gray-500">
              Criar company no workspace atual (disponível em breve)
            </div>
          </button>

          {/* Opção 3: Cancelar */}
          <button
            onClick={() => handleChoice("cancel")}
            className="w-full px-4 py-3 text-left border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="font-semibold text-gray-900">Cancelar</div>
            <div className="text-sm text-gray-500">Voltar e editar o nome</div>
          </button>
        </div>
      </div>
    </Modal>
  );
}
