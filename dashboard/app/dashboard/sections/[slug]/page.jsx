"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Link from "next/link";
import DynamicItemForm from "@/components/sections/DynamicItemForm";
import { ModernItemsTable } from "@/components/sections/ModernItemsTable";
import { Inspector } from "@/components/ui/Inspector";

function Breadcrumbs({ section }) {
  if (!section) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex items-center space-x-2 text-sm">
        <li>
          <a
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            href="/dashboard"
          >
            Dashboard
          </a>
        </li>
        <li>
          <div className="flex items-center">
            <svg
              className="flex-shrink-0 h-5 w-5 text-gray-400 dark:text-gray-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
            <a
              className="ml-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              href="/dashboard/sections"
            >
              Sections
            </a>
          </div>
        </li>
        <li>
          <div className="flex items-center">
            <svg
              className="flex-shrink-0 h-5 w-5 text-gray-400 dark:text-gray-500"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                clipRule="evenodd"
              />
            </svg>
            <span
              className="ml-2 text-sm font-medium text-gray-800 dark:text-white"
              aria-current="page"
            >
              {section.name}
            </span>
          </div>
        </li>
      </ol>
    </nav>
  );
}

export default function SectionDetailPage() {
  const params = useParams();
  const slug = params.slug;
  const { currentWorkspace } = useWorkspace();

  const [section, setSection] = useState(null);
  const [contentType, setContentType] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [error, setError] = useState(null);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Ícones do sistema (mesmo padrão do Sidebar)
  const icons = {
    settings: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
    plus: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6v6m0 0v6m0-6h6m-6 0H6"
        />
      </svg>
    ),
    info: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
          clipRule="evenodd"
        />
      </svg>
    ),
    document: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
    rocket: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13 10V3L4 14h7v7l9-11h-7z"
        />
      </svg>
    ),
    back: (
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10 19l-7-7m0 0l7-7m-7 7h18"
        />
      </svg>
    ),
  };

  // ✅ WORKSPACE: Helper para headers
  const getWorkspaceHeaders = () => {
    if (!currentWorkspace) return {};

    return {
      "x-workspace-id": currentWorkspace._id,
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    };
  };

  useEffect(() => {
    if (currentWorkspace) {
      loadSection();
    }
  }, [slug, currentWorkspace]);

  const loadSection = async () => {
    if (!currentWorkspace) {
      console.log("⚠️ Aguardando workspace...");
      return;
    }

    try {
      setLoading(true);

      // Buscar section
      const response = await fetch("/api/sections", {
        headers: getWorkspaceHeaders(),
      });
      const data = await response.json();

      const foundSection = data.sections?.find((s) => s.slug === slug);

      if (!foundSection) {
        setError("Section não encontrada");
        return;
      }

      setSection(foundSection);

      // Buscar contentType correspondente à section
      if (foundSection.contentTypeId) {
        const contentTypesResponse = await fetch("/api/content-types", {
          headers: getWorkspaceHeaders(),
        });
        const contentTypesData = await contentTypesResponse.json();

        const foundContentType = contentTypesData.contentTypes?.find(
          (ct) => ct._id === foundSection.contentTypeId
        );

        if (foundContentType) {
          setContentType(foundContentType);
          console.log("✅ Content Type carregado:", foundContentType);
        } else {
          console.warn(
            "⚠️ Content Type não encontrado:",
            foundSection.contentTypeId
          );
        }
      }

      // Carregar items da section
      loadItems(slug);
    } catch (err) {
      setError(err.message);
      console.error("Erro ao carregar section:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadItems = async (sectionSlug) => {
    if (!currentWorkspace) {
      console.log("⚠️ Aguardando workspace para carregar items...");
      return;
    }

    try {
      setItemsLoading(true);

      // Primeiro, buscar o ID da section pelo slug
      const sectionsResponse = await fetch("/api/sections", {
        headers: getWorkspaceHeaders(),
      });
      const sectionsData = await sectionsResponse.json();
      const targetSection = sectionsData.sections?.find(
        (s) => s.slug === sectionSlug
      );

      if (!targetSection) {
        console.warn("Section não encontrada para carregar items");
        setItems([]);
        return;
      }

      // Agora usar o ID para buscar items
      let response = await fetch(`/api/sections/${targetSection._id}/items`, {
        headers: getWorkspaceHeaders(),
      });

      // Se der 404, tentar API de teste
      if (response.status === 404) {
        console.warn("API principal não encontrada, usando API de teste");
        response = await fetch("/api/test-items", {
          headers: getWorkspaceHeaders(),
        });
      }

      if (response.ok) {
        const data = await response.json();
        setItems(data.items || []);
      } else {
        console.warn("Erro ao carregar items, usando array vazio");
        setItems([]);
      }
    } catch (err) {
      console.warn("Erro ao carregar items:", err);
      setItems([]);
    } finally {
      setItemsLoading(false);
    }
  };

  const handleConfigureSection = () => {
    setIsConfigModalOpen(true);
  };

  const handleAddItem = () => {
    setIsAddItemModalOpen(true);
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsEditItemModalOpen(true);
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Tem certeza que deseja deletar "${item.title}"?`)) {
      return;
    }

    if (!currentWorkspace) {
      alert("Workspace não selecionado");
      return;
    }

    setDeletingItemId(item._id);

    try {
      // Buscar ID da section
      const sectionsResponse = await fetch("/api/sections", {
        headers: getWorkspaceHeaders(),
      });
      const sectionsData = await sectionsResponse.json();
      const targetSection = sectionsData.sections?.find((s) => s.slug === slug);

      if (!targetSection) {
        throw new Error("Section não encontrada");
      }

      const response = await fetch(
        `/api/sections/${targetSection._id}/items/${item._id}`,
        {
          method: "DELETE",
          headers: getWorkspaceHeaders(),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao deletar item");
      }

      console.log("✅ Item deletado:", item.title);

      // Atualizar lista
      await loadItems(slug);
    } catch (error) {
      console.error("❌ Erro ao deletar item:", error);
      alert(error.message);
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleUpdateItem = async (itemData) => {
    if (!currentWorkspace) {
      alert("Workspace não selecionado");
      return;
    }

    try {
      // Buscar ID da section
      const sectionsResponse = await fetch("/api/sections", {
        headers: getWorkspaceHeaders(),
      });
      const sectionsData = await sectionsResponse.json();
      const targetSection = sectionsData.sections?.find((s) => s.slug === slug);

      if (!targetSection) {
        throw new Error("Section não encontrada");
      }

      const response = await fetch(
        `/api/sections/${targetSection._id}/items/${editingItem._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getWorkspaceHeaders(),
          },
          body: JSON.stringify(itemData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao atualizar item");
      }

      const data = await response.json();
      console.log("✅ Item atualizado:", data.item);

      // Atualizar lista
      await loadItems(slug);
      setIsEditItemModalOpen(false);
      setEditingItem(null);
    } catch (error) {
      console.error("❌ Erro ao atualizar item:", error);
      alert(error.message);
    }
  };

  const handleCreateItem = async (itemData) => {
    if (!currentWorkspace) {
      alert("Workspace não selecionado");
      return;
    }

    try {
      // Primeiro, buscar o ID da section pelo slug
      const sectionsResponse = await fetch("/api/sections", {
        headers: getWorkspaceHeaders(),
      });
      const sectionsData = await sectionsResponse.json();
      const targetSection = sectionsData.sections?.find((s) => s.slug === slug);

      if (!targetSection) {
        throw new Error("Section não encontrada");
      }

      // Tentar API principal com ID
      let response = await fetch(`/api/sections/${targetSection._id}/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getWorkspaceHeaders(),
        },
        body: JSON.stringify(itemData),
      });

      // Se der 404, tentar API de teste
      if (response.status === 404) {
        console.warn("API principal não encontrada, usando API de teste");
        response = await fetch("/api/test-items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getWorkspaceHeaders(),
          },
          body: JSON.stringify(itemData),
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao criar item");
      }

      const data = await response.json();
      console.log("✅ Item criado:", data.item);

      // Atualizar lista de items
      await loadItems(slug);
      setIsAddItemModalOpen(false);
    } catch (error) {
      console.error("❌ Erro ao criar item:", error);
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">
            Carregando section...
          </p>
        </div>
      </div>
    );
  }

  if (error || !section) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.996-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
          Section não encontrada
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          A section "{slug}" não existe ou foi removida.
        </p>
        <div className="mt-6">
          <Link href="/dashboard/sections">
            <Button variant="secondary">
              {icons.back}
              <span className="ml-2">Voltar para Sections</span>
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div className="px-6 py-4">
          {/* Breadcrumb */}
          <Breadcrumbs section={section} />

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {section.name}
              </h1>
              {section.description && (
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  {section.description}
                </p>
              )}
            </div>

            <div className="flex space-x-3">
              <Button
                variant="secondary"
                size="small"
                onClick={handleConfigureSection}
              >
                {icons.settings}
                <span className="ml-2">Configurar</span>
              </Button>
              <Button size="small" onClick={handleAddItem}>
                {icons.plus}
                <span className="ml-2">Adicionar Item</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Section Info */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div className="px-6 py-4">
          <div className="flex items-center mb-4">
            {icons.info}
            <h3 className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
              Informações da Section
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Nome:
              </span>
              <p className="text-gray-900 dark:text-white">{section.name}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Slug:
              </span>
              <p className="text-gray-900 dark:text-white">/{section.slug}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Content Type ID:
              </span>
              <p className="text-gray-900 dark:text-white">
                {section.contentTypeId}
              </p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Status:
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {section.isActive ? "Ativo" : "Inativo"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Section - Tabela Moderna */}
      <ModernItemsTable
        items={items}
        section={section}
        contentType={contentType}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
        deletingItemId={deletingItemId}
        loading={itemsLoading}
      />

      {/* Modal de Configuração */}
      {isConfigModalOpen && (
        <Modal
          onClose={() => setIsConfigModalOpen(false)}
          title="Configurar Section"
        >
          <div className="py-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Funcionalidade de configuração será implementada em breve.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-sm">Ativar/Desativar Section</span>
                <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
                  Em breve
                </button>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-sm">Editar informações</span>
                <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
                  Em breve
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Modal de Adicionar Item */}
      {isAddItemModalOpen && (
        <Modal
          onClose={() => setIsAddItemModalOpen(false)}
          title="Adicionar Novo Item"
        >
          <DynamicItemForm
            item={null}
            section={section}
            contentType={contentType}
            onSubmit={handleCreateItem}
            onCancel={() => setIsAddItemModalOpen(false)}
          />
        </Modal>
      )}

      {/* Modal de Editar Item */}
      {isEditItemModalOpen && (
        <Modal
          onClose={() => {
            setIsEditItemModalOpen(false);
            setEditingItem(null);
          }}
          title="Editar Item"
        >
          <DynamicItemForm
            item={editingItem}
            section={section}
            contentType={contentType}
            onSubmit={handleUpdateItem}
            onCancel={() => {
              setIsEditItemModalOpen(false);
              setEditingItem(null);
            }}
          />
        </Modal>
      )}
    </div>
  );
}
