"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { fetcher } from "@/lib/fetcher";
import { useSSEManager } from "@/hooks/useSSEManager";

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

const DEFAULT_PROGRESS = { current: 0, total: 0, remaining: 0 };
const POLLING_INTERVAL_MS = 4000;
const MAX_POLLING_ATTEMPTS = 40;

export function AdminDashboardContainer() {
  const searchParams = useSearchParams();
  const jobIdFromUrl = searchParams.get("job_id");
  const guestIdFromUrl = searchParams.get("guest_id");
  const tokenFromUrl = searchParams.get("token");

  const swrKey = useMemo(() => {
    const buildKey = (params) => {
      const searchParams = new URLSearchParams(params);
      return `/api/guest/workspace?${searchParams.toString()}`;
    };

    if (jobIdFromUrl && guestIdFromUrl) {
      const params = {
        guest_id: guestIdFromUrl,
        job_id: jobIdFromUrl,
        _: Date.now().toString(),
      };
      if (tokenFromUrl) {
        params.token = tokenFromUrl;
      }
      return buildKey(params);
    }
    if (guestIdFromUrl) {
      return buildKey({
        guest_id: guestIdFromUrl,
        _: Date.now().toString(),
      });
    }
    return null;
  }, [guestIdFromUrl, jobIdFromUrl, tokenFromUrl]);

  const {
    data,
    error,
    isLoading,
    mutate: revalidateWorkspace,
  } = useSWR(swrKey, fetcher, {
    refreshInterval: jobIdFromUrl ? 2000 : 0,
    revalidateOnFocus: true,
  });

  const companies = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.companies)) return data.companies;
    if (data.workspace?.companies) return data.workspace.companies;
    return [];
  }, [data]);

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

  const [tileProgress, setTileProgress] = useState(DEFAULT_PROGRESS);
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

  const pollingRef = useRef({ active: false, attempts: 0, timeoutId: null });
  const isGeneratingRef = useRef(false);

  const tiles = useMemo(() => selectedCompany?.tiles || [], [selectedCompany]);
  const tilesToGenerate = useMemo(() => {
    return (
      selectedCompany?.tiles_to_generate ||
      tileProgress.total ||
      tiles.length ||
      0
    );
  }, [selectedCompany, tileProgress.total, tiles.length]);

  const isGenerating = useMemo(() => {
    const status = selectedCompany?.tiles_status;
    return status === "pending" || status === "generating";
  }, [selectedCompany]);

  useEffect(() => {
    isGeneratingRef.current = isGenerating;
    if (!isGenerating) {
      stopPolling("tiles-ready");
    }
  }, [isGenerating, stopPolling]);

  useEffect(() => {
    return () => {
      stopPolling("unmount");
    };
  }, [stopPolling]);

  const streamUrl = useMemo(() => {
    if (!jobIdFromUrl || !guestIdFromUrl || !tokenFromUrl) return null;
    return `/api/streams/jobs/${jobIdFromUrl}?guest_id=${guestIdFromUrl}&token=${tokenFromUrl}`;
  }, [guestIdFromUrl, jobIdFromUrl, tokenFromUrl]);

  const persistTileAndRefresh = useCallback(
    async (payload) => {
      if (!guestIdFromUrl || !jobIdFromUrl) return;

      if (payload?.persisted) {
        // Backend já persistiu o tile, apenas revalidar snapshot
        revalidateWorkspace();
        return;
      }

      const tileFromPayload = payload?.tile;
      const normalizedTile = {
        id: tileFromPayload?.id || `tile_${jobIdFromUrl}_${payload.orderIndex}`,
        orderIndex: tileFromPayload?.orderIndex ?? payload.orderIndex,
        title:
          tileFromPayload?.title ||
          payload.title ||
          `Insight ${(payload.orderIndex ?? 0) + 1}`,
        content:
          tileFromPayload?.content || payload.result || payload.content || "",
        answer:
          tileFromPayload?.answer || payload.result || payload.answer || "",
        excerpt:
          tileFromPayload?.excerpt ||
          payload.excerpt ||
          payload.result?.slice(0, 200) ||
          "",
        createdAt:
          tileFromPayload?.createdAt ||
          payload.createdAt ||
          new Date().toISOString(),
        metrics: tileFromPayload?.metrics || payload.metrics,
        jobId: jobIdFromUrl,
      };

      try {
        await fetch(`/api/guest/tiles?guest_id=${guestIdFromUrl}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tile: normalizedTile,
            jobId: jobIdFromUrl,
            entityKey: payload?.entityKey,
          }),
        });
      } catch (err) {
        console.error("[AdminDashboard] Failed to persist tile", err);
      } finally {
        revalidateWorkspace();
      }
    },
    [guestIdFromUrl, jobIdFromUrl, revalidateWorkspace]
  );

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
        const response = await fetch(`/api/guest/tiles/${tileId}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobId: jobIdFromUrl,
            guestId: guestIdFromUrl,
            token: tokenFromUrl,
            companyId: selectedCompanyId,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          console.error(
            "[AdminDashboard] Failed to delete tile",
            response.status,
            payload?.error
          );
        }
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
        const response = await fetch(`/api/guest/reorder-tiles`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            jobId: jobIdFromUrl,
            guestId: guestIdFromUrl,
            token: tokenFromUrl,
            companyId: selectedCompanyId,
            tilesOrder,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}));
          console.error(
            "[AdminDashboard] Failed to reorder tiles",
            response.status,
            payload?.error
          );
        }
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

  const stopPolling = useCallback((reason = "manual") => {
    if (!pollingRef.current.active) return;
    if (pollingRef.current.timeoutId) {
      clearTimeout(pollingRef.current.timeoutId);
      pollingRef.current.timeoutId = null;
    }
    pollingRef.current.active = false;
    console.log(`[AdminContainer] 🛑 Polling stopped (${reason}).`);
  }, []);

  const startPolling = useCallback(() => {
    if (pollingRef.current.active) return;
    console.log("[AdminContainer] 🔄 SSE fallback: starting polling loop...");
    pollingRef.current.active = true;
    pollingRef.current.attempts = 0;

    const tick = async () => {
      if (!pollingRef.current.active) return;
      pollingRef.current.attempts += 1;

      try {
        await revalidateWorkspace();
      } catch (error) {
        console.error("[AdminContainer] ⚠️ Polling error:", error);
      }

      if (!pollingRef.current.active) return;

      if (!isGeneratingRef.current) {
        stopPolling("tiles-ready");
        return;
      }

      if (pollingRef.current.attempts >= MAX_POLLING_ATTEMPTS) {
        stopPolling("max-attempts");
        return;
      }

      pollingRef.current.timeoutId = setTimeout(tick, POLLING_INTERVAL_MS);
    };

    tick();
  }, [revalidateWorkspace, stopPolling]);

  const sseListeners = useMemo(() => {
    if (!jobIdFromUrl) return {};
    return {
      "job:status": (payload) => {
        if (payload?.progress) {
          setTileProgress(payload.progress);
        }
        if (payload?.status === "COMPLETED") {
          revalidateWorkspace();
        }
      },
      "job:result-completed": (payload) => {
        persistTileAndRefresh(payload);
      },
    };
  }, [jobIdFromUrl, persistTileAndRefresh, revalidateWorkspace]);

  useSSEManager(streamUrl, sseListeners, {
    onPermanentError: startPolling,
    onReconnect: () => stopPolling("reconnected"),
  });

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
    if (!jobIdFromUrl) return false;
    if (!isGenerating) return false;
    if (userDismissedLoading) return false;
    return true;
  }, [isGenerating, jobIdFromUrl, userDismissedLoading]);

  const contacts = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data.contacts)) return data.contacts;
    if (data.workspace?.contacts) return data.workspace.contacts;
    return [];
  }, [data]);

  const workspaceName = useMemo(() => {
    if (!data) return "Trial Workspace";
    if (data.workspace?.name) return data.workspace.name;
    if (data.name) return data.name;
    return "Trial Workspace";
  }, [data]);

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
            breadcrumb={
              selectedCompany
                ? `${workspaceName} > ${
                    selectedCompany.name || "Selected company"
                  }`
                : workspaceName || "Trial Workspace"
            }
            onRefresh={revalidateWorkspace}
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
            />
          </div>
        ) : (
          <div className="text-center py-20">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Select a company from the sidebar
            </h3>
          </div>
        )}

        {selectedCompany && !selectedCompany.id?.startsWith("temp_") && (
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
          selectedCompany && jobIdFromUrl && guestIdFromUrl && tokenFromUrl
        )}
        onAdd={async ({ prompt }) => {
          if (!selectedCompany?.id) {
            throw new Error("Select a company first");
          }
          setIsGeneratingCustomTile(true);
          try {
            const response = await fetch("/api/guest/generate-custom-tile", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jobId: jobIdFromUrl,
                guestId: guestIdFromUrl,
                token: tokenFromUrl,
                companyId: selectedCompany.id,
                entityKey: "companies",
                prompt,
              }),
            });

            if (!response.ok) {
              const payload = await response.json().catch(() => ({}));
              throw new Error(payload.error || "Failed to generate tile");
            }
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
        hasSessionData={Boolean(jobIdFromUrl && guestIdFromUrl && tokenFromUrl)}
        onSave={async (templateData) => {
          const response = await fetch("/api/guest/templates", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              jobId: jobIdFromUrl,
              guestId: guestIdFromUrl,
              token: tokenFromUrl,
              template: templateData,
            }),
          });
          if (!response.ok) {
            const payload = await response.json().catch(() => ({}));
            throw new Error(payload.error || "Failed to save template");
          }
          setIsSaveTemplateOpen(false);
          revalidateWorkspace();
        }}
      />
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
