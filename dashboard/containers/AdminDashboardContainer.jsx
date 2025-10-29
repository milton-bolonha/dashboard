"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import {
  createTileDebugLogger,
  debugTileStates,
} from "@/lib/tile-debug-logger";

// Layout Components
import { AppLayout } from "@/components/layout/AppLayout";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

// UI Components
import NotesEditor from "@/components/ui/NotesEditor";
import FilesManager from "@/components/ui/FilesManager";
import { DocModal } from "@/components/ui/DocModal";
import { ContactModal } from "@/components/ui/ContactModal";
import { AddCompanyModalWithTemplate } from "@/components/ui/AddCompanyModalWithTemplate";
import SaveTemplateModal from "@/components/ui/SaveTemplateModal";
import { AddContactModal } from "@/components/ui/AddContactModal";
import { AddPromptModal } from "@/components/ui/AddPromptModal";
import { SortableTilesGrid } from "@/components/ui/SortableTilesGrid";
import Image from "next/image";
import LoadingModal from "@/components/ui/LoadingModal";
import { BackgroundCustomizer } from "@/components/dashboard/BackgroundCustomizer";
import { TemplatePreviewModal } from "@/components/ui/TemplatePreviewModal";

export const dynamic = "force-dynamic";

/**
 * Admin Dashboard Container
 * Gerencia toda a lógica de estado e chamadas de API
 */
