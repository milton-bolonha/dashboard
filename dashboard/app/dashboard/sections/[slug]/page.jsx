"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Link from "next/link";
import DynamicItemForm from "@/components/sections/DynamicItemForm";
import { ModernItemsTablePro } from "@/components/sections/ModernItemsTablePro";
import ItemCard from "@/components/sections/ItemCard";

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

export default function SectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { slug } = params;
  const { currentWorkspace } = useWorkspace();

  const [section, setSection] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allContentTypes, setAllContentTypes] = useState([]);

  const getWorkspaceHeaders = useCallback(() => {
    if (!currentWorkspace) return {};
    return {
      "x-workspace-id": currentWorkspace._id,
      "Cache-Control": "no-cache",
    };
  }, [currentWorkspace]);

  useEffect(() => {
    const loadSectionData = async () => {
      if (!currentWorkspace || !slug) return;

      setLoading(true);
      setError(null);

      try {
        const sectionsResponse = await fetch("/api/sections", {
          headers: getWorkspaceHeaders(),
        });
        if (!sectionsResponse.ok)
          throw new Error("Failed to fetch sections list.");
        const { sections, contentTypes } = await sectionsResponse.json();
        const currentSection = sections.find((s) => s.slug === slug);

        if (!currentSection) {
          throw new Error(`Section with slug "${slug}" not found.`);
        }
        setSection(currentSection);
        setAllContentTypes(contentTypes || []);

        const itemsResponse = await fetch(
          `/api/sections/${currentSection._id}/items`,
          {
            headers: getWorkspaceHeaders(),
          }
        );
        const { items: sectionItems } = await itemsResponse.json();

        if (currentSection.strategy === "singleton") {
          if (sectionItems && sectionItems.length > 0) {
            router.push(
              `/dashboard/sections/${slug}/items/${sectionItems[0]._id}/edit`
            );
          } else {
            setError(
              "Erro de Consistência: A Seção Singleton não tem um item associado."
            );
          }
        } else {
          if (
            currentSection.strategy === "collection" ||
            currentSection.strategy === "grouping"
          ) {
            setItems(sectionItems || []);
          }
        }
      } catch (err) {
        setError(err.message);
        console.error("Error in loadSectionData:", err);
      } finally {
        setLoading(false);
      }
    };

    loadSectionData();
  }, [slug, currentWorkspace, getWorkspaceHeaders, router]);

  const renderContent = () => {
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

    if (error) {
      return (
        <div className="text-center py-12">
          <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-white">
            Ocorreu um erro
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {error}
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

    if (!section) return null;

    if (section.strategy === "singleton") {
      return (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Redirecionando...
            </p>
          </div>
        </div>
      );
    }

    if (section.strategy === "collection") {
      return (
        <CollectionView
          section={section}
          items={items}
          headers={getWorkspaceHeaders()}
        />
      );
    }

    if (section.strategy === "grouping") {
      return (
        <GroupingView
          section={section}
          items={items}
          allContentTypes={allContentTypes}
          headers={getWorkspaceHeaders()}
        />
      );
    }

    return <p>Estratégia de visualização desconhecida.</p>;
  };

  return <div>{renderContent()}</div>;
}

function CollectionView({ section, items, headers }) {
  const [localItems, setLocalItems] = useState(items);
  const [contentType, setContentType] = useState(null);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  useEffect(() => {
    refreshItems();
  }, [section._id]);

  const refreshItems = async () => {
    if (!section._id) return;
    setItemsLoading(true);
    try {
      const response = await fetch(`/api/sections/${section._id}/items`, {
        headers,
      });
      if (response.ok) {
        const data = await response.json();
        setLocalItems(data.items || []);
        setContentType(data.contentType || null);
      }
    } finally {
      setItemsLoading(false);
    }
  };

  const handleEditItem = (item) => {
    setEditingItem(item);
    setIsEditItemModalOpen(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm(`Tem certeza que deseja deletar este item?`)) return;
    setDeletingItemId(itemId);
    try {
      await fetch(`/api/sections/${section._id}/items/${itemId}`, {
        method: "DELETE",
        headers,
      });
      refreshItems();
    } finally {
      setDeletingItemId(null);
    }
  };

  const handleUpdateItem = async (itemData) => {
    await fetch(`/api/sections/${section._id}/items/${editingItem._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(itemData),
    });
    refreshItems();
    setIsEditItemModalOpen(false);
    setEditingItem(null);
  };

  const handleCreateItem = async (itemData) => {
    await fetch(`/api/sections/${section._id}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ ...itemData, contentTypeId: contentType._id }),
    });
    refreshItems();
    setIsAddItemModalOpen(false);
  };

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div className="px-6 py-4">
          <Breadcrumbs section={section} />
          <div className="flex items-center justify-between mt-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {section.name}
            </h1>
            <div className="flex space-x-3">
              <Button size="small" onClick={() => setIsAddItemModalOpen(true)}>
                {icons.plus}
                <span className="ml-2">Adicionar Item</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ModernItemsTablePro
        items={localItems}
        section={section}
        contentType={contentType}
        onEdit={handleEditItem}
        onDelete={handleDeleteItem}
        deletingItemId={deletingItemId}
        loading={itemsLoading}
      />

      {isAddItemModalOpen && contentType && (
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

      {isEditItemModalOpen && contentType && (
        <Modal
          onClose={() => setIsEditItemModalOpen(false)}
          title="Editar Item"
        >
          <DynamicItemForm
            item={editingItem}
            section={section}
            contentType={contentType}
            onSubmit={handleUpdateItem}
            onCancel={() => setIsEditItemModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
}

function GroupingView({ section, items, allContentTypes, headers }) {
  const [localItems, setLocalItems] = useState(items);
  const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const refreshItems = async () => {
    window.location.reload();
  };

  const getContentTypeForItem = (item) => {
    return allContentTypes.find((ct) => ct._id === item.contentTypeId);
  };

  const handleEditItem = (item) => {
    const contentType = getContentTypeForItem(item);
    console.log("🔍 DEBUG: Editando Item", {
      itemTitle: item.title,
      itemId: item._id,
      contentTypeName: contentType?.name,
      contentTypeId: contentType?._id,
      itemData: item.data,
    });
    setEditingItem(item);
    setIsEditItemModalOpen(true);
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm(`Tem certeza que deseja deletar este item?`)) return;
    await fetch(`/api/sections/${section._id}/items/${itemId}`, {
      method: "DELETE",
      headers,
    });
    refreshItems();
  };

  const handleUpdateItem = async (itemData) => {
    if (!editingItem) return;
    await fetch(`/api/sections/${section._id}/items/${editingItem._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(itemData),
    });
    refreshItems();
    setIsEditItemModalOpen(false);
    setEditingItem(null);
  };

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div className="px-6 py-4">
          <Breadcrumbs section={section} />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {section.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gerencie os itens de configuração desta seção. Cada card representa
            um item com seu próprio Content Type.
          </p>
        </div>
      </div>

      {localItems.length > 0 ? (
        <div className="space-y-4">
          {localItems.map((item) => (
            <ItemCard
              key={item._id}
              item={item}
              section={section}
              onEdit={handleEditItem}
              onDelete={handleDeleteItem}
              contentTypeName={getContentTypeForItem(item)?.name}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow">
          <p>Nenhum item de configuração encontrado para esta seção.</p>
        </div>
      )}

      {isEditItemModalOpen && editingItem && (
        <Modal
          onClose={() => setIsEditItemModalOpen(false)}
          title={`Editar Item: ${editingItem.title}`}
        >
          <DynamicItemForm
            item={editingItem}
            section={section}
            contentType={getContentTypeForItem(editingItem)}
            onSubmit={handleUpdateItem}
            onCancel={() => setIsEditItemModalOpen(false)}
          />
        </Modal>
      )}
    </div>
  );
}
