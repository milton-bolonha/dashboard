"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Link from "next/link";
import DynamicItemForm from "@/components/sections/DynamicItemForm";

export default function SectionDetailPage() {
  const params = useParams();
  const slug = params.slug;

  const [section, setSection] = useState(null);
  const [contentType, setContentType] = useState(null); // ← Adicionar estado para contentType
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
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

  useEffect(() => {
    loadSection();
  }, [slug]);

  const loadSection = async () => {
    try {
      setLoading(true);

      // Buscar section
      const response = await fetch("/api/sections");
      const data = await response.json();

      const foundSection = data.sections?.find((s) => s.slug === slug);

      if (!foundSection) {
        setError("Section não encontrada");
        return;
      }

      setSection(foundSection);

      // Buscar contentType correspondente à section
      if (foundSection.contentTypeId) {
        const contentTypesResponse = await fetch("/api/content-types");
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
    try {
      setItemsLoading(true);

      // Primeiro, buscar o ID da section pelo slug
      const sectionsResponse = await fetch("/api/sections");
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
      let response = await fetch(`/api/sections/${targetSection._id}/items`);

      // Se der 404, tentar API de teste
      if (response.status === 404) {
        console.warn("API principal não encontrada, usando API de teste");
        response = await fetch("/api/test-items");
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

    try {
      // Buscar ID da section
      const sectionsResponse = await fetch("/api/sections");
      const sectionsData = await sectionsResponse.json();
      const targetSection = sectionsData.sections?.find((s) => s.slug === slug);

      if (!targetSection) {
        throw new Error("Section não encontrada");
      }

      const response = await fetch(
        `/api/sections/${targetSection._id}/items/${item._id}`,
        {
          method: "DELETE",
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
    }
  };

  const handleUpdateItem = async (itemData) => {
    try {
      // Buscar ID da section
      const sectionsResponse = await fetch("/api/sections");
      const sectionsData = await sectionsResponse.json();
      const targetSection = sectionsData.sections?.find((s) => s.slug === slug);

      if (!targetSection) {
        throw new Error("Section não encontrada");
      }

      const response = await fetch(
        `/api/sections/${targetSection._id}/items/${editingItem._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
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
    try {
      // Primeiro, buscar o ID da section pelo slug
      const sectionsResponse = await fetch("/api/sections");
      const sectionsData = await sectionsResponse.json();
      const targetSection = sectionsData.sections?.find((s) => s.slug === slug);

      if (!targetSection) {
        throw new Error("Section não encontrada");
      }

      // Tentar API principal com ID
      let response = await fetch(`/api/sections/${targetSection._id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(itemData),
      });

      // Se der 404, tentar API de teste
      if (response.status === 404) {
        console.warn("API principal não encontrada, usando API de teste");
        response = await fetch("/api/test-items", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4 text-sm">
              <li>
                <Link
                  href="/dashboard"
                  className="text-gray-400 hover:text-gray-500"
                >
                  Dashboard
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <Link
                  href="/dashboard/sections"
                  className="text-gray-400 hover:text-gray-500"
                >
                  Sections
                </Link>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <span className="text-gray-900 dark:text-white font-medium">
                  {section.name}
                </span>
              </li>
            </ol>
          </nav>

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

      {/* Items Section */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <div className="px-6 py-4">
          <div className="flex items-center mb-4">
            {icons.document}
            <h3 className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
              Items desta Section
            </h3>
          </div>

          {/* Loading de items */}
          {itemsLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Carregando items...
              </p>
            </div>
          ) : items.length === 0 ? (
            /* Estado vazio */
            <div className="text-center py-12">
              <div className="mx-auto h-24 w-24 text-gray-400">
                {icons.document}
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                Nenhum item ainda
              </h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                Esta section está pronta! Agora você pode começar a adicionar
                items.
              </p>
              <div className="mt-6">
                <Button onClick={handleAddItem}>
                  {icons.rocket}
                  <span className="ml-2">Criar Primeiro Item</span>
                </Button>
              </div>
            </div>
          ) : (
            /* Lista de items */
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item._id}
                  className="group border border-gray-200 dark:border-gray-700 rounded-xl p-6 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      {/* Título com visual hierarchy */}
                      <div className="flex items-center space-x-3 mb-3">
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {item.title}
                        </h4>
                        {/* Status badge melhorado */}
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-all ${
                            item.status === "published"
                              ? "bg-green-100 text-green-800 border border-green-200 shadow-sm"
                              : item.status === "draft"
                              ? "bg-yellow-100 text-yellow-800 border border-yellow-200 shadow-sm"
                              : "bg-gray-100 text-gray-800 border border-gray-200 shadow-sm"
                          }`}
                        >
                          <div
                            className={`w-2 h-2 rounded-full mr-2 ${
                              item.status === "published"
                                ? "bg-green-500"
                                : item.status === "draft"
                                ? "bg-yellow-500"
                                : "bg-gray-500"
                            }`}
                          ></div>
                          {item.status === "published"
                            ? "Publicado"
                            : item.status === "draft"
                            ? "Rascunho"
                            : "Arquivado"}
                        </span>
                      </div>

                      {/* Conteúdo dos addons customizados */}
                      {item.data && Object.keys(item.data).length > 0 && (
                        <div className="space-y-2 mb-4">
                          {Object.entries(item.data).map(
                            ([key, value]) =>
                              value && (
                                <div key={key} className="text-sm">
                                  <span className="font-medium text-gray-500 dark:text-gray-400 capitalize">
                                    {key}:
                                  </span>{" "}
                                  <span className="text-gray-600 dark:text-gray-300 line-clamp-1">
                                    {typeof value === "string" &&
                                    value.length > 100
                                      ? value.substring(0, 100) + "..."
                                      : value}
                                  </span>
                                </div>
                              )
                          )}
                        </div>
                      )}

                      {/* Fallback para conteúdo antigo */}
                      {item.content && (
                        <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4 line-clamp-2">
                          {item.content}
                        </p>
                      )}

                      {/* Metadados reorganizados */}
                      <div className="flex items-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
                        <div className="flex items-center space-x-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                            />
                          </svg>
                          <span className="font-mono text-xs">
                            /{item.slug}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <span>
                            {new Date(item.createdAt).toLocaleDateString(
                              "pt-BR"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Botões com hover melhorado */}
                    <div className="ml-6 flex space-x-2 opacity-60 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="small"
                        onClick={() => handleEditItem(item)}
                        className="hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400"
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => handleDeleteItem(item)}
                        className="hover:bg-red-50 hover:text-red-600 hover:border-red-300 dark:hover:bg-red-900/20 dark:hover:text-red-400 dark:hover:border-red-600"
                      >
                        <svg
                          className="w-4 h-4 mr-1"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                        Deletar
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

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
