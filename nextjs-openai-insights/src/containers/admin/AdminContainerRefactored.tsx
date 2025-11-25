"use client";

import { useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/lib/state/toast-context";
import { useTileStreaming } from "@/lib/hooks/useTileStreaming";
import { workspaceService } from "@/lib/services";
import type { Tile, WorkspaceSnapshot } from "@/lib/types";
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
import { AddPromptModal } from "@/components/admin/ade/AddPromptModal";
import { BulkUploadModal } from "@/components/admin/ade/BulkUploadModal";
import { CreateBlankDashboardModal } from "@/components/admin/ade/CreateBlankDashboardModal";
import { UpgradeModal } from "@/components/ui/UpgradeModal";
import { PaymentEmailModal } from "@/components/ui/PaymentEmailModal";
import { useAdminTheme } from "@/lib/state/admin-theme-context";
import { cleanupDuplicateCompanies } from "@/lib/storage/dashboards-store";

// Import all custom hooks
import {
  useModalState,
  useAppearanceManagement,
  usePaymentFlow,
  useTileOperations,
  useContactOperations,
  useNoteOperations,
  useDashboardManagement,
  useWorkspaceManagement,
} from "@/containers/admin/hooks";

/**
 * AdminContainer - Refactored
 *
 * This container orchestrates all admin functionality using custom hooks.
 * Logic has been extracted to:
 * - Services (API layer)
 * - Custom hooks (state management)
 * - This container (orchestration only)
 */
export function AdminContainer() {
  const router = useRouter();
  const { push } = useToast();
  const { theme } = useAdminTheme();

  // Shared ref for dashboard updates (prevents race conditions)
  const isUpdatingDashboardRef = useRef(false);

  // Debug function to cleanup duplicate companies
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).cleanupDuplicateCompanies = cleanupDuplicateCompanies;
      console.log(
        "💡 Debug function available: window.cleanupDuplicateCompanies()"
      );
    }
  }, []);

  // Initialize hooks in dependency order
  // 1. Dashboard management (loads existing companies)
  const dashboard = useDashboardManagement();

  // 2. Workspace management (needs dashboard refs for sync)
  const workspace = useWorkspaceManagement(
    dashboard.currentCompany,
    dashboard.currentDashboard,
    isUpdatingDashboardRef
  );

  // 3. Force dashboard sync when workspace is available
  useEffect(() => {
    if (workspace.workspace && !dashboard.currentCompany) {
      console.log("🔄 Syncing workspace to dashboard:", {
        sessionId: workspace.workspace.sessionId,
        hasTiles: workspace.workspace.company?.tiles?.length || 0,
        companyName: workspace.workspace.company?.name,
      });
      // Force refresh to pick up new workspace
      dashboard.refreshCompanies();
    }
  }, [workspace.workspace, dashboard.currentCompany]);

  // Debug logging
  useEffect(() => {
    console.log("📊 AdminContainer state:", {
      hasWorkspace: !!workspace.workspace,
      hasCompany: !!dashboard.currentCompany,
      hasDashboard: !!dashboard.currentDashboard,
      workspaceSessionId: workspace.workspace?.sessionId,
      companyId: dashboard.currentCompany?.id,
      dashboardId: dashboard.currentDashboard?.id,
    });
  }, [
    workspace.workspace,
    dashboard.currentCompany,
    dashboard.currentDashboard,
  ]);

  // 3. Operation hooks (need dashboard and workspace)
  const tiles = useTileOperations(
    dashboard.currentCompany,
    dashboard.currentDashboard,
    workspace.refreshWorkspace
  );

  const contacts = useContactOperations(
    dashboard.currentCompany,
    dashboard.currentDashboard,
    workspace.refreshWorkspace
  );

  const notes = useNoteOperations(
    dashboard.currentCompany,
    dashboard.currentDashboard,
    workspace.refreshWorkspace
  );

  // 4. UI hooks
  const appearance = useAppearanceManagement(dashboard.currentDashboard);
  const modals = useModalState();
  const payment = usePaymentFlow();

  // 6. Streaming (existing logic)
  const streaming = useTileStreaming({
    salesRepCompany: workspace.workspace?.company?.name || "",
    salesRepWebsite: workspace.workspace?.company?.website || "",
    solution: workspace.workspace?.promptSettings?.sellingSolutionsFor || "",
    targetCompany: workspace.workspace?.promptSettings?.target || "",
    targetWebsite: workspace.workspace?.promptSettings?.targetWebsite || "",
    templateId: workspace.workspace?.promptSettings?.templateId || "",
    model: workspace.workspace?.promptSettings?.model,
    promptAgent: workspace.workspace?.promptSettings?.promptAgent,
    responseLength: workspace.workspace?.promptSettings?.responseLength,
    promptVariables: workspace.workspace?.promptSettings?.promptVariables,
    bulkPrompts: workspace.workspace?.promptSettings?.bulkPrompts,
    onTileGenerated: useCallback(
      (tile: Tile, index: number) => {
        if (dashboard.currentCompany && dashboard.currentDashboard) {
          const existingTiles = dashboard.currentDashboard.tiles || [];
          const updatedTiles = [...existingTiles];
          updatedTiles[index] = tile;
          dashboard.updateDashboard(dashboard.currentDashboard.id, {
            tiles: updatedTiles,
          });
        }
      },
      [dashboard]
    ),
    onCompleted: useCallback(
      (completedWorkspace: WorkspaceSnapshot, sessionId: string) => {
        workspace.refreshWorkspace();
        workspace.refreshStoredWorkspaces();
        push({
          title: "Generation complete!",
          description: `${completedWorkspace.company.tiles.length} tiles generated`,
          variant: "success",
        });
      },
      [workspace, push]
    ),
    onError: useCallback(
      (error: string) => {
        push({
          title: "Generation failed",
          description: error,
          variant: "destructive",
        });
      },
      [push]
    ),
  });

  // Determine what to show
  const isLoading = workspace.isLoading;
  const hasWorkspace = !!workspace.workspace;
  const hasDashboard = !!dashboard.currentDashboard;
  const hasTiles = tiles.tiles.length > 0;
  const hasContacts = contacts.contacts.length > 0;
  const hasNotes = notes.notes.length > 0;

  return (
    <>
      <AdminShellAde
        appearance={appearance.appearanceTokens}
        sidebar={
          <AdminSidebarAde
            appearance={appearance.appearanceTokens}
            workspaceName={workspace.workspace?.company?.name || "Workspace"}
            companies={dashboard.companies.map((company) => ({
              id: company.id,
              name: company.name,
              sessionId: "", // TODO: Add session tracking
              tilesCount:
                company.dashboards?.reduce(
                  (sum, d) => sum + (d.tiles?.length || 0),
                  0
                ) || 0,
              notesCount: 0, // TODO: Add notes count
              contactsCount: 0, // TODO: Add contacts count
              isActive: company.id === dashboard.currentCompany?.id,
            }))}
            onSelectCompany={(companyId) => {
              // TODO: Implement company selection
              console.log("Select company:", companyId);
            }}
            onAddCompany={() => modals.openAddCompany()}
            onAddContact={() => modals.openAddContact()}
          />
        }
        header={
          <AdminHeaderAde
            appearance={appearance.appearanceTokens}
            workspaceName={workspace.workspace?.company?.name}
            companyName={dashboard.currentCompany?.name}
            companyId={dashboard.currentCompany?.id}
            currentDashboardId={dashboard.currentDashboard?.id}
            dashboards={dashboard.currentCompany?.dashboards?.map((d) => ({
              id: d.id,
              name: d.name,
              isActive: d.id === dashboard.currentDashboard?.id,
            }))}
            onCreateBlankDashboard={() => modals.openCreateBlankDashboard()}
            onSelectDashboard={dashboard.setActiveDashboard}
            onDeleteDashboard={dashboard.deleteDashboard}
          />
        }
      >
        {isLoading ? (
          <EmptyStateAde
            title="Loading workspace..."
            description="Please wait while we load your data."
          />
        ) : !hasWorkspace ? (
          <EmptyStateAde
            title="No workspace found"
            description="Generate a new workspace from the home page."
          />
        ) : !hasDashboard ? (
          <EmptyStateAde
            title="No dashboard selected"
            description="Select or create a dashboard to get started."
          />
        ) : (
          <>
            {/* Main content area */}
            <div className="flex-1 overflow-auto">
              {hasTiles ? (
                <TileGridAde
                  tiles={tiles.tiles}
                  appearance={appearance.appearanceTokens}
                  onOpenTile={modals.openTileDetail}
                  onDeleteTile={tiles.deleteTile}
                  onReorderTiles={tiles.reorderTiles}
                  isReordering={tiles.isPersistingOrder}
                  onRegenerateTile={tiles.regenerateTile}
                  regeneratingTileIds={Array.from(tiles.regeneratingIds)}
                />
              ) : (
                <EmptyStateAde
                  title="No insights yet"
                  description="Add a prompt to generate your first insight."
                />
              )}
            </div>

            {/* Side panels */}
            {hasContacts && (
              <ContactsPanelAde
                appearance={appearance.appearanceTokens}
                contacts={contacts.contacts}
                onOpenContact={modals.openContactDetail}
                onRegenerateContact={contacts.regenerateContact}
                regeneratingContactId={contacts.regeneratingId}
                onAddContact={() => modals.openAddContact()}
                onContactsChanged={async () => {
                  await workspace.refreshWorkspace();
                }}
              />
            )}

            {hasNotes && (
              <NotesPanelAde
                appearance={appearance.appearanceTokens}
                notes={notes.notes}
                onNotesChanged={async () => {
                  workspace.refreshWorkspace();
                }}
              />
            )}

            {/* Files placeholder */}
            <FilesPlaceholderAde appearance={appearance.appearanceTokens} />
          </>
        )}
      </AdminShellAde>

      {/* Modals */}
      {modals.selectedTile && (
        <TileDetailModal
          tile={modals.selectedTile}
          onClose={modals.closeTileDetail}
          onSubmit={(payload) =>
            tiles.chatWithTile(modals.selectedTile!.id, payload)
          }
          isSubmitting={tiles.isChatting}
          theme={theme}
          isGuest={payment.isGuest}
        />
      )}

      {modals.selectedContact && (
        <ContactDetailModal
          contact={modals.selectedContact}
          onClose={modals.closeContactDetail}
          onRegenerate={() => {
            if (payment.ensureAllowance("createContact")) {
              contacts.regenerateContact(modals.selectedContact!.id);
              payment.commitUsage("createContact");
            }
          }}
          isRegenerating={
            contacts.regeneratingId === modals.selectedContact?.id
          }
          onSubmitChat={(message) => {
            if (payment.ensureAllowance("createContact")) {
              contacts.chatWithContact(modals.selectedContact!.id, message);
              payment.commitUsage("createContact");
            }
          }}
          isChatting={contacts.isChatting}
        />
      )}

      {modals.isAddContactOpen && (
        <AddContactModal
          open={modals.isAddContactOpen}
          onClose={modals.closeAddContact}
          onSubmit={async (payload) => {
            if (payment.ensureAllowance("createContact")) {
              await contacts.createContact(payload);
              payment.commitUsage("createContact");
              modals.closeAddContact();
            }
          }}
          isSubmitting={contacts.isCreating}
        />
      )}

      {modals.isAddCompanyOpen && (
        <AddCompanyModal
          open={modals.isAddCompanyOpen}
          onClose={modals.closeAddCompany}
          onSubmit={async (payload) => {
            try {
              if (payment.ensureAllowance("createWorkspace")) {
                // Generate new workspace with company data
                await workspaceService.generateWorkspace({
                  salesRepCompany: payload.company,
                  salesRepWebsite: payload.companyWebsite,
                  solution: payload.solution,
                  targetCompany: payload.researchTarget,
                  targetWebsite: payload.researchWebsite,
                });
                payment.commitUsage("createWorkspace");
                workspace.refreshWorkspace();
                workspace.refreshStoredWorkspaces();
                push({
                  title: "Company workspace generated!",
                  description: `Created workspace for ${payload.company}`,
                  variant: "success",
                });
              }
            } catch (error) {
              push({
                title: "Failed to generate company workspace",
                description:
                  error instanceof Error ? error.message : "Please try again",
                variant: "destructive",
              });
            }
            modals.closeAddCompany();
          }}
        />
      )}

      {modals.isAddPromptOpen && (
        <AddPromptModal
          open={modals.isAddPromptOpen}
          onClose={modals.closeAddPrompt}
          onAddPrompt={async (payload) => {
            try {
              if (payment.ensureAllowance("regenerate")) {
                // Start streaming a new tile with the custom prompt
                streaming.startStreaming();
                payment.commitUsage("regenerate");
                push({
                  title: "Generating insight...",
                  description: `Creating "${payload.title}"`,
                  variant: "success",
                });
              }
            } catch (error) {
              push({
                title: "Failed to add prompt",
                description:
                  error instanceof Error ? error.message : "Please try again",
                variant: "destructive",
              });
            }
            modals.closeAddPrompt();
          }}
        />
      )}

      {modals.isBulkUploadOpen && (
        <BulkUploadModal
          open={modals.isBulkUploadOpen}
          onClose={modals.closeBulkUpload}
          onBulkUpload={async (file) => {
            try {
              if (payment.ensureAllowance("createContact")) {
                // TODO: Implement bulk upload processing
                // For now, just show a message
                push({
                  title: "Bulk upload started",
                  description: `Processing ${file.name}`,
                  variant: "success",
                });
                payment.commitUsage("createContact");
              }
            } catch (error) {
              push({
                title: "Bulk upload failed",
                description:
                  error instanceof Error ? error.message : "Please try again",
                variant: "destructive",
              });
            }
            modals.closeBulkUpload();
          }}
        />
      )}

      {modals.isCreateBlankDashboardOpen && (
        <CreateBlankDashboardModal
          open={modals.isCreateBlankDashboardOpen}
          onClose={modals.closeCreateBlankDashboard}
          onSubmit={async (payload) => {
            if (dashboard.currentCompany) {
              await dashboard.createDashboard(payload.dashboardName);
              modals.closeCreateBlankDashboard();
            }
          }}
        />
      )}

      {payment.isUpgradeModalOpen && (
        <UpgradeModal
          open={payment.isUpgradeModalOpen}
          onClose={() => payment.setUpgradeModalOpen(false)}
          onCheckout={payment.startCheckout}
          onMarkMember={payment.confirmMembership}
          stripeCheckoutUrl={payment.stripeCheckoutUrl}
          usage={payment.usage}
          limits={payment.limits}
          lastAction={payment.upgradeReason}
        />
      )}

      {payment.isPaymentEmailModalOpen && (
        <PaymentEmailModal
          open={payment.isPaymentEmailModalOpen}
          onClose={() => payment.setIsPaymentEmailModalOpen(false)}
        />
      )}
    </>
  );
}
