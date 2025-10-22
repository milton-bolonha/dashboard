"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

// Layout Components
import AppLayout from "@/components/layout/AppLayout";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

// UI Components
import { Tile } from "@/components/ui/Tile";
import { NotesSection } from "@/components/ui/NotesSection";
import { FilesSection } from "@/components/ui/FilesSection";
import { ContactsSection } from "@/components/ui/ContactsSection";
import { DocModal } from "@/components/ui/DocModal";
import { ContactModal } from "@/components/ui/ContactModal";
import { AddCompanyModal } from "@/components/ui/AddCompanyModal";
import { AddContactModal } from "@/components/ui/AddContactModal";
import Image from "next/image";
import LoadingModal from "@/components/ui/LoadingModal";
export const dynamic = "force-dynamic";

/**
 * Trial Dashboard v2 - Com Layout e Componentes Finais
 */
export default function TrialDashboard() {
  noStore();
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingTiles, setGeneratingTiles] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Estado para o Modal
  const [selectedTile, setSelectedTile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estado para Add Company Modal
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);

  // Estado para Contact Modal
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedContactForModal, setSelectedContactForModal] = useState(null);

  // Estado para navegação
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Auto-selecionar primeira company quando workspace carregar (só uma vez)
  useEffect(() => {
    if (workspace?.workspace?.companies?.length > 0 && !selectedCompany) {
      setSelectedCompany(workspace.workspace.companies[0]);
    }
  }, [workspace]);

  const handleTileClick = (tile) => {
    setSelectedTile(tile);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedTile(null);
  };

  const handleAddCompany = async (data) => {
    console.log("✅ Company added:", data);
    // Recarregar workspace para atualizar a lista
    await loadGuestWorkspace();

    // Selecionar a nova company e gerar tiles
    if (data.company) {
      setSelectedCompany(data.company);

      // Triggerar geração de tiles para a nova company
      console.log("🤖 Triggerando geração de tiles para nova company...");
      await generateTiles();
    }
  };

  const handleAddContact = async (data) => {
    console.log("✅ Contact added:", data);
    // Recarregar workspace para atualizar a lista
    await loadGuestWorkspace();
  };

  const handleAddNote = () => {
    console.log("TODO: Implement AddNoteModal");
  };

  const handleCompanyClick = (company) => {
    setSelectedCompany(company);
  };

  const handleContactClick = (contact) => {
    setSelectedContactForModal(contact);
    setIsContactModalOpen(true);
  };

  useEffect(() => {
    console.log("🔍 Trial useEffect executado:", { isLoaded, isSignedIn });
    if (isLoaded && isSignedIn) {
      console.log("✅ User já autenticado, redirecionando para dashboard");
      router.push("/dashboard");
      return;
    }
    if (isLoaded) {
      console.log("📞 Chamando loadGuestWorkspace...");
      loadGuestWorkspace();
    } else {
      console.log("⏳ Aguardando Clerk carregar...");
    }
  }, [isLoaded, isSignedIn, router]);

  async function loadGuestWorkspace() {
    try {
      console.log("📥 loadGuestWorkspace: Fazendo fetch...");
      const response = await fetch("/api/guest/workspace");
      console.log("📥 loadGuestWorkspace: Response status:", response.status);
      if (response.status === 401) {
        console.log("⚠️ Sem guest session, redirecionando para landing");
        router.push("/");
        return;
      }
      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Erro no fetch:", errorData);
        throw new Error("Failed to load workspace");
      }
      const data = await response.json();
      console.log("✅ Workspace carregado:", data);
      setWorkspace(data);
      setLoading(false);
      const company = data.workspace?.companies?.[0];
      const status = company?.tiles_status;

      if (status === "pending" && !generatingTiles) {
        setShowLoadingModal(true); // Mostrar modal primeiro
        setGeneratingTiles(true);
      } else if (status === "generating") {
        setGeneratingTiles(true);
      } else if (status === "completed" || status === "failed") {
        setGeneratingTiles(false);
        setShowLoadingModal(false);
      }
    } catch (err) {
      console.error("❌ Erro ao carregar guest workspace:", err);
      setError(err.message);
      setLoading(false);
    }
  }

  async function generateTiles() {
    try {
      console.log("🤖 Chamando API de geração de tiles...");
      const response = await fetch("/api/guest/generate-tiles", {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to generate tiles");
      }
      const data = await response.json();
      console.log(`✅ Geração de tiles iniciada em background!`);
      // Não desligar generatingTiles aqui - o polling vai detectar quando terminar
    } catch (err) {
      console.error("❌ Erro ao gerar tiles:", err);
      setGeneratingTiles(false);
      setShowLoadingModal(false);
      setError("Failed to generate tiles. Please refresh.");
    }
  }

  const handleAcceptLoadingModal = () => {
    setShowLoadingModal(false);
    // Iniciar geração após aceitar o modal
    generateTiles();
  };

  // Efeito para polling
  useEffect(() => {
    if (generatingTiles) {
      const intervalId = setInterval(() => {
        console.log("🔄 Polling for workspace updates...");
        loadGuestWorkspace();
      }, 2500); // Sondagem a cada 2.5 segundos

      setPollingInterval(intervalId);

      // Limpeza ao desmontar
      return () => clearInterval(intervalId);
    } else if (pollingInterval) {
      console.log("🛑 Stopping polling.");
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [generatingTiles]);

  // --- Render States ---

  if (loading) {
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
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
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

  const company = workspace?.workspace?.companies?.[0];

  return (
    <>
      <AppLayout
        sidebar={
          <Sidebar
            workspaceName={workspace?.workspace?.name}
            onAddCompany={() => setIsAddCompanyOpen(true)}
            onAddContact={() => setIsAddContactOpen(true)}
            companies={workspace?.workspace?.companies || []}
            contacts={workspace?.workspace?.contacts || []}
            selectedCompany={selectedCompany}
            selectedContact={null}
            onCompanyClick={handleCompanyClick}
            onContactClick={handleContactClick}
          />
        }
        header={
          <Header
            breadcrumb={
              selectedCompany
                ? `${workspace?.workspace?.name} > ${selectedCompany.name}`
                : workspace?.workspace?.name || "Trial Workspace"
            }
            workspaceName={workspace?.workspace?.name}
          />
        }
      >
        {/* Dashboard baseado no ViewMode */}
        {selectedCompany ? (
          // Vista de Company com tiles
          <div className="mb-12">
            {/* Company Header com Bulk Upload */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedCompany.name}
                </h1>
                <button className="p-1 rounded hover:bg-gray-200 transition-colors">
                  <Image
                    src="/images/logo-mark.svg"
                    width={20}
                    height={20}
                    alt="Edit company"
                  />
                </button>
              </div>
              <button className="text-[16px] font-semibold bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                Bulk Upload Your Prompts
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedCompany.tiles?.length > 0 ? (
                selectedCompany.tiles.map((tile) => (
                  <div
                    key={tile.id}
                    onClick={() =>
                      handleTileClick({
                        ...tile,
                        company: selectedCompany.name,
                      })
                    }
                    className="cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <Tile title={tile.title} excerpt={tile.excerpt} />
                  </div>
                ))
              ) : selectedCompany.tiles_status === "generating" ? (
                // Placeholders durante geração
                Array.from({
                  length: selectedCompany.tiles_to_generate || 6,
                }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-white rounded-lg p-5 h-48 animate-pulse shadow-sm"
                  >
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))
              ) : (
                // Sem tiles
                <div className="col-span-full text-center py-8 text-gray-500">
                  No insights generated yet for {selectedCompany.name}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Estado inicial - selecionar company
          <div className="text-center py-20">
            <div className="bg-gray-100 rounded-lg p-8 max-w-md mx-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Select a company from the sidebar
              </h3>
              <p className="text-gray-600 mb-4">
                Click on a company to view its AI-generated insights.
              </p>
            </div>
          </div>
        )}

        {/* Seção Notes, Contacts & Files */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <NotesSection onAddNote={handleAddNote} />
          <ContactsSection
            contacts={workspace?.workspace?.contacts || []}
            onAddContact={() => setIsAddContactOpen(true)}
          />
          <FilesSection />
        </div>
      </AppLayout>

      <DocModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        tile={selectedTile}
      />

      <AddCompanyModal
        isOpen={isAddCompanyOpen}
        onClose={() => setIsAddCompanyOpen(false)}
        onAdd={handleAddCompany}
      />

      <AddContactModal
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
        onAdd={handleAddContact}
      />

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        contact={selectedContactForModal}
      />

      <LoadingModal
        isOpen={showLoadingModal}
        onAccept={handleAcceptLoadingModal}
        companyName={
          workspace?.workspace?.companies?.[0]?.name || "your company"
        }
      />
    </>
  );
}
