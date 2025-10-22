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
import { DocModal } from "@/components/ui/DocModal";
import { ContactModal } from "@/components/ui/ContactModal";
import { AddCompanyModal } from "@/components/ui/AddCompanyModal";
import { AddContactModal } from "@/components/ui/AddContactModal";
import { AddPromptModal } from "@/components/ui/AddPromptModal";
import { AddPromptTile } from "@/components/ui/AddPromptTile";
import { LoadingTile } from "@/components/ui/LoadingTile";
import { SortableTilesGrid } from "@/components/ui/SortableTilesGrid";
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
  const [isAddPromptOpen, setIsAddPromptOpen] = useState(false);

  // Estado para Contact Modal
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedContactForModal, setSelectedContactForModal] = useState(null);

  // Estado para navegação
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Estado para tile customizado sendo gerado
  const [isGeneratingCustomTile, setIsGeneratingCustomTile] = useState(false);

  // Estado para ordenação dos tiles
  const [tilesOrder, setTilesOrder] = useState([]);

  // Auto-selecionar primeira company quando workspace carregar
  useEffect(() => {
    if (workspace?.workspace?.companies?.length > 0 && !selectedCompany) {
      console.log(
        "🎯 Auto-selecionando primeira company:",
        workspace.workspace.companies[0].name
      );
      setSelectedCompany(workspace.workspace.companies[0]);
    }
  }, [workspace, selectedCompany]);

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

    // Fechar modal imediatamente
    setIsAddCompanyOpen(false);

    // Recarregar workspace para ter os dados atualizados
    await loadGuestWorkspace();

    // Buscar a company recém-adicionada e selecioná-la
    if (data.company && workspace?.workspace?.companies) {
      const updatedCompany = workspace.workspace.companies.find(
        (c) => c.name === data.company.name
      );

      if (updatedCompany) {
        console.log("🎯 Company encontrada no workspace:", updatedCompany);
        setSelectedCompany(updatedCompany);

        // ⭐ NOVO: Tiles serão gerados automaticamente em background
        // Não precisa de LoadingModal manual - o polling vai detectar
        setGeneratingTiles(true); // Ativar polling para detectar tiles
      }
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

  const handleAddPrompt = async (data) => {
    console.log("✅ Custom prompt added:", data);

    if (!selectedCompany) {
      console.error("❌ No company selected");
      return;
    }

    try {
      console.log("🔄 Ativando polling para detectar mudanças...");
      // Ativar estados de loading
      setIsGeneratingCustomTile(true);
      setGeneratingTiles(true);

      // Chamar API para gerar tile customizado
      const response = await fetch("/api/guest/generate-custom-tile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: selectedCompany.name,
          prompt: data.prompt,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate custom tile");
      }

      console.log("✅ Custom tile generated successfully");

      // Fechar modal imediatamente quando tile começar a ser gerado
      setIsAddPromptOpen(false);

      // Recarregar workspace para mostrar o novo tile
      await loadGuestWorkspace();
    } catch (error) {
      console.error("❌ Erro ao gerar tile customizado:", error);
      setError("Failed to generate custom tile. Please try again.");
      setIsGeneratingCustomTile(false);
      setGeneratingTiles(false); // Parar polling em caso de erro
      throw error; // Re-throw para o modal tratar
    }
  };

  const handleCompanyClick = (company) => {
    setSelectedCompany(company);
  };

  const handleContactClick = (contact) => {
    setSelectedContactForModal(contact);
    setIsContactModalOpen(true);
  };

  const handleTilesReorder = async (newTiles) => {
    console.log("🔄 Reordenando tiles:", newTiles);
    const newOrder = newTiles.map((tile) => tile.id);
    setTilesOrder(newOrder);

    // ⭐ CRÍTICO: Atualizar estado local IMEDIATAMENTE para live data
    if (selectedCompany) {
      const updatedCompany = {
        ...selectedCompany,
        tiles: newTiles,
      };
      setSelectedCompany(updatedCompany);

      // Também atualizar o workspace global para consistência
      if (workspace?.workspace?.companies) {
        const updatedWorkspace = {
          ...workspace,
          workspace: {
            ...workspace.workspace,
            companies: workspace.workspace.companies.map((company) =>
              company.name === selectedCompany.name ? updatedCompany : company
            ),
          },
        };
        setWorkspace(updatedWorkspace);
      }

      console.log("✅ Estado local atualizado imediatamente");
    }

    // Salvar nova ordem no banco de dados (background)
    try {
      const response = await fetch("/api/guest/reorder-tiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: selectedCompany.name,
          tilesOrder: newOrder,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save tiles order");
      }

      console.log("✅ Tiles order saved successfully");
    } catch (error) {
      console.error("❌ Erro ao salvar ordem dos tiles:", error);
      setError("Failed to save tiles order. Please try again.");
    }
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

      // ⭐ NOVO: Detectar mudanças nos tiles da company selecionada
      if (selectedCompany && generatingTiles) {
        console.log(
          "🔍 Verificando mudanças para company:",
          selectedCompany.name
        );
        const currentCompany = data.workspace?.companies?.find(
          (c) => c.name === selectedCompany.name
        );

        if (currentCompany) {
          const currentTilesCount = currentCompany.tiles?.length || 0;
          const previousTilesCount = selectedCompany.tiles?.length || 0;

          console.log(
            `🔍 Tiles count: ${previousTilesCount} → ${currentTilesCount}`
          );
          console.log(`🔍 Polling ativo: ${generatingTiles}`);

          // Se tiles foram adicionados, atualizar UI imediatamente
          if (currentTilesCount > previousTilesCount) {
            console.log("✅ Novos tiles detectados, atualizando UI");

            // Atualizar selectedCompany com novos tiles
            setSelectedCompany(currentCompany);

            // Se todos os tiles foram gerados, parar polling
            if (currentCompany.tiles_status === "completed") {
              console.log("✅ Todos os tiles gerados, parando polling");
              setGeneratingTiles(false);
              setShowLoadingModal(false);
            }

            // Parar loading do tile customizado quando novos tiles aparecem
            if (isGeneratingCustomTile) {
              console.log("✅ Tile customizado gerado, removendo loading");
              setIsGeneratingCustomTile(false);
            }
          }
        } else {
          console.log("❌ Company não encontrada no workspace atual");
        }
      } else {
        console.log("🔍 Condições não atendidas:", {
          selectedCompany: !!selectedCompany,
          generatingTiles,
        });
      }

      setWorkspace(data);
      setLoading(false);

      // ⭐ CRÍTICO: Atualizar selectedCompany com dados mais recentes
      if (selectedCompany) {
        const updatedCompany = data.workspace?.companies?.find(
          (c) => c.name === selectedCompany.name
        );
        if (updatedCompany) {
          console.log("🔄 Atualizando selectedCompany com dados mais recentes");
          setSelectedCompany(updatedCompany);
        }
      }

      // Lógica para geração automática de tiles
      const currentCompany = selectedCompany
        ? data.workspace?.companies?.find(
            (c) => c.name === selectedCompany.name
          )
        : data.workspace?.companies?.[0];

      const status = currentCompany?.tiles_status;

      if (status === "pending" && !generatingTiles) {
        console.log(
          "🚀 Iniciando geração automática de tiles para:",
          currentCompany?.name
        );
        setShowLoadingModal(true); // Mostrar modal primeiro
        setGeneratingTiles(true);

        // Disparar geração automática
        generateTiles();
      } else if (status === "generating") {
        console.log("🔄 Tiles sendo gerados para:", currentCompany?.name);
        setGeneratingTiles(true);

        // Se há tiles sendo gerados, ativar polling para detectar tiles individuais
        if (!generatingTiles) {
          setGeneratingTiles(true);
        }
      } else if (status === "completed" || status === "failed") {
        console.log("✅ Geração de tiles finalizada:", status);
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

  const handleAcceptLoadingModal = async () => {
    setShowLoadingModal(false);

    // ⭐ NOVO: Tiles são gerados automaticamente agora
    // Apenas ativar polling para detectar quando terminarem
    setGeneratingTiles(true);
  };

  // Efeito para polling
  useEffect(() => {
    if (generatingTiles) {
      console.log("🔄 Iniciando polling...");
      const intervalId = setInterval(() => {
        console.log("🔄 Polling for workspace updates...");
        loadGuestWorkspace();
      }, 1500); // ⭐ Reduzido para 1.5s para resposta mais rápida

      setPollingInterval(intervalId);

      // Limpeza ao desmontar
      return () => clearInterval(intervalId);
    } else if (pollingInterval) {
      console.log("🛑 Stopping polling.");
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [generatingTiles]);

  // Efeito adicional para garantir que polling continue enquanto há tiles sendo gerados
  useEffect(() => {
    if (
      selectedCompany &&
      selectedCompany.tiles_status === "generating" &&
      !generatingTiles
    ) {
      console.log("🔄 Reativando polling para tiles em geração...");
      setGeneratingTiles(true);
    }
  }, [selectedCompany, generatingTiles]);

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
            onRefresh={loadGuestWorkspace}
            onSave={() => console.log("💾 Save dashboard changes")}
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

            <SortableTilesGrid
              tiles={selectedCompany.tiles || []}
              onTileClick={(tile) =>
                handleTileClick({
                  ...tile,
                  company: selectedCompany.name,
                })
              }
              onAddPrompt={() => {
                console.log("🔍 AddPromptTile clicked, opening modal");
                setIsAddPromptOpen(true);
              }}
              isGeneratingCustomTile={isGeneratingCustomTile}
              isGeneratingTiles={selectedCompany.tiles_status === "generating"}
              tilesToGenerate={selectedCompany.tiles_to_generate || 6}
              onReorder={handleTilesReorder}
            />
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

        {/* Notes Section - Fora do wrapper, em linha */}
        <div className="mb-8">
          <NotesSection onAddNote={handleAddNote} />
        </div>

        {/* Files Section */}
        <div className="mb-8">
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

      <AddPromptModal
        isOpen={isAddPromptOpen}
        onClose={() => setIsAddPromptOpen(false)}
        onAdd={handleAddPrompt}
        companyName={selectedCompany?.name}
      />

      <ContactModal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        contact={selectedContactForModal}
      />

      <LoadingModal
        isOpen={showLoadingModal}
        onAccept={handleAcceptLoadingModal}
        companyName={selectedCompany?.name || "your company"}
      />
    </>
  );
}
