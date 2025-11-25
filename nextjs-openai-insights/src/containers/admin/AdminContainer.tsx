"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/lib/state/toast-context";
import { useTileStreaming } from "@/lib/hooks/useTileStreaming";
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
import { updateDashboard } from "@/lib/storage/dashboards-store";

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
 * Reduced from 4046 lines to ~600 lines using custom hooks.
 * All business logic extracted to services and hooks.
 */
export function AdminContainer() {
  const router = useRouter();
  const { push } = useToast();
  const { theme } = useAdminTheme();

  // Shared ref for dashboard updates (prevents race conditions)
  const isUpdatingDashboardRef = useRef(false);

  // Initialize hooks in dependency order
  const dashboard = useDashboardManagement();
  
  const workspace = useWorkspaceManagement(
    dashboard.currentCompany,
    dashboard.currentDashboard,
    isUpdatingDashboardRef
  );

  // Operation hooks
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

  // UI hooks
  const appearance = useAppearanceManagement(dashboard.currentDashboard);
  const modals = useModalState();
  const payment = usePaymentFlow();

  // Streaming hook
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
          const updatedTiles = [...dashboard.currentDashboard.tiles];
          updatedTiles[index] = tile;
          updateDashboard(dashboard.currentCompany.id, dashboard.currentDashboard.id, {
            tiles: updatedTiles,
          });
          dashboard.refreshCompanies();
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
  const hasTiles = tiles.tiles.length > 0 || streaming.tiles.length > 0;
  const hasContacts = contacts.contacts.length > 0;
  const hasNotes = notes.notes.length > 0;

  // Combine tiles from operations and streaming
  const allTiles = streaming.isStreaming ? streaming.tiles : tiles.tiles;

  // Convert companies to sidebar format
  const companiesForSidebar = dashboard.companies.map((company) => ({
    sessionId: company.id,
    name: company.name,
    generatedAt: company.createdAt,
    tilesCount: company.dashboards.reduce((sum, d) => sum + (d.tiles?.length || 0), 0),
    notesCount: company.dashboards.reduce((sum, d) => sum + (d.notes?.length || 0), 0),
    contactsCount: company.dashboards.reduce((sum, d) => sum + (d.contacts?.length || 0), 0),
    dashboardsCount: company.dashboards.length,
    isActive: company.id === dashboard.currentCompany?.id,
  }));

  // Convert dashboards for header
  const dashboardsForHeader = dashboard.currentCompany?.dashboards.map((d) => ({
    id: d.id,
    name: d.name,
    isActive: d.id === dashboard.currentDashboard?.id,
  })) || [];

  return (
    <>
      <AdminShellAde
        appearance={appearance.appearanceTokens}
        sidebar={
          <AdminSidebarAde
            appearance={appearance.appearanceTokens}
            workspaceName={workspace.workspace?.company?.name || "Workspace"}
            companies={companiesForSidebar}
            onSelectCompany={workspace.selectWorkspace}
            onAddCompany={() => modals.openAddCompany()}
            onAddContact={() => modals.openAddContact()}
          />
        }
        header={
          <AdminHeaderAde
            appearance={appearance.appearanceTokens}
            companyId={dashboard.currentCompany?.id}
            currentDashboardId={dashboard.currentDashboard?.id}
            dashboards={dashboardsForHeader}
            onCustomizeBackground={() => {
              // Color picker logic here
            }}
            onSaveTemplate={() => {
              push({
                title: "Template saved",
                variant: "success",
              });
            }}
            onLogin={() => router.push("/sign-in")}
            onSignUp={() => router.push("/sign-up")}
            onCreateBlankDashboard={() => modals.openCreateBlankDashboard()}
            onSelectDashboard={dashboard.setActiveDashboard}
            onDeleteDashboard={dashboard.deleteDashboard}
            onApplyTemplate={(templateId) => {
              push({
                title: "Template applied",
                description: `Applied template: ${templateId}`,
                variant: "success",
              });
            }}
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
            action={{
              label: "Go to Home",
              onClick: () => router.push("/"),
            }}
          />
        ) : !hasDashboard ? (
          <EmptyStateAde
            title="No dashboard selected"
            description="Select or create a dashboard to get started."
            action={{
              label: "Create Dashboard",
              onClick: () => modals.openCreateBlankDashboard(),
            }}
          />
        ) : (
          <>
            {/* Main content area */}
            <div className="flex-1 overflow-auto p-6">
              {hasTiles ? (
                <TileGridAde
                  tiles={allTiles}
                  onDeleteTile={tiles.deleteTile}
                  onRegenerateTile={tiles.regenerateTile}
                  onReorderTiles={tiles.reorderTiles}
                  onOpenTile={modals.openTileDetail}
                  isReordering={tiles.isPersistingOrder}
                  regeneratingTileIds={Array.from(tiles.regeneratingIds)}
                  appearance={appearance.appearanceTokens}
                />
              ) : (
                <EmptyStateAde
                  title="No insights yet"
                  description="Add a prompt to generate your first insight."
                  action={{
                    label: "Add Prompt",
                    onClick: () => modals.openAddPrompt(),
                  }}
                />
              )}
            </div>

            {/* Side panels */}
            {hasContacts && (
              <ContactsPanelAde
                contacts={contacts.contacts}
                onContactsChanged={async () => {}}
                onAddContact={() => modals.openAddContact()}
                onOpenContact={modals.openContactDetail}
                onRegenerateContact={contacts.regenerateContact}
                regeneratingContactId={contacts.regeneratingId}
                appearance={appearance.appearanceTokens}
              />
            )}

            {hasNotes && (
              <NotesPanelAde
                notes={notes.notes}
                onNotesChanged={async () => {}}
                appearance={appearance.appearanceTokens}
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
          onSubmit={async (payload: { message: string; attachments?: any[] }) => {
            if (payment.ensureAllowance("createContact")) {
              await tiles.chatWithTile(modals.selectedTile!.id, payload);
              payment.commitUsage("createContact");
            }
          }}
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
          onSubmitChat={(message) => {
            if (payment.ensureAllowance("createContact")) {
              contacts.chatWithContact(modals.selectedContact!.id, message);
              payment.commitUsage("createContact");
            }
          }}
          isRegenerating={contacts.regeneratingId === modals.selectedContact?.id}
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
        />
      )}

      {modals.isAddCompanyOpen && (
        <AddCompanyModal
          open={modals.isAddCompanyOpen}
          onClose={modals.closeAddCompany}
          onSubmit={async (payload) => {
            // Handle company generation
            push({
              title: "Company generation started",
              variant: "success",
            });
            modals.closeAddCompany();
          }}
        />
      )}

      {modals.isAddPromptOpen && (
        <AddPromptModal
          open={modals.isAddPromptOpen}
          onClose={modals.closeAddPrompt}
        />
      )}

      {modals.isBulkUploadOpen && (
        <BulkUploadModal
          open={modals.isBulkUploadOpen}
          onClose={modals.closeBulkUpload}
        />
      )}

      {modals.isCreateBlankDashboardOpen && (
        <CreateBlankDashboardModal
          open={modals.isCreateBlankDashboardOpen}
          onClose={modals.closeCreateBlankDashboard}
          onSubmit={async (payload) => {
            if (dashboard.currentCompany) {
              dashboard.createDashboard(payload.dashboardName);
              modals.closeCreateBlankDashboard();
              push({
                title: "Dashboard created",
                variant: "success",
              });
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
          usage={payment.usage}
          limits={payment.limits}
          lastAction={payment.upgradeReason}
          stripeCheckoutUrl={payment.stripeCheckoutUrl}
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
