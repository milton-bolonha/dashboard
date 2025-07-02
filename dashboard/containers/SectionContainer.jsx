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
  const { sections, refreshSections } = useSections(); // ← Usar contexto
  const [contentTypes, setContentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState(null);

  const fetchContentTypes = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔍 SectionContainer: Tentando buscar content types...");

      // API principal com autenticação flexível e workspace
      const contentTypesRes = await fetchWithWorkspace("/api/content-types");

      if (!contentTypesRes.ok) {
        throw new Error(
          `Failed to fetch content types (status: ${contentTypesRes.status})`
        );
      }

      const contentTypesData = await contentTypesRes.json();
      console.log(
        "✅ SectionContainer: Content types carregados:",
        contentTypesData
      );

      setContentTypes(contentTypesData.contentTypes);
      setError(null);
    } catch (err) {
      console.error("❌ SectionContainer: Erro ao buscar content types:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContentTypes();
  }, [fetchContentTypes]);

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

      {loading && (
        <div className="text-center py-12">
          <div className="text-gray-500 dark:text-gray-400">
            Carregando sections...
          </div>
        </div>
      )}

      {!loading && !error && (
        <ModernSectionsTable
          sections={sections}
          contentTypes={contentTypes}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
          onReorder={handleReorder} // ✅ NOVO: Passar callback
        />
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
