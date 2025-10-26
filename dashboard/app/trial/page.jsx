"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";

// Layout Components
import { AppLayout } from "@/components/layout/AppLayout";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TemplatePreviewModal } from "@/components/ui/TemplatePreviewModal";
import { BackgroundCustomizer } from "@/components/dashboard/BackgroundCustomizer";
import { OutreachTiles } from "@/components/contacts/OutreachTiles";

// UI Components
import { Tile } from "@/components/ui/Tile";
import NotesEditor from "@/components/ui/NotesEditor";
import FilesManager from "@/components/ui/FilesManager";
import { DocModal } from "@/components/ui/DocModal";
import { ContactModal } from "@/components/ui/ContactModal";
import { AddCompanyModalWithTemplate } from "@/components/ui/AddCompanyModalWithTemplate";
import SaveTemplateModal from "@/components/ui/SaveTemplateModal";
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

  // Estado para Save Template Modal
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);

  // Estado para Contact Modal
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedContactForModal, setSelectedContactForModal] = useState(null);

  // Estado para navegação
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Estado para tile customizado sendo gerado
  const [isGeneratingCustomTile, setIsGeneratingCustomTile] = useState(false);

  // Estado para ordenação dos tiles
  const [tilesOrder, setTilesOrder] = useState([]);

  // Estado para Dashboard Header
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [showBackgroundCustomizer, setShowBackgroundCustomizer] =
    useState(false);
  const [dashboardBackground, setDashboardBackground] = useState({
    type: "solid",
    value: "#ffffff",
  });

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
    // Usar o workspace atualizado após loadGuestWorkspace
    if (data.company) {
      // Aguardar um pouco para o workspace ser atualizado
      setTimeout(async () => {
        // Recarregar workspace novamente para garantir dados frescos
        await loadGuestWorkspace();

        // Aguardar um pouco mais para o estado ser atualizado
        setTimeout(() => {
          // Usar o workspace mais recente do estado
          const currentWorkspace = workspace;
          if (currentWorkspace?.workspace?.companies) {
            const updatedCompany = currentWorkspace.workspace.companies.find(
              (c) => c.name === data.company.name
            );

            if (updatedCompany) {
              console.log(
                "🎯 Company encontrada no workspace:",
                updatedCompany
              );
              setSelectedCompany(updatedCompany);

              // ⭐ NOVO: Tiles serão gerados automaticamente em background
              // Não precisa de LoadingModal manual - o polling vai detectar
              setGeneratingTiles(true); // Ativar polling para detectar tiles
            }
          }
        }, 100);
      }, 200);
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

  const handleSaveTemplateData = async (templateData) => {
    try {
      const response = await fetch("/api/guest/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(templateData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to save template");
      }

      console.log("✅ Template saved successfully:", data.template);
      // Recarregar workspace para mostrar mudanças
      await loadGuestWorkspace();
    } catch (error) {
      console.error("❌ Erro ao salvar template:", error);
      throw error;
    }
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

      // Recarregar workspace para mostrar o novo tile
      await loadGuestWorkspace();
    } catch (error) {
      console.error("❌ Erro ao gerar tile customizado:", error);
      setError("Failed to generate custom tile. Please try again.");
      setIsGeneratingCustomTile(false);
      setGeneratingTiles(false); // Parar polling em caso de erro
      // Não fazer throw - deixar o modal fechar
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

  // Handlers para Dashboard Header
  const handleTemplateChange = (template) => {
    console.log("🎯 Template selecionado:", template);
    setCurrentTemplate(template);
    setShowTemplatePreview(true);
  };

  const handleTemplateApply = async (template) => {
    console.log("✅ Aplicando template:", template);
    // TODO: Implementar aplicação de template
    setShowTemplatePreview(false);
  };

  const handleSaveTemplate = () => {
    console.log("💾 Salvando como template");
    setIsSaveTemplateOpen(true);
  };

  const handleCloneDashboard = () => {
    console.log("📋 Clonando dashboard");
    if (selectedCompany && selectedCompany.tiles.length > 0) {
      // Criar uma cópia dos tiles atuais
      const clonedTiles = selectedCompany.tiles.map((tile) => ({
        ...tile,
        id: `tile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: `${tile.title} (Copy)`,
        createdAt: new Date().toISOString(),
      }));

      const updatedCompany = {
        ...selectedCompany,
        tiles: [...selectedCompany.tiles, ...clonedTiles],
      };
      setSelectedCompany(updatedCompany);

      // Atualizar workspace global
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

      console.log("✅ Dashboard clonado com", clonedTiles.length, "tiles");
    } else {
      console.log("⚠️ Nenhum tile para clonar");
    }
  };

  const handleCreateBlank = () => {
    console.log("📄 Criando dashboard em branco");
    if (selectedCompany) {
      // Limpar tiles da company atual
      const updatedCompany = {
        ...selectedCompany,
        tiles: [],
      };
      setSelectedCompany(updatedCompany);

      // Atualizar workspace global
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

      console.log("✅ Dashboard em branco criado");
    }
  };

  const handleBackgroundChange = async (background) => {
    console.log("🎨 Background alterado:", background);
    setDashboardBackground(background);

    // Salvar background no banco de dados
    try {
      const response = await fetch("/api/guest/workspace", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dashboardBackground: background,
        }),
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ Background salvo no banco");
      } else {
        console.error("❌ Erro ao salvar background:", data.error);
      }
    } catch (error) {
      console.error("❌ Erro ao salvar background:", error);
    }
  };

  const handleDeleteTile = async (tileId) => {
    if (!selectedCompany) return;

    try {
      console.log("🗑️ Deletando tile:", tileId);

      // Atualizar estado local imediatamente
      const updatedTiles = selectedCompany.tiles.filter(
        (tile) => tile.id !== tileId
      );
      const updatedCompany = {
        ...selectedCompany,
        tiles: updatedTiles,
      };
      setSelectedCompany(updatedCompany);

      // Atualizar workspace global
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

      // Chamar API para deletar do banco de dados
      const response = await fetch(`/api/guest/tiles/${tileId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ Tile deletado do banco:", tileId);
      } else {
        console.error("❌ Erro ao deletar tile do banco:", data.error);
        // Reverter mudanças locais se falhar
        await loadGuestWorkspace();
      }
    } catch (error) {
      console.error("❌ Erro ao deletar tile:", error);
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

      // Carregar background customizado se existir
      if (data.workspace?.dashboardBackground) {
        setDashboardBackground(data.workspace.dashboardBackground);
        console.log(
          "🎨 Background carregado:",
          data.workspace.dashboardBackground
        );
      }

      // ⭐ NOVO: Detectar mudanças nos tiles da company selecionada
      if (selectedCompany) {
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
          console.log(`🔍 Custom tile loading: ${isGeneratingCustomTile}`);

          // Se tiles foram adicionados, atualizar UI imediatamente
          if (currentTilesCount > previousTilesCount) {
            console.log("✅ Novos tiles detectados, atualizando UI");

            // Atualizar selectedCompany com novos tiles
            setSelectedCompany(currentCompany);

            // Parar loading do tile customizado quando novos tiles aparecem
            if (isGeneratingCustomTile) {
              console.log("✅ Tile customizado gerado, removendo loading");
              setIsGeneratingCustomTile(false);
            }

            // Se todos os tiles foram gerados, parar polling
            if (currentCompany.tiles_status === "completed") {
              console.log("✅ Todos os tiles gerados, parando polling");
              setGeneratingTiles(false);
              setShowLoadingModal(false);
              // ⭐ NOVO: Parar polling imediatamente
              if (pollingInterval) {
                clearInterval(pollingInterval);
                setPollingInterval(null);
              }
            }
          }
        } else {
          console.log("❌ Company não encontrada no workspace atual");
        }
      } else {
        console.log("🔍 Nenhuma company selecionada");
      }

      setWorkspace(data);
      setLoading(false);

      // ⭐ CRÍTICO: Selecionar automaticamente a primeira company se não há nenhuma selecionada
      if (!selectedCompany && data.workspace?.companies?.length > 0) {
        const firstCompany = data.workspace.companies[0];
        console.log(
          "🎯 Auto-selecionando primeira company:",
          firstCompany.name
        );
        setSelectedCompany(firstCompany);
      } else if (data.workspace?.companies?.length > 0) {
        // Se não há company selecionada, selecionar a primeira
        console.log("🎯 Auto-selecionando primeira company após atualização");
        setSelectedCompany(data.workspace.companies[0]);
      }

      // Lógica para geração automática de tiles
      const currentCompany = selectedCompany
        ? data.workspace?.companies?.find(
            (c) => c.name === selectedCompany.name
          )
        : data.workspace?.companies?.[0];

      const status = currentCompany?.tiles_status;

      console.log("🔍 Debug geração automática:");
      console.log("- currentCompany:", currentCompany?.name);
      console.log("- status:", status);
      console.log("- generatingTiles:", generatingTiles);
      console.log("- showLoadingModal:", showLoadingModal);

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

  // ⭐ NOVO: Função para parar polling manualmente
  const stopPolling = () => {
    console.log("🛑 Parando polling manualmente");
    if (pollingInterval) {
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
    setGeneratingTiles(false);
    setIsGeneratingCustomTile(false);
    setShowLoadingModal(false);
  };

  // Efeito para polling com segurança
  useEffect(() => {
    if (generatingTiles || isGeneratingCustomTile) {
      console.log("🔄 Iniciando polling...");
      let pollCount = 0;
      const maxPolls = 15; // ⭐ Reduzido para 15 polls (30 segundos)
      let consecutiveErrors = 0;
      const maxConsecutiveErrors = 3;

      const intervalId = setInterval(async () => {
        pollCount++;
        console.log(
          `🔄 Polling for workspace updates... (${pollCount}/${maxPolls})`
        );

        // Parar polling se exceder limite de segurança
        if (pollCount >= maxPolls) {
          console.log("⚠️ Limite de polling atingido, parando por segurança");
          setGeneratingTiles(false);
          setShowLoadingModal(false);
          setIsGeneratingCustomTile(false);
          clearInterval(intervalId);
          setPollingInterval(null);
          setError("Geração de tiles demorou muito. Tente novamente.");
          return;
        }

        try {
          await loadGuestWorkspace();
          consecutiveErrors = 0; // Reset contador de erros
        } catch (error) {
          consecutiveErrors++;
          console.error(
            `❌ Erro no polling (${consecutiveErrors}/${maxConsecutiveErrors}):`,
            error
          );

          // Parar polling se muitos erros consecutivos
          if (consecutiveErrors >= maxConsecutiveErrors) {
            console.log("⚠️ Muitos erros consecutivos, parando polling");
            setGeneratingTiles(false);
            setShowLoadingModal(false);
            setIsGeneratingCustomTile(false);
            clearInterval(intervalId);
            setPollingInterval(null);
            setError("Erro na geração de tiles. Tente novamente.");
            return;
          }
        }
      }, 3000); // ⭐ Aumentado para 3s para reduzir carga

      setPollingInterval(intervalId);

      // Limpeza ao desmontar
      return () => clearInterval(intervalId);
    } else if (pollingInterval) {
      console.log("🛑 Stopping polling.");
      clearInterval(pollingInterval);
      setPollingInterval(null);
    }
  }, [generatingTiles, isGeneratingCustomTile]);

  // Efeito adicional para garantir que polling continue enquanto há tiles sendo gerados
  useEffect(() => {
    if (
      selectedCompany &&
      selectedCompany.tiles_status === "generating" &&
      !generatingTiles &&
      !pollingInterval // Só reativar se não há polling ativo
    ) {
      console.log("🔄 Reativando polling para tiles em geração...");
      setGeneratingTiles(true);
    }
  }, [selectedCompany, generatingTiles, pollingInterval]);

  // ⭐ NOVO: Garantir que selectedCompany sempre tem dados frescos
  useEffect(() => {
    if (workspace?.workspace?.companies && selectedCompany) {
      const freshCompany = workspace.workspace.companies.find(
        (c) => c.name === selectedCompany.name
      );

      // Só atualizar se realmente mudou
      if (
        freshCompany &&
        JSON.stringify(freshCompany.tiles) !==
          JSON.stringify(selectedCompany.tiles)
      ) {
        console.log(
          "🔄 Forçando atualização de selectedCompany com tiles frescos"
        );
        setSelectedCompany(freshCompany);
      }
    }
  }, [workspace]); // Reage a mudanças no workspace

  // ⭐ NOVO: Timeout de segurança para detectar geração travada
  useEffect(() => {
    if (generatingTiles || isGeneratingCustomTile) {
      const timeoutId = setTimeout(() => {
        console.log(
          "⚠️ Timeout de segurança: geração demorou mais de 2 minutos"
        );
        setError("Geração de tiles demorou muito. Tente novamente.");
        stopPolling();
      }, 120000); // 2 minutos

      return () => clearTimeout(timeoutId);
    }
  }, [generatingTiles, isGeneratingCustomTile]);

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
        background={dashboardBackground}
        sidebar={
          <Sidebar
            workspaceName={workspace?.workspace?.name}
            onAddCompany={() => setIsAddCompanyOpen(true)}
            onAddContact={() => setIsAddContactOpen(true)}
            companies={workspace?.workspace?.companies || []}
            contacts={selectedCompany?.contacts || []}
            selectedCompany={selectedCompany}
            selectedContact={null}
            onCompanyClick={handleCompanyClick}
            onContactClick={handleContactClick}
            backgroundColor={dashboardBackground}
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
            onCustomizeBackground={() => {
              console.log("🎨 Abrindo customize background");
              console.log(
                "🎨 showBackgroundCustomizer antes:",
                showBackgroundCustomizer
              );
              setShowBackgroundCustomizer(true);
              console.log("🎨 showBackgroundCustomizer depois:", true);
            }}
            onSaveTemplate={() => setIsSaveTemplateOpen(true)}
            onCloneDashboard={() => console.log("📋 Clone dashboard")}
            onCreateBlank={handleCreateBlank}
          />
        }
      >
        {/* Dashboard baseado no ViewMode */}
        {selectedCompany ? (
          // Vista de Company com tiles
          <div
            className="mb-12 min-h-screen"
            style={{
              backgroundColor:
                dashboardBackground.type === "solid"
                  ? dashboardBackground.value
                  : undefined,
              backgroundImage:
                dashboardBackground.type === "image"
                  ? `url(${dashboardBackground.value})`
                  : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          >
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
              <div className="flex items-center space-x-3">
                <button className="text-[16px] font-semibold bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">
                  Bulk Upload Your Prompts
                </button>
              </div>
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
              onDeleteTile={handleDeleteTile}
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
        {selectedCompany && (
          <div className="mb-8">
            <NotesEditor
              companyId={selectedCompany.name}
              companyName={selectedCompany.name}
            />
          </div>
        )}

        {/* Files Section */}
        {selectedCompany && (
          <div className="mb-8">
            {console.log("🔍 FilesManager props:", {
              companyId: selectedCompany.id,
              companyName: selectedCompany.name,
            })}
            <FilesManager
              companyId={selectedCompany.id}
              companyName={selectedCompany.name}
            />
          </div>
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
        onAdd={handleAddCompany}
        userContext={workspace?.workspace?.onboarding}
      />

      <AddContactModal
        isOpen={isAddContactOpen}
        onClose={() => setIsAddContactOpen(false)}
        onAdd={handleAddContact}
        companyName={selectedCompany?.name}
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
        company={selectedCompany}
        context={{
          companyTiles: selectedCompany?.tiles || [],
          uploadedFiles: [],
          notes: [],
        }}
      />

      <LoadingModal
        isOpen={showLoadingModal}
        onAccept={handleAcceptLoadingModal}
        onCancel={stopPolling}
        companyName={selectedCompany?.name || "your company"}
      />

      <SaveTemplateModal
        isOpen={isSaveTemplateOpen}
        onClose={() => setIsSaveTemplateOpen(false)}
        onSave={handleSaveTemplateData}
        currentTiles={selectedCompany?.tiles || []}
      />

      {/* Template Preview Modal */}
      <TemplatePreviewModal
        template={currentTemplate}
        isOpen={showTemplatePreview}
        onClose={() => setShowTemplatePreview(false)}
        onApply={handleTemplateApply}
      />

      {/* Background Customizer Modal */}
      {showBackgroundCustomizer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Customize Background</h2>
              <button
                onClick={() => setShowBackgroundCustomizer(false)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>
            <BackgroundCustomizer
              currentBackground={dashboardBackground}
              onBackgroundChange={handleBackgroundChange}
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowBackgroundCustomizer(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowBackgroundCustomizer(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
