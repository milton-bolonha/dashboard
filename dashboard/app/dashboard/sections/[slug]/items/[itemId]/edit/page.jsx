"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import Button from "@/components/ui/Button";
import Link from "next/link";
import DynamicItemForm from "@/components/sections/DynamicItemForm";

function Breadcrumbs({ section, item, isCreating }) {
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
            {/* Ícone de chevron */}
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
            <Link
              href={`/dashboard/sections/${section.slug}`}
              className="ml-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              {section.name}
            </Link>
          </div>
        </li>
        <li>
          <div className="flex items-center">
            {/* Ícone de chevron */}
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
              {isCreating ? "Novo Item" : `Edit: ${item?.title || ""}`}
            </span>
          </div>
        </li>
      </ol>
    </nav>
  );
}

export default function EditItemPage() {
  const params = useParams();
  const router = useRouter();
  const { slug, itemId } = params;
  const { currentWorkspace } = useWorkspace();

  const [section, setSection] = useState(null);
  const [contentType, setContentType] = useState(null);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isCreating = itemId === "new";

  const getWorkspaceHeaders = () => {
    if (!currentWorkspace) return {};
    return { "x-workspace-id": currentWorkspace._id };
  };

  useEffect(() => {
    if (currentWorkspace && slug && itemId) {
      loadData();
    }
  }, [currentWorkspace, slug, itemId]);

  const loadData = async () => {
    try {
      setLoading(true);

      // 1. Fetch Section to get section._id and contentTypeId
      const sectionsResponse = await fetch("/api/sections", {
        headers: getWorkspaceHeaders(),
      });
      const sectionsData = await sectionsResponse.json();
      const foundSection = sectionsData.sections?.find((s) => s.slug === slug);

      if (!foundSection) {
        throw new Error("Section not found");
      }
      setSection(foundSection);

      // 2. Fetch Content Type
      const contentTypesResponse = await fetch("/api/content-types", {
        headers: getWorkspaceHeaders(),
      });
      const contentTypesData = await contentTypesResponse.json();
      const foundContentType = contentTypesData.contentTypes?.find(
        (ct) => ct._id === foundSection.contentTypeId
      );

      if (!foundContentType) {
        throw new Error("Content Type not found");
      }
      setContentType(foundContentType);

      if (isCreating) {
        setItem({}); // Start with an empty object for a new item
      } else {
        // 3. Fetch the specific item
        const itemResponse = await fetch(
          `/api/sections/${foundSection._id}/items/${itemId}`,
          { headers: getWorkspaceHeaders() }
        );

        if (!itemResponse.ok) {
          throw new Error("Item not found");
        }
        const itemData = await itemResponse.json();
        setItem(itemData.item);
      }
    } catch (err) {
      setError(err.message);
      console.error("Error loading data for edit page:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (itemData) => {
    if (!currentWorkspace || !section) return;

    const url = isCreating
      ? `/api/sections/${section._id}/items`
      : `/api/sections/${section._id}/items/${item._id}`;
    const method = isCreating ? "POST" : "PUT";

    try {
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          ...getWorkspaceHeaders(),
        },
        body: JSON.stringify(itemData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to ${isCreating ? "create" : "update"} item`
        );
      }

      router.push(`/dashboard/sections/${slug}`);
    } catch (error) {
      console.error(
        `Failed to ${isCreating ? "create" : "update"} item:`,
        error
      );
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <p>Loading item...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-red-600">Error: {error}</h3>
        <Link href={`/dashboard/sections/${slug}`}>
          <Button variant="secondary" className="mt-4">
            Back to Section
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg mb-6">
        <div className="px-6 py-4">
          <Breadcrumbs section={section} item={item} isCreating={isCreating} />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">
            {isCreating ? "Criar Novo Item" : `Editing: ${item?.title}`}
          </h1>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        {contentType && section ? (
          <DynamicItemForm
            item={item}
            section={section}
            contentType={contentType}
            onSubmit={handleSubmit}
            onCancel={() => router.push(`/dashboard/sections/${slug}`)}
          />
        ) : (
          <p>Preparing form...</p>
        )}
      </div>
    </div>
  );
}
