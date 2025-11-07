"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useGuestWorkspace } from "@/hooks/useGuestWorkspace";
import { useJobStreaming } from "@/hooks/useJobStreaming";
import { cookieModeEnabled } from "@/lib/config/features";
import * as guestTilesService from "@/lib/services/guest-tiles";
import * as guestTemplatesService from "@/lib/services/guest-templates";

import { AppLayout } from "@/components/layout/AppLayout";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import NotesEditor from "@/components/ui/NotesEditor";
import FilesManager from "@/components/ui/FilesManager";
import { DocModal } from "@/components/ui/DocModal";
import { AddCompanyModalWithTemplate } from "@/components/ui/AddCompanyModalWithTemplate";
import { AddPromptModal } from "@/components/ui/AddPromptModal";
import { AddContactModal } from "@/components/ui/AddContactModal";
import { ContactModal } from "@/components/ui/ContactModal";
import { SortableTilesGrid } from "@/components/ui/SortableTilesGrid";
import LoadingModal from "@/components/ui/LoadingModal";
import SaveTemplateModal from "@/components/ui/SaveTemplateModal";
import { BackgroundCustomizer } from "@/components/dashboard/BackgroundCustomizer";
import { TemplatePreviewModal } from "@/components/ui/TemplatePreviewModal";

