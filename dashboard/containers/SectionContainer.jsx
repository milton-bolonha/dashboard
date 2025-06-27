"use client";

import { useState, useEffect, useCallback } from "react";
import SectionList from "@/components/sections/SectionList";
import SectionForm from "@/components/sections/SectionForm";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useSections } from "@/contexts/SectionsContext";

export default function SectionContainer() {
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

      // API principal com autenticação flexível
      const contentTypesRes = await fetch("/api/content-types");

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

    try {
      let response;

      if (isEditing) {
        // Para edição, usar a API específica da section
        response = await fetch(`/api/sections/${editingSection._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        // Para criação, usar a API geral
        response = await fetch("/api/sections", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save section");
      }

      await refreshSections(); // ← Atualizar contexto global
      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja deletar esta Section?")) return;

    try {
      const response = await fetch(`/api/sections/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to delete section");
      await refreshSections(); // ← Atualizar contexto global
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Sections
        </h1>
        <Button
          onClick={() => handleOpenModal()}
          disabled={contentTypes.length === 0}
        >
          Nova Section
        </Button>
      </div>

      {contentTypes.length === 0 && !loading && (
        <p className="text-yellow-600 dark:text-yellow-400">
          Você precisa criar um Content Type antes de criar uma Section.
        </p>
      )}

      {loading && <p>Carregando...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <SectionList
          sections={sections}
          contentTypes={contentTypes}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
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
