"use client";

import { useState, useEffect, useCallback } from "react";
import { ModernContentTypesTable } from "@/components/content-types/ModernContentTypesTable";
import ContentTypeForm from "@/components/content-types/ContentTypeForm";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";

export default function ContentTypeContainer() {
  const [contentTypes, setContentTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingContentType, setEditingContentType] = useState(null);

  const fetchContentTypes = useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔍 Tentando buscar content types...");

      // API principal com autenticação flexível
      const response = await fetch("/api/content-types");

      if (!response.ok) {
        throw new Error(
          `Failed to fetch content types (status: ${response.status})`
        );
      }

      const data = await response.json();
      console.log("✅ Content types carregados:", data);

      setContentTypes(data.contentTypes);
      setError(null);
    } catch (err) {
      console.error("❌ Erro ao buscar content types:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContentTypes();
  }, [fetchContentTypes]);

  const handleOpenModal = (contentType = null) => {
    setEditingContentType(contentType);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingContentType(null);
  };

  const handleSubmit = async (formData) => {
    const isEditing = !!editingContentType;
    const url = isEditing
      ? `/api/content-types/${editingContentType._id}`
      : "/api/content-types";
    const method = isEditing ? "PUT" : "POST";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save content type");
      }

      await fetchContentTypes(); // Re-fetch a lista
      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert(err.message); // Simples alerta por enquanto
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Tem certeza que deseja deletar este Content Type?"))
      return;

    try {
      const response = await fetch(`/api/content-types/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete content type");
      await fetchContentTypes();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Content Types
        </h1>
        <Button onClick={() => handleOpenModal()}>Novo Content Type</Button>
      </div>

      {loading && <p>Carregando...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && !error && (
        <ModernContentTypesTable
          contentTypes={contentTypes}
          onEdit={handleOpenModal}
          onDelete={handleDelete}
        />
      )}

      {isModalOpen && (
        <Modal
          onClose={handleCloseModal}
          title={
            editingContentType ? "Editar Content Type" : "Novo Content Type"
          }
        >
          <ContentTypeForm
            contentType={editingContentType}
            onSubmit={handleSubmit}
            onCancel={handleCloseModal}
          />
        </Modal>
      )}
    </div>
  );
}
