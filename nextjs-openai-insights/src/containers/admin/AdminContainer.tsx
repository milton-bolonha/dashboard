"use client";

import { useMemo, useTransition } from "react";
import useSWR from "swr";

import { useToast } from "@/lib/state/toast-context";
import type { Contact, Note, Tile, WorkspaceSnapshot } from "@/lib/types";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TileGrid } from "@/containers/admin/components/TileGrid";
import { NotesPanel } from "@/containers/admin/components/NotesPanel";
import { ContactsPanel } from "@/containers/admin/components/ContactsPanel";
import { EmptyState } from "@/components/ui/EmptyState";

type WorkspaceResponse = WorkspaceSnapshot;

export function AdminContainer() {
  const { data, error, isLoading, mutate } = useSWR<WorkspaceResponse>(
    "/api/workspace",
  );
  const { push } = useToast();
  const [isResetting, startReset] = useTransition();
  const [isRefreshing, startRefresh] = useTransition();

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
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-200">
        <div className="rounded-2xl border border-red-500/40 bg-red-950/40 px-6 py-4 text-sm">
          Ocorreu um erro ao carregar o workspace. Recarregue e tente novamente.
        </div>
      </div>
    );
  }

  const companyName = workspace?.company.name ?? "Workspace";
  const companyWebsite = workspace?.company.website ?? "";

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <AppHeader
        companyName={companyName}
        companyWebsite={companyWebsite}
        isResetting={isResetting}
        onReset={handleResetWorkspace}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      <div className="flex flex-1 flex-col gap-8 px-6 pb-16 pt-8 lg:flex-row">
        <AppSidebar
          companyName={companyName}
          companyWebsite={companyWebsite}
          tilesCount={tiles.length}
          notesCount={notes.length}
          contactsCount={contacts.length}
        />

        <main className="flex flex-1 flex-col gap-10">
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
        </main>
      </div>
    </div>
  );
}