export function AdminDashboardContainer() {
  noStore();
  const router = useRouter();

  // Workspace State
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [workspaceTheme, setWorkspaceTheme] = useState(null);
  const [dashboardBackground, setDashboardBackground] = useState({
    type: "solid",
    value: "#ffffff",
  });

  // Tiles Generation State
  const [generatingTiles, setGeneratingTiles] = useState(false);
  const [showLoadingModal, setShowLoadingModal] = useState(false);
  const [isGeneratingCustomTile, setIsGeneratingCustomTile] = useState(false);
  const [tilesOrder, setTilesOrder] = useState([]);

  // Modals State
  const [selectedTile, setSelectedTile] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [isAddPromptOpen, setIsAddPromptOpen] = useState(false);
  const [isSaveTemplateOpen, setIsSaveTemplateOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [selectedContactForModal, setSelectedContactForModal] = useState(null);

  // Navigation State
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Dashboard Header State
  const [currentTemplate, setCurrentTemplate] = useState(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);
  const [showBackgroundCustomizer, setShowBackgroundCustomizer] =
    useState(false);

  // Debug State
  const [debugLogger, setDebugLogger] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);

  // Refs for polling
  const previousTilesRef = useRef([]);
  const previousCustomTileRef = useRef(0);

  // Helper para obter nome/título de uma entidade
  const getEntityName = (entity) => {
    return entity?.name || entity?.title || "Unknown";
  };

  // Auto-selecionar primeira entidade quando workspace carregar
  useEffect(() => {
    if (!workspace?.workspace || selectedCompany) return;

    const theme = workspace.workspace.themeSnapshot;
    let entities = [];
    let entityKey = "companies";

    if (theme) {
      const primaryEntity = theme.entities.find((e) => e.isPrimary);
      entityKey = `${primaryEntity.id}s`;

      // ⭐ CORREÇÃO: Corrigir companys -> companies
      if (entityKey === "companys") {
        entityKey = "companies";
      }

      entities = workspace.workspace[entityKey] || [];

      if (entities && entities.length > 0) {
        console.log(
          `🎯 Auto-selecionando primeira ${primaryEntity.namePlural}:`,
          entities[0].name || entities[0].title
        );
        setSelectedCompany(entities[0]);
      }
    } else {
      entities = workspace.workspace.companies || [];

      if (entities && entities.length > 0) {
        console.log("🎯 Auto-selecionando primeira company:", entities[0].name);
        setSelectedCompany(entities[0]);
      }
    }
  }, [workspace]);

  // ⭐ CRITICAL: Detectar status de geração de tiles e mostrar loading
  useEffect(() => {
    if (!selectedCompany) return;

    const status = selectedCompany.tiles_status;
    const tilesCount = selectedCompany.tiles?.length || 0;
    const expectedTiles = selectedCompany.tiles_to_generate || 6;

    console.log("🔍 Debug geração de tiles:");
    console.log("- status:", status);
    console.log("- tilesCount:", tilesCount);
    console.log("- expectedTiles:", expectedTiles);
    console.log("- generatingTiles:", generatingTiles);

    // ⭐ CRITICAL: Status "pending" ou "generating" deve mostrar tiles de loading
    if ((status === "pending" || status === "generating") && !generatingTiles) {
      console.log(`🚀 Status: ${status} - Mostrando tiles de loading`);
      setGeneratingTiles(true);
      setShowLoadingModal(true); // ⭐ NOVO: Mostrar modal automaticamente

      // Se status é "pending", iniciar geração
      if (status === "pending") {
        // Marcar como generating no backend
        (async () => {
          try {
            await fetch("/api/guest/workspace", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tiles_status: "generating",
              }),
            });
          } catch (e) {
            console.error("⚠️ Erro ao marcar status como generating:", e);
          }
        })();

        // Iniciar geração via API
        (async () => {
          try {
            const response = await fetch("/api/guest/generate-tiles", {
              method: "POST",
            });
            if (!response.ok) {
              throw new Error("Failed to generate tiles");
            }
            console.log("✅ Geração de tiles iniciada em background");
          } catch (err) {
            console.error("❌ Erro ao gerar tiles:", err);
            setGeneratingTiles(false);
            setError("Failed to generate tiles. Please refresh.");
          }
        })();
      }
    }
    // Status "completed" ou "failed": parar loading
    if (generatingTiles && (status === "completed" || status === "failed")) {
      console.log("✅ Geração de tiles finalizada:", status);
      setGeneratingTiles(false);
      setShowLoadingModal(false);
    }
  }, [selectedCompany?.name, selectedCompany?.tiles_status]);

  // Load workspace on mount
  useEffect(() => {
    console.log("🔍 Admin useEffect executado");
    console.log("📞 Chamando loadGuestWorkspace...");

    try {
      loadGuestWorkspace();
      console.log("✅ Admin useEffect: loadGuestWorkspace chamado com sucesso");
    } catch (err) {
      console.error(
        "❌ Admin useEffect: Erro ao chamar loadGuestWorkspace:",
        err
      );
    }
  }, [router]);

  // Handlers
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
    setIsAddCompanyOpen(false);

    // ⭐ OTIMIZAÇÃO: Uma única chamada para recarregar workspace
    await loadGuestWorkspace();

    // ⭐ OTIMIZAÇÃO: Selecionar company imediatamente se existe no workspace atualizado
    if (data.company && workspace?.workspace) {
      const theme = workspace.workspace.themeSnapshot;
      let entityKey = "companies";

      if (theme) {
        const primaryEntity = theme.entities.find((e) => e.isPrimary);
        entityKey = `${primaryEntity.id}s`;
        if (entityKey === "companys") entityKey = "companies";
      }

      const entities =
        workspace.workspace[entityKey] || workspace.workspace.companies || [];
      const updatedCompany = entities.find(
        (c) => c.name === data.company.name || c.title === data.company.name
      );

      if (updatedCompany) {
        console.log("🎯 Company encontrada no workspace:", updatedCompany);
        setSelectedCompany(updatedCompany);
        setGeneratingTiles(true);
      }
    }
  };

  const handleAddContact = async (data) => {
    console.log("✅ Contact added:", data);
    await loadGuestWorkspace();
  };

  const handleAddPrompt = async (data) => {
    console.log("✅ Custom prompt added:", data);

    if (!selectedCompany) {
      console.error("❌ No company selected");
      return;
    }

    try {
      setIsGeneratingCustomTile(true);
      setGeneratingTiles(true);

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

      // ⭐ OTIMIZAÇÃO: Polling vai detectar automaticamente, não precisa chamar loadGuestWorkspace
      console.log("🔄 Aguardando polling detectar novo tile...");
    } catch (error) {
      console.error("❌ Erro ao gerar tile customizado:", error);
      setError("Failed to generate custom tile. Please try again.");
      setIsGeneratingCustomTile(false);
      setGeneratingTiles(false);
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
    if (!selectedCompany) {
      console.error("❌ No company selected for reorder");
      return;
    }

    console.log("🔄 Reordenando tiles:", newTiles);
    console.log("🔄 Company atual:", selectedCompany.name);

    // ⭐ CRÍTICO: Filtrar tiles com ID válido
    const newOrder = newTiles
      .map((tile) => tile.id)
      .filter((id) => id && id !== undefined);

    console.log("🔄 Nova ordem (IDs válidos):", newOrder);

    setTilesOrder(newOrder);

    // Atualizar estado local IMEDIATAMENTE
    const updatedCompany = {
      ...selectedCompany,
      tiles: newTiles,
    };
    setSelectedCompany(updatedCompany);

    // Atualizar workspace global também
    if (workspace?.workspace) {
      const theme = workspace.workspace.themeSnapshot;
      let entityKey = "companies";

      if (theme) {
        const primaryEntity = theme.entities.find((e) => e.isPrimary);
        entityKey = `${primaryEntity.id}s`;
        if (entityKey === "companys") entityKey = "companies";
      }

      const updatedWorkspace = {
        ...workspace,
        workspace: {
          ...workspace.workspace,
          [entityKey]: (workspace.workspace[entityKey] || []).map((company) =>
            company.name === selectedCompany.name ? updatedCompany : company
          ),
        },
      };
      setWorkspace(updatedWorkspace);
    }

    console.log("✅ Estado local atualizado imediatamente");

    // Salvar no backend
    try {
      console.log("💾 Salvando ordem no backend...");
      const response = await fetch("/api/guest/reorder-tiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: selectedCompany.name,
          tilesOrder: newOrder,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Erro no response:", errorData);
        throw new Error(errorData.error || "Failed to save tiles order");
      }

      const data = await response.json();
      console.log("✅ Tiles order saved successfully:", data);
    } catch (error) {
      console.error("❌ Erro ao salvar ordem dos tiles:", error);
      // NÃO mostrar erro para o usuário - a UI já está atualizada
    }
  };

  const handleTemplateChange = (template) => {
    console.log("🎯 Template selecionado:", template);
    setCurrentTemplate(template);
    setShowTemplatePreview(true);
  };

  const handleTemplateApply = async (template) => {
    console.log("✅ Aplicando template:", template);
    setShowTemplatePreview(false);
  };

  const handleSaveTemplate = () => {
    console.log("💾 Salvando como template");
    setIsSaveTemplateOpen(true);
  };

  const handleCloneDashboard = () => {
    console.log("📋 Clonando dashboard");
    if (selectedCompany && selectedCompany.tiles.length > 0) {
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
      const updatedCompany = {
        ...selectedCompany,
        tiles: [],
      };
      setSelectedCompany(updatedCompany);

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

      const updatedTiles = selectedCompany.tiles.filter(
        (tile) => tile.id !== tileId
      );
      const updatedCompany = {
        ...selectedCompany,
        tiles: updatedTiles,
      };
      setSelectedCompany(updatedCompany);

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

      const response = await fetch(`/api/guest/tiles/${tileId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        console.log("✅ Tile deletado do banco:", tileId);
      } else {
        console.error("❌ Erro ao deletar tile do banco:", data.error);
        await loadGuestWorkspace();
      }
    } catch (error) {
      console.error("❌ Erro ao deletar tile:", error);
    }
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
      await loadGuestWorkspace();
    } catch (error) {
      console.error("❌ Erro ao salvar template:", error);
      throw error;
    }
  };

  const handleAcceptLoadingModal = async () => {
    setShowLoadingModal(false);
    setGeneratingTiles(true);
  };

  // ⭐ CRITICAL: Load workspace function (simplified version for brevity)
  async function loadGuestWorkspace() {
    console.log("🚀 loadGuestWorkspace: INÍCIO DA FUNÇÃO");

    if (loading) {
      console.log("⚠️ loadGuestWorkspace: Já está carregando, pulando...");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // ⭐ FIX: Sem timeout para não bloquear usuário no admin
      // Requisições devem completar naturalmente
      const response = await fetch(`/api/guest/workspace?_t=${Date.now()}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate",
          Pragma: "no-cache",
        },
      });

      if (response.status === 401) {
        console.log("⚠️ Sem guest session, redirecionando para landing");
        router.push("/");
        return;
      }

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (jsonError) {
          errorData = {
            error: `Erro ${response.status}: ${response.statusText}`,
          };
        }

        console.error("❌ Erro no fetch:", errorData);

        if (response.status === 404) {
          throw new Error(
            "Workspace não encontrado. Tente criar um novo workspace."
          );
        } else if (response.status >= 500) {
          throw new Error(
            "Erro interno do servidor. Tente novamente em alguns minutos."
          );
        } else {
          throw new Error(errorData.error || "Falha ao carregar workspace");
        }
      }

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error("Resposta inválida do servidor. Tente novamente.");
      }

      console.log("✅ Workspace carregado:", data);

      if (!data.workspace) {
        throw new Error("Dados do workspace não encontrados");
      }

      if (data.workspace?.themeSnapshot) {
        setWorkspaceTheme(data.workspace.themeSnapshot);
      }

      if (data.workspace?.dashboardBackground) {
        setDashboardBackground(data.workspace.dashboardBackground);
      }

      // ⭐ CRÍTICO: Atualizar selectedCompany se já foi selecionado anteriormente
      if (selectedCompany) {
        const theme = data.workspace?.themeSnapshot;
        let entityKey = "companies";

        if (theme) {
          const primaryEntity = theme.entities.find((e) => e.isPrimary);
          entityKey = `${primaryEntity.id}s`;
          if (entityKey === "companys") entityKey = "companies";
        }

        const entities =
          data.workspace?.[entityKey] || data.workspace?.companies || [];
        const updatedEntity = entities.find(
          (e) =>
            e.name === selectedCompany.name ||
            e.title === selectedCompany.name ||
            e.id === selectedCompany.id
        );

        if (updatedEntity) {
          console.log("🔄 Atualizando selectedCompany com dados mais recentes");
          setSelectedCompany(updatedEntity);
        }
      }

      setWorkspace(data);

      setLoading(false);
    } catch (err) {
      console.error("❌ Erro ao carregar guest workspace:", err);

      let errorMessage = "Falha ao carregar workspace";

      if (err.name === "AbortError") {
        errorMessage = "Operação cancelada por timeout. Tente novamente.";
      } else if (
        err.message.includes("conexão") ||
        err.message.includes("network")
      ) {
        errorMessage = "Problema de conexão. Verifique sua internet.";
      } else if (err.message.includes("não encontrado")) {
        errorMessage =
          "Workspace não encontrado. Tente criar um novo workspace.";
      } else if (err.message.includes("servidor")) {
        errorMessage =
          "Erro interno do servidor. Tente novamente em alguns minutos.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
      setLoading(false);

      if (err.message.includes("401") || err.message.includes("Unauthorized")) {
        setTimeout(() => {
          router.push("/");
        }, 2000);
      }
    }
  }

  // ⭐ PERFORMANCE: Polling effect (com lógica completa de detecção)
  useEffect(() => {
    // ⭐ EDGE CASE: Evitar polling desnecessário
    if (!generatingTiles && !isGeneratingCustomTile) {
      if (pollingInterval) {
        console.log("🛑 Stopping polling - não há tiles sendo gerados");
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      return;
    }

    console.log("🔄 Iniciando polling...");

    // ⭐ PERFORMANCE: Variáveis para controle de polling
    let pollCount = 0;
    let consecutiveErrors = 0;
    const maxPolls = 30;
    const maxConsecutiveErrors = 3;
    let isPolling = false;

    const intervalId = setInterval(async () => {
      // ⭐ EDGE CASE: Prevenir múltiplas chamadas simultâneas
      if (isPolling) {
        console.log("⏳ Polling já em andamento, pulando...");
        return;
      }

      pollCount++;
      isPolling = true;

      console.log(
        `🔄 Polling for workspace updates... (${pollCount}/${maxPolls})`
      );

      // ⭐ EDGE CASE: Parar polling se exceder limite de segurança
      if (pollCount >= maxPolls) {
        console.log("⚠️ Limite de polling atingido, cancelando por segurança");
        setGeneratingTiles(false);
        setShowLoadingModal(false);
        setIsGeneratingCustomTile(false);
        clearInterval(intervalId);
        setPollingInterval(null);
        return;
      }

      try {
        // ⭐ FIX: Sem AbortController no polling - deixa requisição completar
        // ⭐ NOVO: Cache-busting + headers de não-cache para detectar mudanças imediatamente
        const response = await fetch(`/api/guest/workspace?_t=${Date.now()}`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        });

        if (response.ok) {
          const data = await response.json();

          // ⭐ CRÍTICO: Atualizar selectedCompany e verificar se tiles foram adicionados
          if (selectedCompany && data.workspace) {
            const theme = data.workspace.themeSnapshot;
            let entityKey = "companies";

            if (theme) {
              const primaryEntity = theme.entities.find((e) => e.isPrimary);
              entityKey = `${primaryEntity.id}s`;
              if (entityKey === "companys") entityKey = "companies";
            }

            const entities = data.workspace[entityKey] || [];
            const currentEntity = entities.find(
              (e) =>
                e.name === selectedCompany.name ||
                e.title === selectedCompany.name
            );

            if (currentEntity) {
              const previousTilesCount = selectedCompany.tiles?.length || 0;
              const currentTilesCount = currentEntity.tiles?.length || 0;

              console.log(
                `🔍 Tiles count: ${previousTilesCount} → ${currentTilesCount}`
              );

              // Se tiles foram adicionados, atualizar UI
              if (currentTilesCount > previousTilesCount) {
                console.log("✅ Novos tiles detectados, atualizando UI");
                setSelectedCompany(currentEntity);

                // Parar loading do tile customizado
                if (isGeneratingCustomTile) {
                  console.log("✅ Tile customizado gerado, removendo loading");
                  setIsGeneratingCustomTile(false);
                }

                // Se todos os tiles foram gerados, parar polling
                if (currentEntity.tiles_status === "completed") {
                  console.log("✅ Todos os tiles gerados, parando polling");
                  setGeneratingTiles(false);
                  setShowLoadingModal(false);
                  clearInterval(intervalId);
                  setPollingInterval(null);
                  return;
                }
              }
            }
          }

          // Atualizar workspace global
          setWorkspace(data);

          // Reset contador de erros em caso de sucesso
          consecutiveErrors = 0;
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } catch (err) {
        consecutiveErrors++;

        if (err.name === "AbortError") {
          console.log("🚫 Polling cancelado pelo AbortController");
          return;
        }

        console.error("❌ Erro no polling:", err);

        // ⭐ EDGE CASE: Parar polling após muitos erros consecutivos
        if (consecutiveErrors >= maxConsecutiveErrors) {
          console.error(
            `❌ Muitos erros consecutivos (${consecutiveErrors}), parando polling`
          );
          setGeneratingTiles(false);
          setShowLoadingModal(false);
          setIsGeneratingCustomTile(false);
          clearInterval(intervalId);
          setPollingInterval(null);
          setError("Erro de conexão. Tente recarregar a página.");
          return;
        }
      } finally {
        isPolling = false;
      }
    }, 1500); // ⭐ NOVO: Intervalo reduzido para detectar mudanças mais rápido

    setPollingInterval(intervalId);

    return () => {
      console.log("🧹 Cleanup: Parando polling");
      clearInterval(intervalId);
      isPolling = false;
    };
  }, [
    generatingTiles,
    isGeneratingCustomTile,
    selectedCompany?.name, // Mudar para name em vez de tiles.length
  ]);

  // Render states
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

  console.log("🔍 Render - selectedCompany:", selectedCompany);
  console.log("🔍 Render - selectedCompany.tiles:", selectedCompany?.tiles);

  return (
    <>
      <AppLayout
        background={dashboardBackground}
        sidebar={
          <Sidebar
            workspaceName={workspace?.workspace?.name}
            onAddCompany={() => setIsAddCompanyOpen(true)}
            onAddContact={() => setIsAddContactOpen(true)}
            companies={
              workspaceTheme
                ? (() => {
                    const primaryEntity = workspaceTheme.entities.find(
                      (e) => e.isPrimary
                    );
                    let entityKey = primaryEntity?.id
                      ? `${primaryEntity.id}s`
                      : "companies";

                    if (entityKey === "companys") {
                      entityKey = "companies";
                    }

                    return workspace?.workspace?.[entityKey] || [];
                  })()
                : workspace?.workspace?.companies || []
            }
            contacts={selectedCompany?.contacts || []}
            selectedCompany={selectedCompany}
            selectedContact={null}
            onCompanyClick={handleCompanyClick}
            onContactClick={handleContactClick}
            backgroundColor={dashboardBackground}
            theme={workspaceTheme}
          />
        }
        header={
          <Header
            breadcrumb={
              selectedCompany
                ? `${workspace?.workspace?.name} > ${getEntityName(
                    selectedCompany
                  )}`
                : workspace?.workspace?.name || "Trial Workspace"
            }
            workspaceName={workspace?.workspace?.name}
            onRefresh={loadGuestWorkspace}
            onSave={() => console.log("💾 Save dashboard changes")}
            onCustomizeBackground={() => {
              setShowBackgroundCustomizer(true);
            }}
            onSaveTemplate={() => setIsSaveTemplateOpen(true)}
            onCloneDashboard={() => console.log("📋 Clone dashboard")}
            onCreateBlank={handleCreateBlank}
          />
        }
      >
        {selectedCompany ? (
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
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {getEntityName(selectedCompany)}
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
                  company: getEntityName(selectedCompany),
                })
              }
              onAddPrompt={() => {
                setIsAddPromptOpen(true);
              }}
              onDeleteTile={handleDeleteTile}
              isGeneratingCustomTile={isGeneratingCustomTile}
              isGeneratingTiles={
                generatingTiles ||
                selectedCompany.tiles_status === "pending" ||
                selectedCompany.tiles_status === "generating"
              }
              tilesToGenerate={selectedCompany.tiles_to_generate || 6}
              onReorder={handleTilesReorder}
            />
          </div>
        ) : (
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

        {selectedCompany && (
          <div className="mb-8">
            <NotesEditor
              companyId={getEntityName(selectedCompany)}
              companyName={getEntityName(selectedCompany)}
            />
          </div>
        )}

        {selectedCompany && (
          <div className="mb-8">
            <FilesManager
              companyId={selectedCompany.id}
              companyName={getEntityName(selectedCompany)}
            />
          </div>
        )}
      </AppLayout>

      {/* Modals */}
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
        companyName={
          selectedCompany ? getEntityName(selectedCompany) : undefined
        }
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
        companyName={selectedCompany?.name || "your company"}
      />

      <SaveTemplateModal
        isOpen={isSaveTemplateOpen}
        onClose={() => setIsSaveTemplateOpen(false)}
        onSave={handleSaveTemplateData}
        currentTiles={selectedCompany?.tiles || []}
      />

      <TemplatePreviewModal
        template={currentTemplate}
        isOpen={showTemplatePreview}
        onClose={() => setShowTemplatePreview(false)}
        onApply={handleTemplateApply}
      />

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
