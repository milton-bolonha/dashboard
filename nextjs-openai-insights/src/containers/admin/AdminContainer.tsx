"use client";

import { useMemo, useTransition } from "react";
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

type WorkspaceResponse = WorkspaceSnapshot;

export function AdminContainer() {
  const { data, error, isLoading, mutate } = useSWR<WorkspaceResponse>(
    "/api/workspace",
  );
  const { push } = useToast();
  const [isResetting, startReset] = useTransition();
  const [isRefreshing, startRefresh] = useTransition();
  const { isDash, isAde } = useAdminTheme();

  const workspace = useMemo<WorkspaceResponse | null>(() => {
    if (!data) return null;
    return data;
  }, [data]);

  const tiles: Tile[] = useMemo(() => {
    if (!workspace) return [];
    return [...workspace.company.tiles].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [workspace]);

  const notes: Note[] = workspace?.company.notes ?? [];
  const contacts: Contact[] = workspace?.company.contacts ?? [];

  const handleResetWorkspace = () => {
    startReset(async () => {
      try {
        const response = await fetch("/api/workspace", { method: "DELETE" });
        if (!response.ok) {
          throw new Error("Não foi possível limpar o workspace");
        }
        await mutate();
        push({
          title: "Workspace limpo",
          description: "Volte para a home para gerar novos insights.",
        });
      } catch (err) {
        push({
          title: "Erro ao resetar",
          description:
            err instanceof Error ? err.message : "Tente novamente em instantes.",
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
        throw new Error("Falha ao remover tile");
      }
      await mutate();
      push({
        title: "Tile removido",
        variant: "success",
      });
    } catch (err) {
      push({
        title: "Erro ao remover tile",
        description:
          err instanceof Error ? err.message : "Tente novamente em instantes.",
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f8] text-[#3a3a41]">
        <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-4 text-sm">
          Ocorreu um erro ao carregar o workspace. Recarregue e tente novamente.
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
            title="Carregando insights"
            description="Buscando informações salvas no cookie."
          />
        ) : tiles.length === 0 ? (
          <EmptyStateAde
            title="Nenhum insight ainda"
            description="Gere um conjunto pela home para preencher este painel."
          />
        ) : (
          <TileGridAde tiles={tiles} onDeleteTile={handleDeleteTile} />
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
            title="Carregando insights"
            description="Buscando informações salvas no cookie."
          />
        ) : tiles.length === 0 ? (
          <EmptyStateDash
            title="Nenhum insight ainda"
            description="Gere um conjunto pela home para preencher este painel."
          />
        ) : (
          <TileGridDash tiles={tiles} onDeleteTile={handleDeleteTile} />
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
          <MobileMetric label="Insights" value={tiles.length} hint="Tiles gerados" />
          <MobileMetric label="Notas" value={notes.length} hint="Anotações salvas" />
          <MobileMetric
            label="Contatos"
            value={contacts.length}
            hint="Pessoas-chave mapeadas"
          />
        </div>

        {isLoading && !workspace ? (
          <EmptyState
            title="Carregando insights"
            description="Buscando informações salvas no cookie."
          />
        ) : tiles.length === 0 ? (
          <EmptyState
            title="Nenhum insight ainda"
            description="Gere um conjunto pela home e volte para revisar aqui."
          />
        ) : (
          <TileGrid tiles={tiles} onDeleteTile={handleDeleteTile} />
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

