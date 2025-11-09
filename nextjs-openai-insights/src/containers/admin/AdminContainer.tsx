"use client";

import { useMemo, useState, useTransition } from "react";
import useSWR from "swr";

import { useToast } from "@/lib/state/toast-context";
import type { Contact, Note, Tile, WorkspaceSnapshot } from "@/lib/types";
import { AdminShellClassic } from "@/components/admin/AdminShellClassic";
import { AdminHeaderClassic } from "@/components/admin/AdminHeaderClassic";
import { AdminSidebarClassic } from "@/components/admin/AdminSidebarClassic";
import { TileGrid } from "@/containers/admin/components/TileGrid";
import { NotesPanel } from "@/containers/admin/components/NotesPanel";
import { ContactsPanel } from "@/containers/admin/components/ContactsPanel";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilesPlaceholder } from "@/containers/admin/components/FilesPlaceholder";
import { useAdminTheme } from "@/lib/state/admin-theme-context";
import { AdminThemeSwitcher } from "@/components/admin/AdminThemeSwitcher";
import { AdminShellDash } from "@/components/admin/dash/AdminShellDash";
import { AdminHeaderDash } from "@/components/admin/dash/AdminHeaderDash";
import { AdminSidebarDash } from "@/components/admin/dash/AdminSidebarDash";
import { TileGridDash } from "@/containers/admin/dash/TileGridDash";
import { NotesPanelDash } from "@/containers/admin/dash/NotesPanelDash";
import { ContactsPanelDash } from "@/containers/admin/dash/ContactsPanelDash";
import { EmptyStateDash } from "@/components/ui/EmptyStateDash";
import { FilesPlaceholderDash } from "@/containers/admin/dash/FilesPlaceholderDash";
import { AdminShellAde } from "@/components/admin/ade/AdminShellAde";
import { AdminHeaderAde } from "@/components/admin/ade/AdminHeaderAde";
import { AdminSidebarAde } from "@/components/admin/ade/AdminSidebarAde";
import { TileGridAde } from "@/containers/admin/ade/TileGridAde";
import { NotesPanelAde } from "@/containers/admin/ade/NotesPanelAde";
import { ContactsPanelAde } from "@/containers/admin/ade/ContactsPanelAde";
import { EmptyStateAde } from "@/components/ui/EmptyStateAde";
import { FilesPlaceholderAde } from "@/containers/admin/ade/FilesPlaceholderAde";
import { TileDetailModal } from "@/components/ui/prompt-tiles/TileDetailModal";
import { resolveModel } from "@/lib/ai/settings";

type WorkspaceResponse = WorkspaceSnapshot;

