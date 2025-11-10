"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";

import { useToast } from "@/lib/state/toast-context";
import type {
  Contact,
  Note,
  Tile,
  TileChatAttachment,
  WorkspaceSnapshot,
} from "@/lib/types";
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
import { ContactDetailModal } from "@/components/admin/ade/ContactDetailModal";
import { resolveModel } from "@/lib/ai/settings";
import {
  deleteWorkspace as deleteCachedWorkspace,
  getLastSessionId,
  loadWorkspace as loadCachedWorkspace,
  saveWorkspace as saveCachedWorkspace,
  rememberSessionId,
  listStoredWorkspaces,
} from "@/lib/storage/workspace-browser";
import { useAdminTheme } from "@/lib/state/admin-theme-context";

type WorkspaceResponse = WorkspaceSnapshot;
type WorkspaceFetcherError = Error & { status?: number; data?: unknown };
type TileChatPayload = {
  message: string;
  attachments?: TileChatAttachment[];
};

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
  const { theme } = useAdminTheme();
  const [isResetting, startReset] = useTransition();
  const [isRefreshing, startRefresh] = useTransition();
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [isPersistingOrder, setIsPersistingOrder] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [localWorkspace, setLocalWorkspace] = useState<WorkspaceSnapshot | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
  const [storedWorkspaces, setStoredWorkspaces] = useState<
    Array<{ sessionId: string; snapshot: WorkspaceSnapshot }>
  >([]);
  const [isAddContactModalOpen, setAddContactModalOpen] = useState(false);
  const [isAddCompanyModalOpen, setAddCompanyModalOpen] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isGeneratingWorkspace, setIsGeneratingWorkspace] = useState(false);
  const [regeneratingTileIds, setRegeneratingTileIds] = useState<Set<string>>(new Set());
  const [regeneratingContactId, setRegeneratingContactId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const workspaceError = error as WorkspaceFetcherError | undefined;
  const cacheWarningShownRef = useRef(false);

  const refreshStoredWorkspaces = useCallback(() => {
    const entries = listStoredWorkspaces();
    setStoredWorkspaces(entries);
  }, []);

  useEffect(() => {
    refreshStoredWorkspaces();
    const lastSession = getLastSessionId();
    if (!lastSession) return;
    const cached = loadCachedWorkspace(lastSession);
    if (cached) {
      setSessionId(lastSession);
      setLocalWorkspace(cached);
      setViewingSessionId(lastSession);
    }
  }, [refreshStoredWorkspaces]);

  useEffect(() => {
    if (!data) return;
    setSessionId(data.sessionId);
    setLocalWorkspace(data);
    saveCachedWorkspace(data.sessionId, data);
    refreshStoredWorkspaces();
    setViewingSessionId((current) => current ?? data.sessionId);
    cacheWarningShownRef.current = false;
  }, [data, refreshStoredWorkspaces]);

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
    if (viewingSessionId) {
      if (data && data.sessionId === viewingSessionId) {
        return data;
      }
      if (localWorkspace && localWorkspace.sessionId === viewingSessionId) {
        return localWorkspace;
      }
      const stored = storedWorkspaces.find(
        (entry) => entry.sessionId === viewingSessionId
      );
      if (stored) {
        return stored.snapshot;
      }
    }
    return data ?? localWorkspace;
  }, [data, localWorkspace, storedWorkspaces, viewingSessionId]);

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

  const notes: Note[] = useMemo(
    () => workspace?.company.notes ?? [],
    [workspace?.company.notes],
  );
  const contacts: Contact[] = useMemo(
    () => workspace?.company.contacts ?? [],
    [workspace?.company.contacts],
  );
  const activeContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) ?? null,
    [contacts, selectedContactId],
  );

  useEffect(() => {
    if (selectedContactId && !contacts.some((contact) => contact.id === selectedContactId)) {
      setSelectedContactId(null);
    }
  }, [contacts, selectedContactId]);
  const companyOptions = useMemo(() => {
    const map = new Map<string, WorkspaceSnapshot>();
    storedWorkspaces.forEach(({ sessionId, snapshot }) => {
      map.set(sessionId, snapshot);
    });
    if (data) {
      map.set(data.sessionId, data);
    }
    if (localWorkspace) {
      map.set(localWorkspace.sessionId, localWorkspace);
    }
    const entries = Array.from(map.entries()).map(([session, snapshot]) => {
      const generatedAt = snapshot.generatedAt ?? snapshot.company?.tiles?.[0]?.createdAt ?? "";
      const isActive = viewingSessionId
        ? viewingSessionId === session
        : data
        ? data.sessionId === session
        : localWorkspace?.sessionId === session;
      return {
        sessionId: session,
        name: snapshot.company.name || "Workspace",
        generatedAt,
        tilesCount: snapshot.company.tiles?.length ?? 0,
        notesCount: snapshot.company.notes?.length ?? 0,
        contactsCount: snapshot.company.contacts?.length ?? 0,
        isActive,
      };
    });
    return entries.sort((a, b) => {
      const aTime = a.generatedAt ? Date.parse(a.generatedAt) : 0;
      const bTime = b.generatedAt ? Date.parse(b.generatedAt) : 0;
      return bTime - aTime;
    });
  }, [storedWorkspaces, data, localWorkspace, viewingSessionId]);
  const isViewingServerWorkspace = useMemo(() => {
    if (!data) return false;
    if (!viewingSessionId) return true;
    return viewingSessionId === data.sessionId;
  }, [data, viewingSessionId]);
  const cacheBanner =
    workspaceError?.status === 404 && workspace ? (
      <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Workspace cache expired on the server. You&apos;re viewing the last saved copy. Generate a new workspace from the landing page to refresh it.
      </div>
    ) : null;

  const handleSelectWorkspace = useCallback(
    (nextSessionId: string) => {
      if (nextSessionId === viewingSessionId) return;
      if (data && data.sessionId === nextSessionId) {
        setViewingSessionId(nextSessionId);
        setLocalWorkspace(data);
        rememberSessionId(nextSessionId);
        return;
      }
      const cached = loadCachedWorkspace(nextSessionId);
      if (cached) {
        setLocalWorkspace(cached);
        setViewingSessionId(nextSessionId);
        setSessionId(nextSessionId);
        rememberSessionId(nextSessionId);
        return;
      }
      push({
        title: "Workspace unavailable",
        description:
          "We couldn't find that workspace locally. Generate it again from the landing page.",
        variant: "destructive",
      });
    },
    [data, push, viewingSessionId],
  );

  const handleResetWorkspace = () => {
    if (!isViewingServerWorkspace) {
      push({
        title: "Switch to active workspace",
        description: "Reset is only available for the most recently generated workspace.",
        variant: "destructive",
      });
      return;
    }
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
          setViewingSessionId(payload.workspace.sessionId);
        } else {
          setLocalWorkspace(null);
          setViewingSessionId(null);
        }
        await mutate();
        refreshStoredWorkspaces();
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
    if (!isViewingServerWorkspace) {
      push({
        title: "Switch to latest workspace",
        description: "Refresh only works for the most recently generated workspace.",
        variant: "destructive",
      });
      return;
    }
    startRefresh(async () => {
      await mutate();
      refreshStoredWorkspaces();
    });
  };

  const handleDeleteTile = async (tileId: string) => {
    if (!isViewingServerWorkspace) {
      push({
        title: "Switch to latest workspace",
        description: "Delete tiles on the most recently generated workspace.",
        variant: "destructive",
      });
      return;
    }
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
      refreshStoredWorkspaces();
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
    if (!isViewingServerWorkspace) {
      push({
        title: "Switch to latest workspace",
        description: "Reorder tiles on the most recently generated workspace.",
        variant: "destructive",
      });
      return;
    }
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
      refreshStoredWorkspaces();
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

  const handleRegenerateTile = async (tileId: string) => {
    if (!isViewingServerWorkspace) {
      push({
        title: "Switch to latest workspace",
        description: "Regenerate insights on the most recently generated workspace.",
        variant: "destructive",
      });
      return;
    }
    setRegeneratingTileIds((prev) => {
      const next = new Set(prev);
      next.add(tileId);
      return next;
    });
    try {
      const response = await fetch(`/api/workspace/tiles/${tileId}/regenerate`, {
        method: "POST",
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          (payload.error as string) ?? "We couldn't regenerate this insight right now.",
        );
      }
      await mutate();
      refreshStoredWorkspaces();
    } catch (err) {
      push({
        title: "Regeneration failed",
        description:
          err instanceof Error ? err.message : "Please try again shortly.",
        variant: "destructive",
      });
    } finally {
      setRegeneratingTileIds((prev) => {
        const next = new Set(prev);
        next.delete(tileId);
        return next;
      });
    }
  };

  const handleCreateContactFromModal = async (payload: {
    name: string;
    jobTitle: string;
    linkedinUrl: string;
  }) => {
    if (isSavingContact) return;
    if (!isViewingServerWorkspace) {
      push({
        title: "Switch to latest workspace",
        description: "Add contacts on the most recently generated workspace.",
        variant: "destructive",
      });
      return;
    }
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
      const data = await response.json().catch(() => null);
      push({
        title: "Contact saved",
        description: "The target contact is now part of this workspace.",
        variant: "success",
      });
      setAddContactModalOpen(false);
      if (data?.contact?.id) {
        setSelectedContactId(data.contact.id);
      }
      await mutate();
      router.refresh();
      refreshStoredWorkspaces();
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
        setLocalWorkspace(data.workspace);
        setViewingSessionId(data.workspace.sessionId);
        setSessionId(data.workspace.sessionId);
      }

      push({
        title: "Workspace updated",
        description: `We're populating insights for ${payload.targetCompany}.`,
        variant: "success",
      });
      setAddCompanyModalOpen(false);
      await mutate();
      router.refresh();
      refreshStoredWorkspaces();
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

  const handleOpenContactCard = (contact: Contact) => {
    setSelectedContactId(contact.id);
  };

  const handleCloseContactModal = () => {
    setSelectedContactId(null);
  };

  const handleSubmitFollowUp = async (
    tileId: string,
    payload: TileChatPayload,
  ) => {
    if (!isViewingServerWorkspace) {
      push({
        title: "Switch to latest workspace",
        description: "Continue the AI conversation on the most recent workspace.",
        variant: "destructive",
      });
      return;
    }

    const trimmedMessage = payload.message.trim();
    if (!trimmedMessage) return;

    const attachments = payload.attachments ?? [];
    const formattedMessage =
      attachments.length === 0
        ? trimmedMessage
        : `${trimmedMessage}\n\nAttachments:\n${attachments
            .map((attachment) =>
              attachment.url
                ? `- ${attachment.name} → ${attachment.url}`
                : `- ${attachment.name}`,
            )
            .join("\n")}`;

    try {
      setIsChatting(true);
      const response = await fetch(`/api/workspace/tiles/${tileId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: formattedMessage, attachments }),
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
      refreshStoredWorkspaces();
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

  const handleRegenerateContact = async (contactId: string) => {
    if (!isViewingServerWorkspace) {
      push({
        title: "Switch to latest workspace",
        description: "Regenerate contacts on the most recent workspace.",
        variant: "destructive",
      });
      return;
    }

    setRegeneratingContactId(contactId);
    try {
      const response = await fetch(
        `/api/workspace/contacts/${contactId}/regenerate`,
        { method: "POST" },
      );
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
        throw new Error(
          (data.error as string) ?? "We couldn't refresh this contact now.",
        );
      }
      await mutate();
      router.refresh();
      refreshStoredWorkspaces();
      push({
        title: "Contact updated",
        description: "Outreach insights regenerated for this contact.",
        variant: "success",
      });
    } catch (error) {
      push({
        title: "Regeneration failed",
        description:
          error instanceof Error ? error.message : "Try again in a few moments.",
        variant: "destructive",
      });
    } finally {
      setRegeneratingContactId(null);
    }
  };

  const tileDetailModal = activeTile ? (
    <TileDetailModal
      tile={activeTile}
      onClose={handleCloseTile}
      onSubmit={(payload) => handleSubmitFollowUp(activeTile.id, payload)}
      isSubmitting={isChatting}
      theme={theme}
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
            companies={companyOptions}
            onSelectCompany={handleSelectWorkspace}
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
            onRegenerateTile={handleRegenerateTile}
            regeneratingTileIds={Array.from(regeneratingTileIds)}
          />
        )}

        <div className="space-y-12">
          <ContactsPanelAde
            contacts={contacts}
            onContactsChanged={async () => {
              await mutate();
              refreshStoredWorkspaces();
            }}
            onAddContact={() => setAddContactModalOpen(true)}
            onRegenerateContact={handleRegenerateContact}
            regeneratingContactId={regeneratingContactId}
            onOpenContact={handleOpenContactCard}
          />
          <NotesPanelAde
            notes={notes}
            onNotesChanged={async () => {
              await mutate();
              refreshStoredWorkspaces();
            }}
          />
          <FilesPlaceholderAde />
        </div>
        {tileDetailModal}
        {activeContact ? (
          <ContactDetailModal
            contact={activeContact}
            onClose={handleCloseContactModal}
            onRegenerate={() => handleRegenerateContact(activeContact.id)}
            isRegenerating={regeneratingContactId === activeContact.id}
          />
        ) : null}
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

