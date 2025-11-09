"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";

import { useToast } from "@/lib/state/toast-context";
import type { Contact, Note, Tile, WorkspaceSnapshot } from "@/lib/types";
import { AdminShellAde } from "@/components/admin/ade/AdminShellAde";
import { AdminHeaderAde } from "@/components/admin/ade/AdminHeaderAde";
import { AdminSidebarAde } from "@/components/admin/ade/AdminSidebarAde";
import { TileGridAde } from "@/containers/admin/ade/TileGridAde";
import { NotesPanelAde } from "@/containers/admin/ade/NotesPanelAde";
import { ContactsPanelAde } from "@/containers/admin/ade/ContactsPanelAde";
import { EmptyStateAde } from "@/components/ui/EmptyStateAde";
import { FilesPlaceholderAde } from "@/containers/admin/ade/FilesPlaceholderAde";
import { TileDetailModal } from "@/components/ui/prompt-tiles/TileDetailModal";
import { AddContactModal } from "@/components/admin/ade/AddContactModal";
import { AddCompanyModal } from "@/components/admin/ade/AddCompanyModal";
import { resolveModel } from "@/lib/ai/settings";
import {
  deleteWorkspace as deleteCachedWorkspace,
  getLastSessionId,
  loadWorkspace as loadCachedWorkspace,
  saveWorkspace as saveCachedWorkspace,
  rememberSessionId,
} from "@/lib/storage/workspace-browser";

type WorkspaceResponse = WorkspaceSnapshot;
type WorkspaceFetcherError = Error & { status?: number; data?: unknown };

async function fetchWorkspace(url: string): Promise<WorkspaceResponse> {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    const error: WorkspaceFetcherError = new Error("Failed to load workspace");
    error.status = response.status;
    try {
      error.data = await response.json();
    } catch {
      error.data = null;
    }
    throw error;
  }
  return (await response.json()) as WorkspaceResponse;
}