export function AdminDashboardContainer() {
  console.log(
    "[AdminDashboardContainer] ✅ Componente começou a renderizar. Se nenhum outro log aparecer, o erro está na inicialização dos hooks abaixo."
  );

  const searchParams = useSearchParams();
  const jobIdFromUrl = searchParams.get("job_id");
  const guestIdFromUrl = searchParams.get("guest_id");
  const tokenFromUrl = searchParams.get("token");

  // Hook para gerenciar workspace
  const {
    data,
    error,
    isLoading,
    companies,
    contacts,
    workspaceName,
    revalidateWorkspace,
  } = useGuestWorkspace({
    guestId: guestIdFromUrl,
    jobId: jobIdFromUrl,
    token: tokenFromUrl,
  });

  const [selectedCompanyId, setSelectedCompanyId] = useState(null);
  useEffect(() => {
    if (!companies.length) {
      setSelectedCompanyId(null);
      return;
    }

    if (
      selectedCompanyId &&
      companies.some((c) => c.id === selectedCompanyId)
    ) {
      return;
    }

    const preferred =
      companies.find((company) => {
        if (!jobIdFromUrl) return false;
        return (company.tiles || []).some(
          (tile) => tile.jobId === jobIdFromUrl
        );
      }) || companies[0];

    setSelectedCompanyId(preferred?.id || null);
  }, [companies, jobIdFromUrl, selectedCompanyId]);

  const selectedCompany = useMemo(() => {
    if (!selectedCompanyId) return null;
    return (
      companies.find((company) => company.id === selectedCompanyId) || null
    );
  }, [companies, selectedCompanyId]);

  const isGenerating = useMemo(() => {
    const status = selectedCompany?.tiles_status;
    return status === "pending" || status === "generating";
  }, [selectedCompany]);

  // Hook para gerenciar streaming de jobs
  const { tileProgress } = useJobStreaming({
    jobId: jobIdFromUrl,
    guestId: guestIdFromUrl,
    token: tokenFromUrl,
    onTilePersisted: () => {
      // Tile já foi persistido pelo backend, apenas revalidar
    },
    revalidateWorkspace,
    isGenerating,
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTile, setSelectedTile] = useState(null);
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isAddPromptOpen, setIsAddPromptOpen] = useState(false);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedContactForModal, setSelectedContactForModal] = useState(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [showBackgroundCustomizer, setShowBackgroundCustomizer] =
    useState(false);
  const [userDismissedLoading, setUserDismissedLoading] = useState(false);
  const [isGeneratingCustomTile, setIsGeneratingCustomTile] = useState(false);

  const tiles = useMemo(() => selectedCompany?.tiles || [], [selectedCompany]);
  const tilesToGenerate = useMemo(() => {
    return (
      selectedCompany?.tiles_to_generate ||
      tileProgress.total ||
      tiles.length ||
      0
    );
  }, [selectedCompany, tileProgress.total, tiles.length]);

  const handleDeleteTile = useCallback(
    async (tileId) => {
      if (
        !tileId ||
        !guestIdFromUrl ||
        !jobIdFromUrl ||
        !tokenFromUrl ||
        !selectedCompanyId ||
        isGenerating
      ) {
        return;
      }

      try {
        await guestTilesService.deleteTile({
          guestId: guestIdFromUrl,
          jobId: jobIdFromUrl,
          token: tokenFromUrl,
          tileId,
          companyId: selectedCompanyId,
        });
      } catch (error) {
        console.error("[AdminDashboard] Error deleting tile", error);
      } finally {
        revalidateWorkspace();
      }
    },
    [
      guestIdFromUrl,
      jobIdFromUrl,
      tokenFromUrl,
      selectedCompanyId,
      isGenerating,
      revalidateWorkspace,
    ]
  );

  const handleReorderTiles = useCallback(
    async (reorderedTiles) => {
      if (
        !Array.isArray(reorderedTiles) ||
        !guestIdFromUrl ||
        !jobIdFromUrl ||
        !tokenFromUrl ||
        !selectedCompanyId ||
        isGenerating
      ) {
        return;
      }

      const tilesOrder = Array.from(
        new Set(
          reorderedTiles
            .filter(
              (tile) =>
                tile &&
                !tile.isPlaceholder &&
                typeof tile.id === "string" &&
                tile.id.trim().length > 0
            )
            .map((tile) => tile.id)
        )
      );

      if (!tilesOrder.length) {
        return;
      }

      try {
        await guestTilesService.reorderTiles({
          guestId: guestIdFromUrl,
          jobId: jobIdFromUrl,
          token: tokenFromUrl,
          companyId: selectedCompanyId,
          tilesOrder,
        });
      } catch (error) {
        console.error("[AdminDashboard] Error reordering tiles", error);
      } finally {
        revalidateWorkspace();
      }
    },
    [
      guestIdFromUrl,
      jobIdFromUrl,
      tokenFromUrl,
      selectedCompanyId,
      isGenerating,
      revalidateWorkspace,
    ]
  );

  const handleTileClick = useCallback((tile) => {
    setSelectedTile(tile);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedTile(null);
  }, []);

  const handleAcceptLoadingModal = useCallback(() => {
    setUserDismissedLoading(true);
  }, []);

  const showLoadingModal = useMemo(() => {
    if (cookieModeEnabled) return false;
    if (!jobIdFromUrl) return false;
    if (!isGenerating) return false;
    if (userDismissedLoading) return false;
    return true;
  }, [cookieModeEnabled, isGenerating, jobIdFromUrl, userDismissedLoading]);

  // Validação de sessão (após todos os hooks serem chamados)
  if (!cookieModeEnabled && (!jobIdFromUrl || !guestIdFromUrl)) {
    return (
      <AppLayout
        sidebar={<Sidebar />}
        header={<Header breadcrumb="Invalid Session" />}
      >
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold text-red-600 mb-4">
            Session Required
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please access this page with a valid job_id and guest_id.
          </p>
          <Link
            href="/"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </Link>
        </div>
      </AppLayout>
    );
  }

  if (isLoading && !data) {
    return (
      <AppLayout
        sidebar={<Sidebar />}
        header={<Header breadcrumb="Loading..." />}
      >
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading your trial workspace...
          </p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    console.error("[AdminDashboardContainer] SWR Error:", error);
    return (
      <AppLayout sidebar={<Sidebar />} header={<Header breadcrumb="Error" />}>
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold text-red-600 mb-4">
            Oops! Something went wrong
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error?.info?.error || error.message || "Failed to load workspace."}
          </p>
          <Link
            href="/"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </Link>
        </div>
      </AppLayout>
    );
  }

  return (
    <>
      {showLoadingModal && (
        <LoadingModal
          isOpen={true}
          onAccept={handleAcceptLoadingModal}
          companyName={selectedCompany?.name || "your company"}
          progress={tileProgress}
        />
      )}

      <AppLayout
        background={data?.dashboardBackground}
        sidebar={
          <Sidebar
            workspaceName={workspaceName}
            onAddCompany={() => setIsAddCompanyOpen(true)}
            onAddContact={() => setIsAddContactOpen(true)}
            companies={companies}
            contacts={contacts}
            selectedCompany={selectedCompany}
            selectedContact={selectedContactForModal}
            onCompanyClick={setSelectedCompanyId}
            onContactClick={(contact) => {
              setSelectedContactForModal(contact);
              setIsContactModalOpen(true);
            }}
            theme={data?.workspaceTheme}
          />
        }
        header={
          <Header
            title={selectedCompany ? selectedCompany.name : "Trial Workspace"}
            workspaceName={workspaceName}
            isLoading={isLoading && !data}
            onCustomizeBackground={() => setShowBackgroundCustomizer(true)}
            onSaveTemplate={() => setIsSaveTemplateOpen(true)}
            onCloneDashboard={() => setIsAddCompanyOpen(true)}
            onCreateBlank={() => setIsAddCompanyOpen(true)}
            disableGuestApis={cookieModeEnabled}
          />
        }
      >
        {selectedCompany ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {selectedCompany?.name || "Selected company"}
              </h1>
            </div>
            <SortableTilesGrid
              tiles={tiles}
              onTileClick={(tile) =>
                handleTileClick({
                  ...tile,
                  company: selectedCompany.name,
                })
              }
              onAddPrompt={() => setIsAddPromptOpen(true)}
              onDeleteTile={handleDeleteTile}
              isGeneratingTiles={isGenerating}
              isGeneratingCustomTile={isGeneratingCustomTile}
              tilesToGenerate={tilesToGenerate}
              onReorder={handleReorderTiles}
              tileProgress={tileProgress}
            />
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Select a company from the sidebar
            </h3>
          </div>
        )}

        {!cookieModeEnabled &&
          selectedCompany &&
          !selectedCompany.id?.startsWith("temp_") && (
          <>
            <div className="mb-8">
              <NotesEditor
                companyId={selectedCompany.id}
                companyName={selectedCompany.name}
                jobId={jobIdFromUrl}
                guestId={guestIdFromUrl}
                token={tokenFromUrl}
              />
            </div>
            <div className="mb-8">
              <FilesManager
                companyId={selectedCompany.id}
                companyName={selectedCompany.name}
                jobId={jobIdFromUrl}
                guestId={guestIdFromUrl}
                token={tokenFromUrl}
              />
            </div>
          </>
        )}
      </AppLayout>

      <DocModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        tile={selectedTile}
      />
      {!cookieModeEnabled && (
        <>
          <AddCompanyModalWithTemplate
            isOpen={isAddCompanyOpen}
            onClose={() => setIsAddCompanyOpen(false)}
            onAdd={revalidateWorkspace}
          />
          <AddContactModal
            isOpen={isAddContactOpen}
            onClose={() => setIsAddContactOpen(false)}
            onAdd={() => {
              setIsAddContactOpen(false);
              revalidateWorkspace();
            }}
            companyId={selectedCompany?.id}
            companyName={selectedCompany?.name}
            jobId={jobIdFromUrl}
            guestId={guestIdFromUrl}
            token={tokenFromUrl}
            entityKey="companies"
          />
          <AddPromptModal
            isOpen={isAddPromptOpen}
            onClose={() => setIsAddPromptOpen(false)}
            companyName={selectedCompany?.name}
            hasSessionData={Boolean(
              selectedCompany &&
              jobIdFromUrl &&
              guestIdFromUrl &&
              tokenFromUrl
            )}
            onAdd={async ({ prompt }) => {
              if (!selectedCompany?.id) {
                throw new Error("Select a company first");
              }
              setIsGeneratingCustomTile(true);
              try {
                await guestTilesService.generateCustomTile({
                  guestId: guestIdFromUrl,
                  jobId: jobIdFromUrl,
                  token: tokenFromUrl,
                  companyId: selectedCompany.id,
                  entityKey: "companies",
                  prompt,
                });
                setIsAddPromptOpen(false);
                revalidateWorkspace();
              } finally {
                setIsGeneratingCustomTile(false);
              }
            }}
          />
          <SaveTemplateModal
            isOpen={isSaveTemplateOpen}
            onClose={() => setIsSaveTemplateOpen(false)}
            hasSessionData={Boolean(
              jobIdFromUrl && guestIdFromUrl && tokenFromUrl
            )}
            onSave={async (templateData) => {
              await guestTemplatesService.saveTemplate({
                guestId: guestIdFromUrl,
                jobId: jobIdFromUrl,
                token: tokenFromUrl,
                template: templateData,
              });
              setIsSaveTemplateOpen(false);
              revalidateWorkspace();
            }}
          />
        </>
      )}
      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        contact={selectedContactForModal}
      />
      <TemplatePreviewModal
        isOpen={showTemplatePreview}
        onClose={() => setShowTemplatePreview(false)}
        template={data?.currentTemplate}
      />
      {showBackgroundCustomizer && (
        <BackgroundCustomizer
          isOpen={showBackgroundCustomizer}
          onClose={() => setShowBackgroundCustomizer(false)}
          onSave={() => {
            setShowBackgroundCustomizer(false);
            revalidateWorkspace();
          }}
          initialBackground={data?.dashboardBackground}
        />
      )}
    </>
  );
}
