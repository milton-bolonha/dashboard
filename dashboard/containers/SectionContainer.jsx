"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { ModernSectionsTable } from "@/components/sections/ModernSectionsTable";
import SectionForm from "@/components/sections/SectionForm";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useSections } from "@/contexts/SectionsContext";
import { fetchWithWorkspace } from "@/lib/api";

export default function SectionContainer() {
  const { user } = useUser();
  const { currentWorkspace } = useWorkspace();
  const { sections, refreshSections, loading, error } = useSections(); // ← Usar contexto
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);
  const [contentTypes, setContentTypes] = useState([]); // Será usado pelo SectionForm

  // Busca os content types para o formulário de criação/edição
  const fetchContentTypes = useCallback(async () => {
    try {
      console.log(
        "🔍 SectionContainer: Buscando content types para o formulário..."
      );
      const contentTypesRes = await fetchWithWorkspace("/api/content-types");
      if (!contentTypesRes.ok) {
        throw new Error(
          `Failed to fetch content types (status: ${contentTypesRes.status})`
        );
      }
      const contentTypesData = await contentTypesRes.json();
      setContentTypes(contentTypesData.contentTypes);
    } catch (err) {
      console.error("❌ SectionContainer: Erro ao buscar content types:", err);
      // Não vamos setar um erro fatal aqui, o form pode lidar com a ausência
    }
  }, []);

  useEffect(() => {
    if (isModalOpen) {
      fetchContentTypes();
    }
  }, [isModalOpen, fetchContentTypes]);

  const handleOpenModal = (section = null) => {
    setEditingSection(section);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingSection(null);
  };

  const handleSubmit = async (formData) => {
    const isEditing = !!editingSection;
    const url = isEditing
      ? `/api/sections/${editingSection._id}`
      : "/api/sections";
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetchWithWorkspace(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save section");
      }

      await refreshSections(); // Atualizar lista via contexto
      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert(err.message); // Simples alerta por enquanto
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja deletar esta Section?")) return;

    try {
      const response = await fetchWithWorkspace(`/api/sections/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete section");
      await refreshSections(); // Atualizar lista via contexto
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ✅ NOVO: Callback para reordenação
  const handleReorder = async (reorderedSections) => {
    // Atualizar contexto imediatamente para feedback visual
    await refreshSections();
  };

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 dark:text-red-400">
          <h3 className="text-lg font-medium">Erro ao carregar sections</h3>
          <p className="mt-2">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sections
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Gerencie as áreas de conteúdo do seu workspace
          </p>
        </div>
        <Button onClick={() => handleOpenModal()}>Nova Section</Button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            Carregando sections...
          </div>
        </div>
      ) : (
        <>
          {sections.length > 0 ? (
            <ModernSectionsTable
              sections={sections}
              onEdit={handleOpenModal}
              onDelete={handleDelete}
              onReorder={handleReorder}
            />
          ) : (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-700">
                  <svg
                    className="h-6 w-6 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                    />
                  </svg>
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
                  Nenhuma section encontrada
                </h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Crie uma nova section para começar a gerenciar seus items.
                </p>
              </div>
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <Modal
          onClose={handleCloseModal}
          title={editingSection ? "Editar Section" : "Nova Section"}
        >
          <SectionForm
            section={editingSection}
            contentTypes={contentTypes}
            onSubmit={handleSubmit}
            onCancel={handleCloseModal}
          />
        </Modal>
      )}
    </div>
  );
}