export function AdminContainer() {
  const { data, error, isLoading, mutate } = useSWR<WorkspaceResponse>(
    "/api/workspace",
    fetchWorkspace,
    {
      refreshInterval: (data) => {
        // Poll every 3 seconds if no tiles yet (generation in progress)
        const hasTiles = data?.company?.tiles && data.company.tiles.length > 0;
        return hasTiles ? 0 : 3000; // Stop polling once we have tiles
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );
  const { push } = useToast();
  const router = useRouter();
  const [isResetting, startReset] = useTransition();
  const [isRefreshing, startRefresh] = useTransition();
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [isPersistingOrder, setIsPersistingOrder] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [localWorkspace, setLocalWorkspace] = useState<WorkspaceSnapshot | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isAddContactModalOpen, setAddContactModalOpen] = useState(false);
  const [isAddCompanyModalOpen, setAddCompanyModalOpen] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isGeneratingWorkspace, setIsGeneratingWorkspace] = useState(false);
  const workspaceError = error as WorkspaceFetcherError | undefined;
  const cacheWarningShownRef = useRef(false);

  useEffect(() => {
    const lastSession = getLastSessionId();
    if (!lastSession) return;
    const cached = loadCachedWorkspace(lastSession);
    if (cached) {
      setSessionId(lastSession);
      setLocalWorkspace(cached);
    }
  }, []);

  useEffect(() => {
    if (!data) return;
    setSessionId(data.sessionId);
    setLocalWorkspace(data);
    saveCachedWorkspace(data.sessionId, data);
    cacheWarningShownRef.current = false;
  }, [data]);

  useEffect(() => {
    if (
      !cacheWarningShownRef.current &&
      workspaceError?.status === 404 &&
      localWorkspace
    ) {
      cacheWarningShownRef.current = true;
      push({
        title: "Session expired",
        description: "Showing the last saved workspace. Generate a new one to refresh.",
        variant: "destructive",
      });
    }
  }, [workspaceError, localWorkspace, push]);

  const workspace = useMemo<WorkspaceResponse | null>(() => {
    if (data) return data;
    return localWorkspace;
  }, [data, localWorkspace]);

  const tiles: Tile[] = useMemo(() => {
    if (!workspace) return [];
    const now = new Date().toISOString();
    return [...workspace.company.tiles]
      .map((tile, index) => {
        const createdAt = tile.createdAt ?? now;
        const updatedAt = tile.updatedAt ?? createdAt;
        const prompt =
          tile.prompt && tile.prompt.trim().length > 0
            ? tile.prompt
            : `Provide a concise insight for "${tile.title}".`;
        const history =
          tile.history && tile.history.length > 0
            ? tile.history.map((entry, entryIndex) => ({
                id: entry.id ?? `history_${tile.id}_${entryIndex}`,
                role:
                  entry.role === "assistant" ||
                  entry.role === "system" ||
                  entry.role === "user"
                    ? entry.role
                    : "assistant",
                content: entry.content ?? "",
                createdAt: entry.createdAt ?? updatedAt,
              }))
            : [
                {
                  id: `legacy_user_${tile.id}`,
                  role: "user" as const,
                  content: prompt,
                  createdAt,
                },
                {
                  id: `legacy_assistant_${tile.id}`,
                  role: "assistant" as const,
                  content: tile.content ?? "",
                  createdAt,
                },
              ];

        return {
          ...tile,
          prompt,
          model: resolveModel(tile.model),
          templateId: tile.templateId ?? "legacy_template",
          templateTileId: tile.templateTileId ?? undefined,
          category: tile.category,
          orderIndex: tile.orderIndex ?? index,
          createdAt,
          updatedAt,
          totalTokens: tile.totalTokens ?? null,
          attempts: tile.attempts ?? 1,
          history,
          content: tile.content ?? "",
        };
      })
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [workspace]);

  const activeTile = useMemo(
    () => tiles.find((tile) => tile.id === selectedTileId) ?? null,
    [tiles, selectedTileId]
  );

  const notes: Note[] = workspace?.company.notes ?? [];
  const contacts: Contact[] = workspace?.company.contacts ?? [];
  const cacheBanner =
    workspaceError?.status === 404 && workspace ? (
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Workspace cache expired on the server. You&apos;re viewing the last saved copy. Generate a new workspace from the landing page to refresh it.
      </div>
    ) : null;

  const handleResetWorkspace = () => {
    startReset(async () => {
      try {
      const response = await fetch("/api/workspace", { method: "DELETE" });
        if (!response.ok) {
          throw new Error("Failed to reset the workspace");
        }
      const payload = await response.json().catch(() => null);
      if (sessionId) {
        deleteCachedWorkspace(sessionId);
      }
      if (payload?.workspace) {
        setSessionId(payload.workspace.sessionId);
        setLocalWorkspace(payload.workspace);
        saveCachedWorkspace(payload.workspace.sessionId, payload.workspace);
      } else {
        setLocalWorkspace(null);
      }
      await mutate();
        push({
          title: "Workspace cleared",
          description: "Generate a fresh set of insights from the landing page.",
          variant: "success",
        });
      } catch (err) {
        push({
          title: "Reset failed",
          description:
            err instanceof Error ? err.message : "Please try again in a few moments.",
          variant: "destructive",
        });
      }
    });
  };

  const handleRefresh = () => {
    startRefresh(async () => {
      await mutate();
    });
  };

  const handleDeleteTile = async (tileId: string) => {
    try {
      const response = await fetch(`/api/workspace/tiles/${tileId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        if (response.status === 404) {
          push({
            title: "Session expired",
            description: "Return to the homepage to generate a new workspace.",
            variant: "destructive",
          });
          if (sessionId) {
            deleteCachedWorkspace(sessionId);
          }
          setLocalWorkspace(null);
          await mutate();
          return;
        }
        throw new Error("Failed to remove tile");
      }
      await mutate();
      push({
        title: "Tile removed",
        variant: "success",
      });
    } catch (err) {
      push({
        title: "Deletion failed",
        description:
          err instanceof Error ? err.message : "Please try again in a few moments.",
        variant: "destructive",
      });
    }
  };

  const handleReorderTiles = async (order: string[]) => {
    if (!order.length) return;
    try {
      setIsPersistingOrder(true);
      const response = await fetch("/api/workspace/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      if (!response.ok) {
        if (response.status === 404) {
          push({
            title: "Session expired",
            description: "Return to the homepage to generate a new workspace.",
            variant: "destructive",
          });
          if (sessionId) {
            deleteCachedWorkspace(sessionId);
          }
          setLocalWorkspace(null);
          await mutate();
          return;
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to persist tile order");
      }
      await mutate();
    } catch (err) {
      push({
        title: "Reorder failed",
        description:
          err instanceof Error ? err.message : "Please try again shortly.",
        variant: "destructive",
      });
    } finally {
      setIsPersistingOrder(false);
    }
  };

  const handleCreateContactFromModal = async (payload: {
    name: string;
    jobTitle: string;
    linkedinUrl: string;
  }) => {
    if (isSavingContact) return;
    const trimmedName = payload.name.trim();
    if (!trimmedName) {
      push({
        title: "Add a name first",
        description: "The contact must have at least a name.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingContact(true);
    try {
      const response = await fetch("/api/workspace/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          jobTitle: payload.jobTitle.trim() || undefined,
          linkedinUrl: payload.linkedinUrl.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (data.error as string) ?? "We couldn't save this contact right now.",
        );
      }
      push({
        title: "Contact saved",
        description: "The target contact is now part of this workspace.",
        variant: "success",
      });
      setAddContactModalOpen(false);
      await mutate();
      router.refresh();
    } catch (err) {
      push({
        title: "Contact not saved",
        description:
          err instanceof Error ? err.message : "Please try again in a few moments.",
        variant: "destructive",
      });
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleGenerateWorkspaceFromModal = async ({
    company,
    companyWebsite,
    solution,
    researchTarget,
    researchWebsite,
  }: {
    company: string;
    companyWebsite: string;
    solution: string;
    researchTarget: string;
    researchWebsite: string;
  }) => {
    if (isGeneratingWorkspace) return;
    setIsGeneratingWorkspace(true);

    const payload = {
      salesRepCompany: company.trim(),
      salesRepWebsite: companyWebsite.trim(),
      solution: solution.trim(),
      targetCompany: researchTarget.trim(),
      targetWebsite: researchWebsite.trim(),
    };

    try {
      push({
        title: "Generating insights",
        description: `Starting AI generation for ${payload.targetCompany}.`,
      });
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "We couldn't start the generation for this company. Try again in a few moments.",
        );
      }

      if (data?.sessionId) {
        rememberSessionId(data.sessionId);
      }
      if (data?.workspace) {
        saveCachedWorkspace(data.workspace.sessionId, data.workspace);
      }

      push({
        title: "Workspace updated",
        description: `We're populating insights for ${payload.targetCompany}.`,
        variant: "success",
      });
      setAddCompanyModalOpen(false);
      await mutate();
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Please try again shortly.";
      push({
        title: "Generation failed",
        description: message,
        variant: "destructive",
      });
      throw new Error(message);
    } finally {
      setIsGeneratingWorkspace(false);
    }
  };

  const handleOpenTile = (tile: Tile) => {
    setSelectedTileId(tile.id);
  };

  const handleCloseTile = () => {
    setSelectedTileId(null);
  };

  const handleSubmitFollowUp = async (tileId: string, prompt: string) => {
    try {
      setIsChatting(true);
      const response = await fetch(`/api/workspace/tiles/${tileId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt }),
      });
      if (!response.ok) {
        if (response.status === 404) {
          push({
            title: "Session expired",
            description: "Return to the homepage to generate a new workspace.",
            variant: "destructive",
          });
          if (sessionId) {
            deleteCachedWorkspace(sessionId);
          }
          setLocalWorkspace(null);
          await mutate();
          return;
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to generate follow-up insight");
      }
      await mutate();
      push({
        title: "Follow-up insight added",
        variant: "success",
      });
    } catch (err) {
      push({
        title: "Follow-up failed",
        description:
          err instanceof Error ? err.message : "Please try again in a few moments.",
        variant: "destructive",
      });
    } finally {
      setIsChatting(false);
    }
  };

  const tileDetailModal = activeTile ? (
    <TileDetailModal
      tile={activeTile}
      onClose={handleCloseTile}
      onSubmit={(message) => handleSubmitFollowUp(activeTile.id, message)}
      isSubmitting={isChatting}
    />
  ) : null;

  if (workspaceError && !workspace) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f8] text-[#3a3a41]">
        <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-4 text-sm">
          {workspaceError.status === 404
            ? "Your workspace cache expired. Return to the homepage to generate a new set of insights."
            : "We couldn&apos;t load the workspace. Refresh the page and try again."}
        </div>
      </div>
    );
  }

  const workspaceLabel = "Insights Dashboard";
  const companyName = workspace?.company.name ?? "Workspace";

  return (
    <>
      <AdminShellAde
        background={null}
        sidebar={
          <AdminSidebarAde
            workspaceName={workspaceLabel}
            companyName={companyName}
            tilesCount={tiles.length}
            notesCount={notes.length}
            contactsCount={contacts.length}
            onAddCompany={() => setAddCompanyModalOpen(true)}
            onAddContact={() => setAddContactModalOpen(true)}
          />
        }
        header={
          <AdminHeaderAde
            workspaceName={workspaceLabel}
            companyName={companyName}
            isLoading={isLoading && !workspace}
            onRefresh={handleRefresh}
            onReset={handleResetWorkspace}
            isRefreshing={isRefreshing}
            isResetting={isResetting}
          />
        }
      >
        {cacheBanner}
        {isLoading && !workspace ? (
          <EmptyStateAde
            title="Loading insights"
            description="Rehydrating workspace data from the local cache."
          />
        ) : tiles.length === 0 ? (
          <EmptyStateAde
            title="Generating insights..."
            description="AI is creating tailored insights for your research target. This may take 1-2 minutes."
          />
        ) : (
          <TileGridAde
            tiles={tiles}
            onDeleteTile={handleDeleteTile}
            onReorderTiles={handleReorderTiles}
            onOpenTile={handleOpenTile}
            isReordering={isPersistingOrder}
          />
        )}

        <div className="space-y-10">
          <NotesPanelAde
            notes={notes}
            onNotesChanged={async () => {
              await mutate();
            }}
          />
          <ContactsPanelAde
            contacts={contacts}
            onContactsChanged={async () => {
              await mutate();
            }}
            onAddContact={() => setAddContactModalOpen(true)}
          />
          <FilesPlaceholderAde />
        </div>
        {tileDetailModal}
      </AdminShellAde>

      <AddContactModal
        open={isAddContactModalOpen}
        onClose={() => setAddContactModalOpen(false)}
        onSubmit={handleCreateContactFromModal}
        isSubmitting={isSavingContact}
      />
      <AddCompanyModal
        open={isAddCompanyModalOpen}
        onClose={() => setAddCompanyModalOpen(false)}
        onSubmit={handleGenerateWorkspaceFromModal}
        isSubmitting={isGeneratingWorkspace}
      />
    </>
  );
}