export function AdminContainer() {
  const { data, error, isLoading, mutate } = useSWR<WorkspaceResponse>(
    "/api/workspace",
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
  const [isResetting, startReset] = useTransition();
  const [isRefreshing, startRefresh] = useTransition();
  const { isDash, isAde } = useAdminTheme();
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [isPersistingOrder, setIsPersistingOrder] = useState(false);
  const [isChatting, setIsChatting] = useState(false);

  const workspace = useMemo<WorkspaceResponse | null>(() => {
    if (!data) return null;
    return data;
  }, [data]);

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

  const handleResetWorkspace = () => {
    startReset(async () => {
      try {
        const response = await fetch("/api/workspace", { method: "DELETE" });
        if (!response.ok) {
          throw new Error("Failed to reset the workspace");
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

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f8] text-[#3a3a41]">
        <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-4 text-sm">
          We couldn&apos;t load the workspace. Refresh the page and try again.
        </div>
      </div>
    );
  }

  const workspaceLabel = "Insights Dashboard";
  const companyName = workspace?.company.name ?? "Workspace";
  const companyWebsite = workspace?.company.website ?? "";

  const headerSwitcher = <AdminThemeSwitcher />;

  if (isAde) {
    return (
      <AdminShellAde
        background={null}
        sidebar={
          <AdminSidebarAde
            workspaceName={workspaceLabel}
            companyName={companyName}
            tilesCount={tiles.length}
            notesCount={notes.length}
            contactsCount={contacts.length}
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
            actionSlot={headerSwitcher}
          />
        }
      >
        {isLoading && !workspace ? (
          <EmptyStateAde
            title="Loading insights"
            description="Retrieving workspace data from the browser cookie."
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
          />
          <FilesPlaceholderAde />
        </div>
        {tileDetailModal}
      </AdminShellAde>
    );
  }

  if (isDash) {
    return (
      <AdminShellDash
        sidebar={
          <AdminSidebarDash
            companyName={companyName}
            tilesCount={tiles.length}
            notesCount={notes.length}
            contactsCount={contacts.length}
          />
        }
        header={
          <AdminHeaderDash
            companyName={companyName}
            companyWebsite={companyWebsite}
            onRefresh={handleRefresh}
            onReset={handleResetWorkspace}
            isRefreshing={isRefreshing}
            isResetting={isResetting}
            actionSlot={headerSwitcher}
          />
        }
      >
        {isLoading && !workspace ? (
          <EmptyStateDash
            title="Loading insights"
            description="Retrieving workspace data from the browser cookie."
          />
        ) : tiles.length === 0 ? (
          <EmptyStateDash
            title="Generating insights..."
            description="AI is creating tailored insights for your research target. This may take 1-2 minutes."
          />
        ) : (
          <TileGridDash
            tiles={tiles}
            onDeleteTile={handleDeleteTile}
            onReorderTiles={handleReorderTiles}
            onOpenTile={handleOpenTile}
            isReordering={isPersistingOrder}
          />
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <NotesPanelDash
            notes={notes}
            onNotesChanged={async () => {
              await mutate();
            }}
          />
          <ContactsPanelDash
            contacts={contacts}
            onContactsChanged={async () => {
              await mutate();
            }}
          />
        </div>

        <FilesPlaceholderDash />
        {tileDetailModal}
      </AdminShellDash>
    );
  }

  // classic
  return (
    <AdminShellClassic
      sidebar={
        <AdminSidebarClassic
          companyName={companyName}
          tilesCount={tiles.length}
          notesCount={notes.length}
          contactsCount={contacts.length}
        />
      }
      header={
        <AdminHeaderClassic
          workspaceName={workspaceLabel}
          companyName={companyName}
          companyWebsite={companyWebsite}
          onRefresh={handleRefresh}
          onReset={handleResetWorkspace}
          isRefreshing={isRefreshing}
          isResetting={isResetting}
          actionSlot={headerSwitcher}
        />
      }
    >
      <div className="space-y-10">
        <div className="grid gap-4 lg:hidden">
          <MobileMetric label="Insights" value={tiles.length} hint="Tiles generated" />
          <MobileMetric label="Notes" value={notes.length} hint="Saved notes" />
          <MobileMetric
            label="Contacts"
            value={contacts.length}
            hint="Key people catalogued"
          />
        </div>

        {isLoading && !workspace ? (
          <EmptyState
            title="Loading insights"
            description="Retrieving workspace data from the browser cookie."
          />
        ) : tiles.length === 0 ? (
          <EmptyState
            title="Generating insights..."
            description="AI is creating tailored insights for your research target. This may take 1-2 minutes."
          />
        ) : (
          <TileGrid
            tiles={tiles}
            onDeleteTile={handleDeleteTile}
            onReorderTiles={handleReorderTiles}
            onOpenTile={handleOpenTile}
            isReordering={isPersistingOrder}
          />
        )}

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="grid gap-8 md:grid-cols-2">
            <NotesPanel
              notes={notes}
              onNotesChanged={async () => {
                await mutate();
              }}
            />
            <ContactsPanel
              contacts={contacts}
              onContactsChanged={async () => {
                await mutate();
              }}
            />
          </div>
          <FilesPlaceholder />
        </div>
      </div>
      {tileDetailModal}
    </AdminShellClassic>
  );
}

interface MobileMetricProps {
  label: string;
  value: number;
  hint: string;
}

function MobileMetric({ label, value, hint }: MobileMetricProps) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
          {label}
        </p>
        <p className="text-sm text-slate-500">{hint}</p>
      </div>
      <span className="text-2xl font-semibold text-slate-900">{value}</span>
    </div>
  );
}

