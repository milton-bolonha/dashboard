"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import {
  createTileDebugLogger,
  debugTileStates,
} from "@/lib/tile-debug-logger";
import { useSSE } from "@/hooks/useSSE";

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
// ⭐ REMOVIDO: AdminOnboardingModal - LoadingModal já mostra progresso

export const dynamic = "force-dynamic";

/**
 * Admin Dashboard Container
 * Gerencia toda a lógica de estado e chamadas de API
 */
export function AdminDashboardContainer() {
  noStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const jobIdFromUrl = searchParams?.get("job_id");

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
  const [tileProgress, setTileProgress] = useState({
    current: 0,
    total: 0,
    remaining: 0,
  }); // ⭐ NOVO: Progresso dos tiles

  // ⭐ BUG FIX: Rastrear se usuário fechou o modal manualmente
  const userClosedModalRef = useRef(false);

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

  // ⭐ CRÍTICO: Declarar jobInfo ANTES de usar nos useEffects
  const [jobInfo, setJobInfo] = useState(null);
  const [jobInfoError, setJobInfoError] = useState(null);
  const guestIdFromUrl = searchParams?.get("guest_id");

  // ⭐ NOVO: Helper para extrair nome da company do jobInfo
  const getCompanyNameFromJob = () => {
    console.debug("[AdminContainer] 🔍 getCompanyNameFromJob chamado:", {
      hasJobInfo: !!jobInfo,
      hasInitialItems: !!jobInfo?.initialItems,
      initialItemsType: Array.isArray(jobInfo?.initialItems)
        ? "array"
        : typeof jobInfo?.initialItems,
      initialItemsLength: Array.isArray(jobInfo?.initialItems)
        ? jobInfo.initialItems.length
        : 0,
    });

    if (
      jobInfo?.initialItems &&
      Array.isArray(jobInfo.initialItems) &&
      jobInfo.initialItems.length > 0
    ) {
      const firstItem = jobInfo.initialItems[0];

      console.debug("[AdminContainer] 🔍 Primeiro item completo:", {
        keys: Object.keys(firstItem),
        researchTarget: firstItem.researchTarget || "N/A",
        company: firstItem.company || "N/A",
        name: firstItem.name || "N/A",
      });

      // ⭐ CORREÇÃO: researchTarget é o nome da empresa a pesquisar (companies.name)
      const companyName =
        firstItem.researchTarget || firstItem.company || firstItem.name;

      if (companyName && companyName !== "Preview Company") {
        console.log(
          "[AdminContainer] ✅ Nome da company extraído do job:",
          companyName
        );
        return companyName;
      } else {
        console.warn(
          "[AdminContainer] ⚠️ Nome da company inválido ou vazio, usando fallback"
        );
      }
    } else {
      console.warn(
        "[AdminContainer] ⚠️ initialItems não disponível no jobInfo"
      );
    }

    return "Preview Company"; // Fallback
  };

  // Auto-selecionar primeira entidade quando workspace carregar
  useEffect(() => {
    if (!workspace?.workspace) return;

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
    } else {
      entities = workspace.workspace.companies || [];
    }

    if (entities && entities.length > 0) {
      // ⭐ CORREÇÃO CRÍTICA: Se há job_id, tentar encontrar company pelo nome do researchTarget
      if (jobIdFromUrl && jobInfo?.initialItems?.[0]?.researchTarget) {
        const researchTarget = jobInfo.initialItems[0].researchTarget;
        const matchingCompany = entities.find(
          (e) => e.name === researchTarget || e.title === researchTarget
        );

        if (matchingCompany) {
          console.log(
            `🎯 Company encontrada no workspace pelo researchTarget:`,
            matchingCompany.name,
            `(${matchingCompany.tiles?.length || 0} tiles, status: ${
              matchingCompany.tiles_status
            })`
          );

          // ⭐ BUG FIX CRÍTICO: Se há job_id ativo, NÃO usar tiles antigos do workspace
          // Criar company temporária limpa para usar apenas tiles do job atual
          if (jobIdFromUrl) {
            console.log(
              `⚠️ Job_id detectado - ignorando tiles antigos do workspace, usando apenas tiles do job atual`
            );
            // Não retornar aqui - deixar criar company temporária
            return; // Mas ainda não setar a company antiga
          }

          setSelectedCompany(matchingCompany);

          // ⭐ CORREÇÃO: Se tiles estão completos ou tem tiles, desativar loading
          if (
            matchingCompany.tiles_status === "completed" ||
            (matchingCompany.tiles?.length || 0) > 0
          ) {
            console.log(
              `✅ Desativando loading - company encontrada com tiles`
            );
            setGeneratingTiles(false);
            setShowLoadingModal(false);
          }

          return;
        }
      }

      // Se não há company selecionada OU se não encontrou match com job_id, selecionar primeira
      if (!selectedCompany) {
        console.log(
          `🎯 Auto-selecionando primeira entidade:`,
          entities[0].name || entities[0].title
        );
        setSelectedCompany(entities[0]);
      } else if (selectedCompany?.id?.startsWith("temp_")) {
        // ⭐ NOVO: Se há company temporária, tentar substituir pela do workspace se match por nome
        const matchingCompany = entities.find(
          (e) =>
            e.name === selectedCompany.name || e.title === selectedCompany.name
        );

        if (matchingCompany) {
          console.log(
            `🔍 Company encontrada no workspace:`,
            matchingCompany.name,
            {
              id: matchingCompany.id,
              tilesCount: matchingCompany.tiles?.length || 0,
              tiles_status: matchingCompany.tiles_status,
              hasTiles: !!matchingCompany.tiles?.length,
              firstTileId: matchingCompany.tiles?.[0]?.id,
              firstTileTitle: matchingCompany.tiles?.[0]?.title,
            }
          );

          // ⭐ BUG FIX CRÍTICO: Se há job_id ativo, NÃO substituir company temporária
          // Manter company temporária para usar apenas tiles do job atual (SSE)
          if (jobIdFromUrl) {
            console.log(
              `⚠️ Job_id detectado - mantendo company temporária, ignorando tiles antigos do workspace`
            );
            return; // Não substituir
          }

          // ⭐ CORREÇÃO: Sempre substituir company temporária pela do workspace
          // O workspace tem a fonte de verdade dos tiles (MAS só se não há job_id)
          console.log(
            `🔄 Substituindo company temporária pela do workspace:`,
            matchingCompany.name,
            `(${matchingCompany.tiles?.length || 0} tiles, status: ${
              matchingCompany.tiles_status
            })`
          );
          setSelectedCompany(matchingCompany);

          // ⭐ CORREÇÃO: Se tiles estão completos ou tem tiles, desativar loading
          if (
            matchingCompany.tiles_status === "completed" ||
            (matchingCompany.tiles?.length || 0) > 0
          ) {
            console.log(
              `✅ Desativando loading - tiles_status: ${
                matchingCompany.tiles_status
              }, tiles: ${matchingCompany.tiles?.length || 0}`
            );
            setGeneratingTiles(false);
            setShowLoadingModal(false);
          }
        }
      }
    }
  }, [workspace, jobInfo, jobIdFromUrl, selectedCompany?.name]);

  // ⭐ NOVO: Monitorar atualizações do workspace para atualizar company selecionada
  useEffect(() => {
    if (!workspace?.workspace || !selectedCompany) return;

    const theme = workspace.workspace.themeSnapshot;
    let entities = [];
    let entityKey = "companies";

    if (theme) {
      const primaryEntity = theme.entities.find((e) => e.isPrimary);
      entityKey = `${primaryEntity.id}s`;
      if (entityKey === "companys") entityKey = "companies";
      entities = workspace.workspace[entityKey] || [];
    } else {
      entities = workspace.workspace.companies || [];
    }

    // ⭐ CORREÇÃO: Encontrar company atualizada no workspace e atualizar se tiver mais tiles
    const updatedCompany = entities.find(
      (e) =>
        e.name === selectedCompany.name ||
        e.title === selectedCompany.name ||
        e.id === selectedCompany.id ||
        (!selectedCompany.id?.startsWith("temp_") &&
          e.id === selectedCompany.id)
    );

    if (updatedCompany) {
      const currentTilesCount = selectedCompany.tiles?.length || 0;
      const updatedTilesCount = updatedCompany.tiles?.length || 0;

      // ⭐ CORREÇÃO CRÍTICA: Se há company temporária E workspace tem tiles, SEMPRE substituir
      // MAS: Se há job_id ativo, NÃO substituir - manter company temporária com tiles do SSE
      const isTempCompany = selectedCompany.id?.startsWith("temp_");
      const hasActiveJob = !!jobIdFromUrl;

      // ⭐ BUG FIX: Se há job_id, não atualizar com tiles antigos do workspace
      if (hasActiveJob && isTempCompany) {
        console.debug(
          `⏭️ Job_id ativo - ignorando atualização do workspace (mantendo tiles do SSE)`
        );
        return; // Não atualizar se há job ativo
      }

      const shouldUpdate =
        updatedTilesCount > currentTilesCount ||
        updatedCompany.tiles_status !== selectedCompany.tiles_status ||
        (updatedTilesCount > 0 && isTempCompany) ||
        (isTempCompany && updatedTilesCount > 0);

      if (shouldUpdate) {
        console.log(
          `🔄 [CRÍTICO] Atualizando company do workspace:`,
          updatedCompany.name,
          {
            currentTiles: currentTilesCount,
            updatedTiles: updatedTilesCount,
            currentStatus: selectedCompany.tiles_status,
            updatedStatus: updatedCompany.tiles_status,
            isTempCompany,
            firstTileId: updatedCompany.tiles?.[0]?.id,
            firstTileTitle: updatedCompany.tiles?.[0]?.title,
            firstTileHasAnswer: !!updatedCompany.tiles?.[0]?.answer,
            firstTileHasExcerpt: !!updatedCompany.tiles?.[0]?.excerpt,
          }
        );
        setSelectedCompany(updatedCompany);

        // Se tiles estão completos ou tem tiles, desativar loading
        if (
          updatedCompany.tiles_status === "completed" ||
          (updatedTilesCount > 0 &&
            updatedCompany.tiles_status !== "generating")
        ) {
          console.log(
            `✅ Desativando loading - tiles do workspace carregados (${updatedTilesCount} tiles)`
          );
          setGeneratingTiles(false);
          // ⭐ BUG FIX: Só fechar modal se usuário não fechou manualmente antes
          if (!userClosedModalRef.current) {
            setShowLoadingModal(false);
          }
        }
      } else {
        console.debug(
          `⏭️ Não atualizando company - sem mudanças significativas`,
          {
            currentTiles: currentTilesCount,
            updatedTiles: updatedTilesCount,
            isTempCompany,
          }
        );
      }
    }
  }, [
    workspace?.workspace?.companies,
    workspace?.workspace,
    selectedCompany?.name,
    selectedCompany?.id,
    jobIdFromUrl, // ⭐ Adicionar jobIdFromUrl para ignorar atualizações quando há job ativo
  ]);

  // ⭐ CRITICAL: Detectar status de geração de tiles e mostrar loading
  useEffect(() => {
    if (!selectedCompany) return;

    const status = selectedCompany.tiles_status;
    const tilesCount = selectedCompany.tiles?.length || 0;
    const expectedTiles = selectedCompany.tiles_to_generate || 8; // ⭐ CORREÇÃO: Template tem 8 tiles

    console.debug("🔍 Debug geração de tiles:", {
      status,
      tilesCount,
      expectedTiles,
      generatingTiles,
    });

    // ⭐ CRITICAL: Status "pending" ou "generating" deve mostrar tiles de loading
    if ((status === "pending" || status === "generating") && !generatingTiles) {
      console.log(`🚀 Status: ${status} - Mostrando tiles de loading`);
      setGeneratingTiles(true);
      // ⭐ BUG FIX: Só mostrar modal se não foi fechado pelo usuário E não há tiles ainda
      // Se já há tiles sendo gerados, mostrar cards de loading ao invés do modal
      if (
        !userClosedModalRef.current &&
        (!selectedCompany?.tiles || selectedCompany.tiles.length === 0)
      ) {
        setShowLoadingModal(true);
      }

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

    // ⭐ CORREÇÃO: Se tiles já estão completos no workspace, desativar loading imediatamente
    if (status === "completed" && tilesCount > 0 && generatingTiles) {
      console.log(
        `✅ Tiles já completos no workspace (${tilesCount} tiles), desativando loading`
      );
      setGeneratingTiles(false);
      setShowLoadingModal(false);
    }
  }, [
    selectedCompany?.name,
    selectedCompany?.tiles_status,
    selectedCompany?.tiles?.length,
  ]);

  // ⭐ NOVO: Buscar informações do job quando há job_id (ANTES de carregar workspace)
  // ⭐ CORREÇÃO: jobInfo já foi declarado acima

  useEffect(() => {
    if (!jobIdFromUrl) return;

    console.debug(
      "[AdminContainer] 🔍 Buscando informações do job:",
      jobIdFromUrl
    );
    const url = `/api/prompt-jobs/${jobIdFromUrl}${
      guestIdFromUrl ? `?guest_id=${guestIdFromUrl}` : ""
    }`;
    console.debug("[AdminContainer] 📡 URL de busca:", url);

    fetch(url)
      .then((res) => {
        console.debug("[AdminContainer] 📥 Response status:", res.status);
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error(`Job ${jobIdFromUrl} não encontrado`);
          } else if (res.status === 401 || res.status === 403) {
            throw new Error(`Acesso negado ao job ${jobIdFromUrl}`);
          }
          throw new Error(`Erro HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(async (data) => {
        console.debug("[AdminContainer] 📋 Job info recebida:", data);
        console.debug("[AdminContainer] 🔍 initialItems no jobInfo:", {
          hasInitialItems: !!data.initialItems,
          isArray: Array.isArray(data.initialItems),
          length: Array.isArray(data.initialItems)
            ? data.initialItems.length
            : "N/A",
          firstItem: data.initialItems?.[0],
          allKeys: Object.keys(data),
        });

        if (data.jobId) {
          setJobInfo(data);
          setJobInfoError(null);
          const totalItems = data.totals?.items || 6;
          console.debug(
            "[AdminContainer] 📊 Total de items do job:",
            totalItems
          );

          // ⭐ NOVO: Se o job já está COMPLETED, buscar resultados do banco
          if (data.status === "COMPLETED" && data.totals?.completed > 0) {
            console.log(
              "[AdminContainer] ⚡ Job já concluído, buscando resultados..."
            );
            try {
              const resultsUrl = `/api/prompt-jobs/${jobIdFromUrl}/results${
                guestIdFromUrl ? `?guest_id=${guestIdFromUrl}` : ""
              }`;
              const resultsRes = await fetch(resultsUrl);
              if (resultsRes.ok) {
                const resultsData = await resultsRes.json();
                console.log(
                  "[AdminContainer] ✅ Resultados carregados:",
                  resultsData.items?.length || 0
                );

                // Criar company temporária se não existe
                if (!selectedCompany) {
                  let companyName = "Preview Company";
                  if (
                    data.initialItems &&
                    Array.isArray(data.initialItems) &&
                    data.initialItems.length > 0
                  ) {
                    const firstItem = data.initialItems[0];
                    // ⭐ CORREÇÃO: researchTarget é o nome da empresa a pesquisar (companies.name)
                    companyName =
                      firstItem.researchTarget ||
                      firstItem.company ||
                      firstItem.name ||
                      companyName;
                    console.log(
                      "[AdminContainer] 📝 Nome da company extraído dos items:",
                      companyName
                    );
                  }

                  // Converter resultados para tiles
                  const tiles = (resultsData.items || []).map((item) => ({
                    id: `tile_${jobIdFromUrl}_${item.orderIndex}`,
                    orderIndex: item.orderIndex,
                    title: `Insight ${item.orderIndex + 1}`,
                    content: item.result || "",
                    status: "completed",
                    createdAt: item.createdAt || new Date().toISOString(),
                    metrics: item.metrics,
                  }));

                  const tempCompany = {
                    id: `temp_${jobIdFromUrl}`,
                    name: companyName,
                    title: companyName,
                    tiles,
                    tiles_status: "completed",
                    tiles_to_generate: totalItems,
                  };
                  setSelectedCompany(tempCompany);
                  console.log(
                    "[AdminContainer] ✅ Company temporária criada com tiles:",
                    tempCompany
                  );
                  setGeneratingTiles(false);
                  setShowLoadingModal(false);
                  return;
                }
              }
            } catch (resultsErr) {
              console.error(
                "[AdminContainer] ❌ Erro ao buscar resultados:",
                resultsErr
              );
            }
          }

          // ⭐ CRÍTICO: Criar company temporária se não existe workspace/company ainda
          if (!selectedCompany) {
            console.log("[AdminContainer] 🏗️  Criando company temporária...");
            // ⭐ NOVO: Extrair nome da company dos items iniciais do job
            let companyName = "Preview Company";
            if (
              data.initialItems &&
              Array.isArray(data.initialItems) &&
              data.initialItems.length > 0
            ) {
              const firstItem = data.initialItems[0];
              // ⭐ CORREÇÃO: researchTarget é o nome da empresa a pesquisar (companies.name)
              companyName =
                firstItem.researchTarget ||
                firstItem.company ||
                firstItem.name ||
                companyName;
              console.log(
                "[AdminContainer] 📝 Nome da company extraído dos items:",
                companyName
              );
            }
            const tempCompany = {
              id: `temp_${jobIdFromUrl}`,
              name: companyName,
              title: companyName,
              tiles: [],
              tiles_status: "generating",
              tiles_to_generate: totalItems,
            };
            setSelectedCompany(tempCompany);
            console.log(
              "[AdminContainer] ✅ Company temporária criada:",
              tempCompany
            );
          } else {
            // Atualizar company existente com tiles_to_generate
            setSelectedCompany({
              ...selectedCompany,
              tiles_to_generate: totalItems,
              tiles_status: "generating",
            });
          }

          // Mostrar loading modal e setar estado de geração
          console.log("[AdminContainer] 🚀 Ativando estados de loading...");
          setGeneratingTiles(true);
          setShowLoadingModal(true);
        } else {
          console.warn(
            "[AdminContainer] ⚠️  Job info inválida ou não encontrada"
          );
          setJobInfoError("Job info inválida");
        }
      })
      .catch((err) => {
        console.error("[AdminContainer] ❌ Erro ao buscar job info:", err);
        setJobInfoError(err.message || "Erro desconhecido ao buscar job");
        // Não quebrar a UI, apenas logar o erro
      });
  }, [jobIdFromUrl, guestIdFromUrl]);

  // ⭐ NOVO: Tentar criar workspace quando jobInfo estiver disponível e workspace não existir
  const creatingWorkspaceRef = useRef(false);
  const hasTriedCreateRef = useRef(false); // ⭐ Prevenir múltiplas tentativas
  useEffect(() => {
    if (
      !jobIdFromUrl ||
      !guestIdFromUrl ||
      !jobInfo ||
      workspace ||
      loading ||
      creatingWorkspaceRef.current ||
      hasTriedCreateRef.current // ⭐ Prevenir tentativas repetidas
    ) {
      return;
    }

    // ⭐ CORREÇÃO: Só tentar criar se initialItems tiver dados válidos
    const hasValidInitialItems =
      jobInfo.initialItems &&
      Array.isArray(jobInfo.initialItems) &&
      jobInfo.initialItems.length > 0 &&
      jobInfo.initialItems[0] &&
      Object.keys(jobInfo.initialItems[0]).some(
        (key) => key !== "orderIndex" && jobInfo.initialItems[0][key]
      );

    if (!hasValidInitialItems) {
      console.log(
        "[AdminContainer] ⏳ JobInfo sem initialItems válidos, aguardando..."
      );
      return;
    }

    console.log(
      "[AdminContainer] 🔄 JobInfo carregado com initialItems válidos, tentando criar workspace..."
    );
    creatingWorkspaceRef.current = true;
    hasTriedCreateRef.current = true; // ⭐ Marcar como tentado
    // Tentar carregar workspace novamente (vai criar se não existir)
    loadGuestWorkspace().finally(() => {
      creatingWorkspaceRef.current = false;
    });
  }, [jobInfo, jobIdFromUrl, guestIdFromUrl, workspace, loading]);

  // ⭐ BUG FIX: Mostrar modal imediatamente se há job_id na URL (só na primeira vez)
  // ⭐ CRÍTICO: Só mostrar se não há tiles ainda e não foi fechado pelo usuário
  useEffect(() => {
    if (jobIdFromUrl && !userClosedModalRef.current) {
      // ⭐ BUG FIX: Só mostrar se realmente não há tiles do workspace ainda
      const hasTilesFromWorkspace = workspace?.workspace?.companies?.some(
        (c) => c.tiles && c.tiles.length > 0
      );

      if (!hasTilesFromWorkspace) {
        console.log(
          "[AdminContainer] 🚀 Job_id detectado no mount - ativando modal de loading imediatamente..."
        );
        setShowLoadingModal(true);
        setGeneratingTiles(true);
      } else {
        console.log(
          "[AdminContainer] ⏭️ Job_id detectado mas já há tiles no workspace, não mostrando modal"
        );
      }
    }
  }, [jobIdFromUrl, workspace?.workspace?.companies]);

  // Load workspace on mount
  useEffect(() => {
    console.debug("🔍 Admin useEffect executado");
    console.debug("📞 Chamando loadGuestWorkspace...");

    // ⭐ CRÍTICO: Sempre carregar workspace (mesmo com job_id)
    // O workspace é necessário para ter companies e estrutura básica da UI
    // ⭐ CORREÇÃO: Não criar automaticamente aqui - deixar o useEffect acima cuidar disso
    // quando jobInfo estiver disponível
    loadGuestWorkspace().catch((err) => {
      // ⭐ CORREÇÃO: Não logar erro se for 404 esperado (workspace será criado depois)
      if (err.message && err.message.includes("404")) {
        console.log(
          "[AdminContainer] ℹ️ Workspace não encontrado no mount - será criado quando jobInfo estiver disponível"
        );
      } else {
        console.error("[AdminContainer] ❌ Erro no loadGuestWorkspace:", err);
      }
      // Não quebrar a UI, apenas logar o erro
    });
  }, [router]);

  // ⭐ NOVO: Integração SSE para atualizar tiles quando há job_id
  const tokenFromUrl = searchParams?.get("token");
  const streamUrl = jobIdFromUrl
    ? `/api/streams/jobs/${jobIdFromUrl}${
        guestIdFromUrl ? `?guest_id=${guestIdFromUrl}` : ""
      }${
        tokenFromUrl ? `${guestIdFromUrl ? "&" : "?"}token=${tokenFromUrl}` : ""
      }`
    : null;

  // ⭐ CRÍTICO: Usar useRef para listeners estáveis (evitar reconexões constantes)
  const selectedCompanyRef = useRef(selectedCompany);
  const workspaceRef = useRef(workspace);
  const jobIdFromUrlRef = useRef(jobIdFromUrl);
  const jobInfoRef = useRef(jobInfo);

  // Atualizar refs quando valores mudam
  useEffect(() => {
    selectedCompanyRef.current = selectedCompany;
  }, [selectedCompany]);
  useEffect(() => {
    workspaceRef.current = workspace;
  }, [workspace]);
  useEffect(() => {
    jobIdFromUrlRef.current = jobIdFromUrl;
  }, [jobIdFromUrl]);
  useEffect(() => {
    jobInfoRef.current = jobInfo;
  }, [jobInfo]);

  // ⭐ NOVO: Helper para extrair nome da company do jobInfo (via ref)
  const getCompanyNameFromJobRef = () => {
    const job = jobInfoRef.current;

    console.debug("[AdminContainer] 🔍 getCompanyNameFromJobRef chamado:", {
      hasJob: !!job,
      hasInitialItems: !!job?.initialItems,
      initialItemsType: Array.isArray(job?.initialItems)
        ? "array"
        : typeof job?.initialItems,
      initialItemsLength: Array.isArray(job?.initialItems)
        ? job.initialItems.length
        : 0,
    });

    if (
      job?.initialItems &&
      Array.isArray(job.initialItems) &&
      job.initialItems.length > 0
    ) {
      const firstItem = job.initialItems[0];

      console.debug("[AdminContainer] 🔍 Primeiro item completo:", {
        keys: Object.keys(firstItem),
        researchTarget: firstItem.researchTarget || "N/A",
        company: firstItem.company || "N/A",
        name: firstItem.name || "N/A",
      });

      // ⭐ CORREÇÃO: researchTarget é o nome da empresa a pesquisar (companies.name)
      const companyName =
        firstItem.researchTarget || firstItem.company || firstItem.name;

      if (companyName && companyName !== "Preview Company") {
        console.log(
          "[AdminContainer] ✅ Nome da company extraído do job (via ref):",
          companyName
        );
        return companyName;
      } else {
        console.warn(
          "[AdminContainer] ⚠️ Nome da company inválido ou vazio, usando fallback"
        );
      }
    } else {
      console.warn(
        "[AdminContainer] ⚠️ initialItems não disponível no job (via ref)"
      );
    }

    return "Preview Company"; // Fallback
  };

  // ⭐ CRÍTICO: Criar listeners ANTES do useSSE ser chamado
  // Inicializar com objeto vazio para evitar passar null/undefined
  const listenersRef = useRef({
    "sse:connected": (data) => {
      console.debug("[AdminContainer] ✅ SSE Connected:", data);
    },
    "job:status": (data) => {
      console.debug("[AdminContainer] 📊 job:status recebido:", data);
      if (!jobIdFromUrlRef.current) {
        console.warn("[AdminContainer] ⚠️  Sem jobIdFromUrl, ignorando evento");
        return;
      }

      // ⭐ CRÍTICO: Se não há company, criar temporária baseado no evento
      let currentCompany = selectedCompanyRef.current;
      if (!currentCompany && data?.progress?.total) {
        console.log(
          "[AdminContainer] 🏗️  Criando company temporária via job:status..."
        );
        const companyName = getCompanyNameFromJobRef();
        const tempCompany = {
          id: `temp_${jobIdFromUrlRef.current}`,
          name: companyName,
          title: companyName,
          tiles: [],
          tiles_status: "generating",
          tiles_to_generate: data.progress.total,
        };
        setSelectedCompany(tempCompany);
        selectedCompanyRef.current = tempCompany;
        currentCompany = tempCompany;
        setGeneratingTiles(true);
        // ⭐ BUG FIX: Só mostrar modal se não foi fechado pelo usuário E não há tiles ainda
        if (
          !userClosedModalRef.current &&
          (!currentCompany?.tiles || currentCompany.tiles.length === 0)
        ) {
          setShowLoadingModal(true);
        }
      }

      if (!currentCompany) {
        console.warn(
          "[AdminContainer] ⚠️  Sem company, ignorando evento (aguardando criação)"
        );
        return;
      }

      // Se receber progress.total, atualizar tiles_to_generate e status
      // ⭐ IMPORTANTE: NÃO criar placeholders aqui - deixar SortableTilesGrid criar LoadingTiles
      if (data?.progress?.total) {
        const total = data.progress.total;
        const current =
          data.progress.current || currentCompany.tiles?.length || 0;
        const remaining = Math.max(total - current, 0);

        console.log(
          `[AdminContainer] 📊 Progress: ${current}/${total} tiles (remaining: ${remaining})`
        );

        // ⭐ NOVO: Atualizar progresso para o LoadingModal
        setTileProgress({ current, total, remaining });

        // Atualizar company com tiles_to_generate (para o SortableTilesGrid criar LoadingTiles)
        const updatedCompany = {
          ...currentCompany,
          tiles_status: "generating",
          tiles_to_generate: total,
        };

        setSelectedCompany(updatedCompany);
        selectedCompanyRef.current = updatedCompany;
        setGeneratingTiles(true);
        console.log(
          `[AdminContainer] ✅ Company atualizada: tiles_to_generate=${total}, status=generating`
        );
      }

      // Atualizar status se job completou
      if (data?.status === "COMPLETED") {
        console.log("[AdminContainer] ✅ Job completado!");
        setGeneratingTiles(false);
        setShowLoadingModal(false);
        // ⭐ NOVO: Atualizar progresso final
        const finalTotal =
          data?.progress?.total || currentCompany.tiles_to_generate || 0;
        setTileProgress({
          current: finalTotal,
          total: finalTotal,
          remaining: 0,
        });
        if (currentCompany) {
          const completedCompany = {
            ...currentCompany,
            tiles_status: "completed",
          };
          setSelectedCompany(completedCompany);
          selectedCompanyRef.current = completedCompany;
        }
      }
    },
    "job:result-completed": (data) => {
      console.debug("[AdminContainer] ✨ job:result-completed recebido:", data);

      if (typeof data?.orderIndex !== "number") {
        console.warn(
          "[AdminContainer] ⚠️  orderIndex inválido:",
          data?.orderIndex
        );
        return;
      }

      // ⭐ CRÍTICO: Se não há company, criar temporária
      let currentCompany = selectedCompanyRef.current;
      if (!currentCompany && jobIdFromUrlRef.current) {
        console.log(
          "[AdminContainer] 🏗️  Criando company temporária via job:result-completed..."
        );
        const companyName = getCompanyNameFromJobRef();
        const tempCompany = {
          id: `temp_${jobIdFromUrlRef.current}`,
          name: companyName,
          title: companyName,
          tiles: [],
          tiles_status: "generating",
          tiles_to_generate: 8, // ⭐ CORREÇÃO: Template tem 8 tiles, será atualizado quando job:status chegar
        };
        setSelectedCompany(tempCompany);
        selectedCompanyRef.current = tempCompany;
        currentCompany = tempCompany;
        setGeneratingTiles(true);
        // ⭐ BUG FIX: Só mostrar modal se não foi fechado pelo usuário E não há tiles ainda
        if (
          !userClosedModalRef.current &&
          (!currentCompany?.tiles || currentCompany.tiles.length === 0)
        ) {
          setShowLoadingModal(true);
        }
      }

      if (!currentCompany) {
        console.warn(
          "[AdminContainer] ⚠️  Sem company, ignorando result-completed"
        );
        return;
      }

      // Criar/atualizar tile com o resultado
      // ⭐ BUG 1 FIX: Garantir que tile tem todas as propriedades para não ser marcado como placeholder
      // ⭐ BUG FIX: Validar que tem conteúdo antes de criar tile
      if (!data.result && !data.content && !data.answer) {
        console.warn(
          `[AdminContainer] ⚠️ Tile orderIndex=${data.orderIndex} sem conteúdo, ignorando...`
        );
        return;
      }

      const newTile = {
        id: `tile_${jobIdFromUrlRef.current}_${data.orderIndex}`,
        orderIndex: data.orderIndex,
        title: data.title || `Insight ${data.orderIndex + 1}`,
        content: data.result || data.content || "",
        answer: data.result || data.answer || "",
        excerpt: data.excerpt || data.result?.substring(0, 200) || "",
        status: "completed",
        createdAt: data.createdAt || new Date().toISOString(),
        metrics: data.metrics,
        isPlaceholder: false, // ⭐ EXPLÍCITO: Não é placeholder
      };

      console.log(
        `[AdminContainer] 🎯 Atualizando tile orderIndex=${data.orderIndex}`,
        {
          tileId: newTile.id,
          orderIndex: newTile.orderIndex,
          title: newTile.title,
          contentLength: newTile.content?.length || 0,
          hasContent: !!(newTile.content || newTile.answer || newTile.excerpt),
        }
      );

      // Atualizar tiles da company
      // ⭐ BUG 1 FIX: Substituir placeholder por tile real baseado em orderIndex
      const currentTiles = currentCompany.tiles || [];

      console.log(
        `[AdminContainer] 🔍 Tiles atuais antes da atualização:`,
        currentTiles.map((t) => ({
          id: t.id,
          orderIndex: t.orderIndex,
          isPlaceholder: t.isPlaceholder,
          hasContent: !!(t.content || t.answer || t.excerpt),
        }))
      );

      // ⭐ BUG FIX CRÍTICO: Evitar duplicação - manter apenas o tile mais completo/recente para cada orderIndex
      // Usar Map para garantir um único tile por orderIndex
      const tilesByOrderIndex = new Map();
      currentTiles.forEach((t) => {
        const existing = tilesByOrderIndex.get(t.orderIndex);
        const hasContent = !!(t.content || t.answer || t.excerpt);
        const existingHasContent =
          existing &&
          !!(existing.content || existing.answer || existing.excerpt);

        // Se não existe ou o novo tem conteúdo e o existente não, substituir
        if (!existing || (hasContent && !existingHasContent)) {
          tilesByOrderIndex.set(t.orderIndex, t);
        } else if (hasContent && existingHasContent) {
          // Se ambos têm conteúdo, manter o mais recente pelo título (tiles com mesmo título devem ter mesmo conteúdo)
          // Se títulos diferentes, manter o mais recente
          if (t.title !== existing.title) {
            const existingTime = existing.createdAt
              ? new Date(existing.createdAt).getTime()
              : 0;
            const newTime = t.createdAt ? new Date(t.createdAt).getTime() : 0;
            if (newTime > existingTime) {
              tilesByOrderIndex.set(t.orderIndex, t);
            }
          } else {
            // Mesmo título, manter o mais recente
            const existingTime = existing.createdAt
              ? new Date(existing.createdAt).getTime()
              : 0;
            const newTime = t.createdAt ? new Date(t.createdAt).getTime() : 0;
            if (newTime > existingTime) {
              tilesByOrderIndex.set(t.orderIndex, t);
            }
          }
        } else if (!hasContent && !existingHasContent) {
          // Se nenhum tem conteúdo, manter o primeiro (placeholder)
          if (!existing) {
            tilesByOrderIndex.set(t.orderIndex, t);
          }
        }
      });
      const deduplicatedTiles = Array.from(tilesByOrderIndex.values());

      // Buscar por orderIndex (não por ID) para substituir placeholder correto
      const tileIndex = deduplicatedTiles.findIndex(
        (t) => t.orderIndex === data.orderIndex
      );

      let updatedTiles;
      if (tileIndex >= 0) {
        // ⭐ Substituir placeholder ou tile existente na posição correta
        const oldTile = deduplicatedTiles[tileIndex];
        updatedTiles = deduplicatedTiles.map((t) =>
          t.orderIndex === data.orderIndex ? newTile : t
        );
        console.log(
          `[AdminContainer] 🔄 Substituindo tile orderIndex=${data.orderIndex} (índice ${tileIndex})`,
          {
            oldTileId: oldTile.id,
            newTileId: newTile.id,
            wasPlaceholder: oldTile.isPlaceholder,
          }
        );
      } else {
        // ⭐ Adicionar novo tile e ordenar por orderIndex
        updatedTiles = [...deduplicatedTiles, newTile].sort(
          (a, b) => (a.orderIndex || Infinity) - (b.orderIndex || Infinity)
        );
        console.log(
          `[AdminContainer] ➕ Adicionando novo tile orderIndex=${data.orderIndex} (não encontrado nos tiles atuais)`
        );
      }

      // ⭐ BUG FIX: Remover tiles vazios (sem conteúdo) e duplicados por orderIndex
      // Manter apenas o tile mais recente/completo para cada orderIndex
      // ⭐ CORREÇÃO: Renomear para evitar conflito com variável acima
      const finalTilesByOrderIndex = new Map();
      updatedTiles.forEach((t) => {
        const hasContent = !!(t.content || t.answer || t.excerpt);
        // Só incluir se tem conteúdo OU é placeholder
        if (t.isPlaceholder || hasContent) {
          const existing = finalTilesByOrderIndex.get(t.orderIndex);
          // Se já existe, manter o que tem mais conteúdo ou o mais recente
          if (
            !existing ||
            (hasContent &&
              !existing.content &&
              !existing.answer &&
              !existing.excerpt)
          ) {
            finalTilesByOrderIndex.set(t.orderIndex, t);
          } else if (hasContent && existing.content) {
            // Se ambos têm conteúdo, manter o mais recente (maior createdAt)
            const existingTime = existing.createdAt
              ? new Date(existing.createdAt).getTime()
              : 0;
            const newTime = t.createdAt ? new Date(t.createdAt).getTime() : 0;
            if (newTime > existingTime) {
              finalTilesByOrderIndex.set(t.orderIndex, t);
            }
          }
        }
      });
      updatedTiles = Array.from(finalTilesByOrderIndex.values()).sort(
        (a, b) => (a.orderIndex || Infinity) - (b.orderIndex || Infinity)
      );

      console.log(
        `[AdminContainer] 🔍 Tiles após atualização:`,
        updatedTiles.map((t) => ({
          id: t.id,
          orderIndex: t.orderIndex,
          isPlaceholder: t.isPlaceholder,
          hasContent: !!(t.content || t.answer || t.excerpt),
        }))
      );

      console.log(
        `[AdminContainer] ✅ Tiles atualizados: ${
          updatedTiles.length
        } total (esperado: ${currentCompany.tiles_to_generate || 0})`
      );

      // ⭐ CORREÇÃO: Verificar se todos os tiles foram gerados
      // ⭐ BUG FIX: Contar apenas tiles com conteúdo (não placeholders)
      const tilesWithContent = updatedTiles.filter(
        (t) => !t.isPlaceholder && (t.content || t.answer || t.excerpt)
      );
      const expectedTiles = currentCompany.tiles_to_generate || 0;
      const allTilesGenerated = tilesWithContent.length >= expectedTiles;

      // ⭐ NOVO: Atualizar progresso baseado nos tiles gerados
      const current = tilesWithContent.length;
      const remaining = Math.max(expectedTiles - current, 0);
      setTileProgress({ current, total: expectedTiles, remaining });

      // ⭐ BUG FIX CRÍTICO: Se há tiles com conteúdo, garantir que modal NUNCA reapareça
      if (current > 0 && userClosedModalRef.current) {
        setShowLoadingModal(false);
      }

      const updatedCompany = {
        ...currentCompany,
        tiles: updatedTiles,
        // ⭐ CORREÇÃO: Atualizar status se todos os tiles foram gerados
        tiles_status: allTilesGenerated
          ? "completed"
          : currentCompany.tiles_status || "generating",
      };

      if (allTilesGenerated) {
        console.log("[AdminContainer] 🎉 Todos os tiles foram gerados!");
        setGeneratingTiles(false);
        setShowLoadingModal(false);
        setTileProgress({
          current: expectedTiles,
          total: expectedTiles,
          remaining: 0,
        });
      }

      setSelectedCompany(updatedCompany);
      selectedCompanyRef.current = updatedCompany;

      // ⭐ BUG FIX: Salvar tile no workspace quando chega via SSE (assíncrono, não bloqueia renderização)
      // Isso garante que após F5, os tiles estejam salvos no workspace
      // ⭐ IMPORTANTE: Só salvar se tile tem conteúdo (não é placeholder)
      if (jobIdFromUrlRef.current && guestIdFromUrl && newTile.content) {
        // ⭐ ASSÍNCRONO: Não esperar a resposta, apenas enviar em background
        fetch(`/api/guest/tiles?guest_id=${guestIdFromUrl}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            companyName: currentCompany.name,
            tile: newTile,
            tiles_to_generate: currentCompany.tiles_to_generate,
          }),
        })
          .then((saveTileRes) => {
            if (saveTileRes.ok) {
              console.log(
                `[AdminContainer] ✅ Tile "${newTile.title}" salvo no workspace (background)`
              );
              // ⭐ BUG FIX: Recarregar workspace após salvar para refletir mudanças
              // Mas só se todos os tiles foram gerados para evitar múltiplas requisições
              if (allTilesGenerated) {
                loadGuestWorkspace().catch(() => {
                  // Ignorar erros silenciosamente
                });
              }
            } else {
              return saveTileRes.text().then((text) => {
                console.warn(
                  `[AdminContainer] ⚠️ Erro ao salvar tile no workspace:`,
                  text || "Unknown error"
                );
              });
            }
          })
          .catch((saveErr) => {
            console.error(
              `[AdminContainer] ❌ Erro ao salvar tile no workspace:`,
              saveErr
            );
            // Não bloquear o fluxo se falhar ao salvar
          });
      }

      // Atualizar workspace também (se existe)
      const currentWorkspace = workspaceRef.current;
      if (currentWorkspace?.workspace) {
        const theme = currentWorkspace.workspace.themeSnapshot;
        let entityKey = "companies";
        if (theme) {
          const primaryEntity = theme.entities.find((e) => e.isPrimary);
          entityKey = `${primaryEntity.id}s`;
          if (entityKey === "companys") entityKey = "companies";
        }

        const updatedWorkspace = {
          ...currentWorkspace,
          workspace: {
            ...currentWorkspace.workspace,
            [entityKey]: (currentWorkspace.workspace[entityKey] || []).map(
              (company) =>
                company.name === currentCompany.name ||
                company.title === currentCompany.name ||
                company.id === currentCompany.id
                  ? updatedCompany
                  : company
            ),
          },
        };
        setWorkspace(updatedWorkspace);
        workspaceRef.current = updatedWorkspace;
      }
    },
    "job:error": (data) => {
      // ⭐ CORREÇÃO: Log mais detalhado do erro
      console.error("[AdminContainer] ❌ job:error recebido:", {
        jobId: data.jobId,
        itemId: data.itemId,
        orderIndex: data.orderIndex,
        error: data.error,
        message: data.error?.message || data.message,
      });

      // ⭐ Atualizar status do tile específico se houver itemId
      if (data.itemId && data.error) {
        // Marcar tile como erro (opcional - pode ser implementado depois)
        console.warn(
          `[AdminContainer] ⚠️ Tile ${data.orderIndex} falhou: ${
            data.error.message || data.error
          }`
        );
      }
    },
  });

  const { isConnected: sseConnected } = useSSE(streamUrl, listenersRef.current);

  // ⭐ DEBUG: Log detalhado da conexão SSE (reduzido)
  useEffect(() => {
    if (jobIdFromUrl && streamUrl && !sseConnected) {
      // Apenas logar quando não conectado para evitar spam
      console.debug("[AdminContainer] ⏳ SSE conectando...", jobIdFromUrl);
    } else if (jobIdFromUrl && streamUrl && sseConnected) {
      console.debug("[AdminContainer] ✅ SSE conectado", jobIdFromUrl);
    }
  }, [jobIdFromUrl, streamUrl, sseConnected]);

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
    console.log("[AdminContainer] ✅ Usuário fechou o modal de loading");
    setShowLoadingModal(false);
    userClosedModalRef.current = true; // ⭐ Marcar que usuário fechou manualmente
    // ⭐ Não resetar progresso aqui - ele será atualizado pelos eventos SSE
    // ⭐ Não setar generatingTiles como true aqui - isso será controlado pelos eventos SSE
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
      // ⭐ NOVO: Incluir guest_id e job_id da URL se disponível (fluxo job_id)
      const params = new URLSearchParams();
      params.set("_t", Date.now().toString());
      if (guestIdFromUrl) {
        params.set("guest_id", guestIdFromUrl);
      }
      // ⭐ BUG FIX CRÍTICO: Incluir job_id na query para filtrar tiles
      if (jobIdFromUrl) {
        params.set("job_id", jobIdFromUrl);
        console.log(
          `[AdminContainer] 🔍 Incluindo job_id na query do workspace: ${jobIdFromUrl}`
        );
      }
      const response = await fetch(
        `/api/guest/workspace?${params.toString()}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate",
            Pragma: "no-cache",
          },
        }
      );

      if (response.status === 401) {
        console.log("⚠️ Sem guest session, redirecionando para landing");
        router.push("/");
        return;
      }

      if (!response.ok) {
        // ⭐ CORREÇÃO: Melhor tratamento de erro com logs detalhados
        let errorData = {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
        };

        try {
          const text = await response.text();
          console.log(
            "[AdminContainer] 📥 Resposta de erro (text):",
            text?.substring(0, 200)
          );

          if (text && text.trim().length > 0) {
            try {
              const parsed = JSON.parse(text);
              errorData = { ...errorData, ...parsed };
            } catch (parseError) {
              errorData = {
                ...errorData,
                error: `Erro ${response.status}: ${response.statusText}`,
                rawResponse: text.substring(0, 200),
                parseError: parseError.message,
              };
            }
          } else {
            errorData = {
              ...errorData,
              error: `Erro ${response.status}: ${response.statusText}`,
              message: "Resposta vazia do servidor",
            };
          }
        } catch (textError) {
          console.error(
            "[AdminContainer] ❌ Erro ao ler response.text():",
            textError
          );
          errorData = {
            ...errorData,
            error: `Erro ${response.status}: ${response.statusText}`,
            textError: textError.message,
          };
        }

        // ⭐ CORREÇÃO: Se for 404 e vamos criar workspace, não logar como erro crítico
        const is404AndWillCreate =
          response.status === 404 && jobIdFromUrl && guestIdFromUrl;

        if (!is404AndWillCreate) {
          // ⭐ Apenas logar erro crítico se NÃO for 404 que vamos resolver
          console.error(
            "[AdminContainer] ❌ ========== ERRO NO FETCH =========="
          );
          console.error("[AdminContainer] ❌ Status:", errorData.status);
          console.error(
            "[AdminContainer] ❌ StatusText:",
            errorData.statusText
          );
          console.error("[AdminContainer] ❌ URL:", errorData.url);
          console.error(
            "[AdminContainer] ❌ ErrorData completo:",
            JSON.stringify(errorData, null, 2)
          );
          console.error(
            "[AdminContainer] ❌ ===================================="
          );
        } else {
          // ⭐ Log informativo para 404 que será resolvido
          console.log(
            "[AdminContainer] ℹ️ Workspace não encontrado (404) - será criado automaticamente"
          );
        }

        // ⭐ NOVO: Se 404 e há job_id, criar workspace automaticamente usando dados do job
        if (response.status === 404 && jobIdFromUrl && guestIdFromUrl) {
          console.log(
            "[AdminContainer] 🔧 Workspace não encontrado, mas há job_id - tentando criar workspace..."
          );

          // ⭐ CORREÇÃO: Se jobInfo não está disponível ou initialItems está vazio, buscar novamente
          let currentJobInfo = jobInfo;
          if (
            !currentJobInfo ||
            !currentJobInfo.initialItems ||
            !Array.isArray(currentJobInfo.initialItems) ||
            currentJobInfo.initialItems.length === 0
          ) {
            console.log(
              "[AdminContainer] ⏳ JobInfo não disponível ou initialItems vazio, buscando novamente..."
            );
            try {
              const jobUrl = `/api/prompt-jobs/${jobIdFromUrl}?guest_id=${guestIdFromUrl}`;
              const jobRes = await fetch(jobUrl);
              if (jobRes.ok) {
                currentJobInfo = await jobRes.json();
                console.debug("[AdminContainer] ✅ JobInfo atualizado:", {
                  hasInitialItems: !!currentJobInfo?.initialItems,
                  length: Array.isArray(currentJobInfo?.initialItems)
                    ? currentJobInfo.initialItems.length
                    : 0,
                });
              }
            } catch (err) {
              console.error("[AdminContainer] ❌ Erro ao buscar jobInfo:", err);
            }
          }

          // Extrair dados do jobInfo.initialItems
          let companyName = "Preview Company";
          let companyWebsite = "";
          let solution = "";

          console.debug("[AdminContainer] 🔍 JobInfo recebido:", {
            hasInitialItems: !!currentJobInfo?.initialItems,
            initialItemsType: Array.isArray(currentJobInfo?.initialItems)
              ? "array"
              : typeof currentJobInfo?.initialItems,
            initialItemsLength: Array.isArray(currentJobInfo?.initialItems)
              ? currentJobInfo.initialItems.length
              : "N/A",
            firstItem: currentJobInfo?.initialItems?.[0],
            allKeys: currentJobInfo ? Object.keys(currentJobInfo) : [],
          });

          if (
            currentJobInfo?.initialItems &&
            Array.isArray(currentJobInfo.initialItems) &&
            currentJobInfo.initialItems.length > 0
          ) {
            const firstItem = currentJobInfo.initialItems[0];
            console.debug(
              "[AdminContainer] 🔍 Primeiro item completo:",
              firstItem
            );
            console.debug(
              "[AdminContainer] 🔍 Campos disponíveis:",
              Object.keys(firstItem)
            );

            // ⭐ CORREÇÃO: Priorizar researchTarget (nome da empresa pesquisada)
            companyName =
              firstItem.researchTarget ||
              firstItem.company ||
              firstItem.name ||
              companyName;
            companyWebsite =
              firstItem.researchWebsite ||
              firstItem.companyWebsite ||
              firstItem.website ||
              "";
            solution = firstItem.solution || "";

            console.debug("[AdminContainer] 📝 Dados extraídos do job:", {
              companyName,
              companyWebsite,
              solution,
              source: {
                researchTarget: firstItem.researchTarget,
                company: firstItem.company,
                name: firstItem.name,
              },
            });
          } else {
            console.warn(
              "[AdminContainer] ⚠️ initialItems vazio ou inválido:",
              {
                initialItems: currentJobInfo?.initialItems,
                isArray: Array.isArray(currentJobInfo?.initialItems),
                length: Array.isArray(currentJobInfo?.initialItems)
                  ? currentJobInfo.initialItems.length
                  : "N/A",
              }
            );
            // ⭐ CORREÇÃO: Se ainda não tem initialItems, não tentar criar workspace
            // O workspace será criado quando os items chegarem via SSE ou quando recarregar a página
            console.warn(
              "[AdminContainer] ⚠️ initialItems empty - workspace will not be created automatically"
            );
            console.warn(
              "[AdminContainer] ⚠️ Please wait for tiles to be generated or reload the page when the job completes"
            );
            setLoading(false);
            setError(
              "Workspace not found and could not be created automatically. Please wait for tiles to be generated or reload the page."
            );
            return;
          }

          try {
            // ⭐ CORREÇÃO CRÍTICA: Mapear para os campos esperados pelo tema sales-assistant
            // O tema espera: company, companyWebsite, solution, target, targetWebsite
            // Não: companyName, companyUrl!
            const createParams = new URLSearchParams();
            createParams.set("guest_id", guestIdFromUrl);

            // ⭐ CORREÇÃO: Usar campos corretos do landingTags do tema sales-assistant
            const contextPayload = {
              // Campos do workspace (sales rep)
              company: "", // Será preenchido depois se necessário
              companyWebsite: "", // Será preenchido depois se necessário
              solution: solution || "",

              // Campos da company pesquisada (target)
              target: companyName || "",
              targetWebsite: companyWebsite || "",
            };

            console.debug(
              "[AdminContainer] 📤 ========== CRIANDO WORKSPACE =========="
            );
            console.debug(
              "[AdminContainer] 📤 Context payload:",
              JSON.stringify(contextPayload, null, 2)
            );
            console.debug(
              "[AdminContainer] 📤 Company Name extraído:",
              companyName
            );
            console.debug(
              "[AdminContainer] 📤 Company Website extraído:",
              companyWebsite
            );
            console.debug("[AdminContainer] 📤 Solution extraído:", solution);
            console.debug(
              "[AdminContainer] 📤 ======================================"
            );

            // ⭐ CORREÇÃO: Verificar se já não existe antes de criar (evitar race condition)
            // Se creatingWorkspaceRef.current já está true, outra tentativa está em andamento
            if (creatingWorkspaceRef.current) {
              console.log(
                "[AdminContainer] ⏳ Workspace já está sendo criado por outra requisição, aguardando..."
              );
              // Aguardar um pouco e tentar recarregar
              setTimeout(async () => {
                await loadGuestWorkspace();
              }, 1000);
              return;
            }

            creatingWorkspaceRef.current = true;
            try {
              const createResponse = await fetch(
                `/api/guest/workspace?${createParams.toString()}`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    context: contextPayload,
                    themeId: "sales-assistant", // ⭐ Garantir que usa o tema correto
                  }),
                }
              );

              if (createResponse.ok) {
                const createdWorkspace = await createResponse.json();
                console.log(
                  "[AdminContainer] ✅ Workspace criado com sucesso!"
                );
                console.log(
                  "[AdminContainer] 📦 Workspace criado:",
                  createdWorkspace.name || "N/A"
                );
                // Recarregar o workspace recém-criado
                await loadGuestWorkspace();
                // ⭐ CORREÇÃO: Retornar após criar workspace com sucesso
                // Não lançar erro de 404 se workspace foi criado
                return;
              } else {
                const createErrorText = await createResponse.text();
                console.error(
                  "[AdminContainer] ❌ Erro ao criar workspace:",
                  createErrorText
                );
                throw new Error(
                  "Não foi possível criar o workspace automaticamente."
                );
              }
            } finally {
              creatingWorkspaceRef.current = false;
            }
          } catch (createErr) {
            console.error(
              "[AdminContainer] ❌ Erro ao criar workspace:",
              createErr
            );
            // ⭐ CORREÇÃO: Não lançar erro aqui - apenas logar
            // O workspace pode já ter sido criado por outra requisição
            setLoading(false);
            return;
          }
        }

        // ⭐ CORREÇÃO: Só lançar erro 404 se NÃO tentamos criar workspace
        // Se chegou aqui e é 404, significa que não conseguiu criar
        if (response.status === 404) {
          throw new Error(
            "Workspace not found. Please try creating a new workspace."
          );
        } else if (response.status >= 500) {
          throw new Error(
            "Internal server error. Please try again in a few minutes."
          );
        } else {
          throw new Error(errorData.error || "Failed to load workspace");
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
        errorMessage = "Connection problem. Please check your internet.";
      } else if (err.message.includes("não encontrado")) {
        errorMessage =
          "Workspace not found. Please try creating a new workspace.";
      } else if (err.message.includes("servidor")) {
        errorMessage =
          "Internal server error. Please try again in a few minutes.";
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
    // ⭐ NOVO: Se job_id está na URL, desativar polling (usar SSE)
    if (jobIdFromUrl) {
      console.log("🛑 job_id detectado – desativando polling (usando SSE)");
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
      return;
    }

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
        // ⭐ NOVO: Incluir guest_id da URL se disponível (fluxo job_id)
        const params = new URLSearchParams();
        params.set("_t", Date.now().toString());
        if (guestIdFromUrl) {
          params.set("guest_id", guestIdFromUrl);
        }
        const response = await fetch(
          `/api/guest/workspace?${params.toString()}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Cache-Control": "no-cache, no-store, must-revalidate",
              Pragma: "no-cache",
            },
          }
        );

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
    jobIdFromUrl, // Adicionar para desativar polling quando há job_id
  ]);

  // ⭐ FALLBACK FINAL: Se há job_id mas não há company, criar imediatamente
  // ⭐ CRÍTICO: Este hook DEVE vir ANTES dos early returns
  // ⭐ CORREÇÃO: Só criar temporária se não há workspace ainda OU se workspace não tem companies
  useEffect(() => {
    if (jobIdFromUrl && !selectedCompany && !loading) {
      // ⭐ NOVO: Verificar se workspace já tem companies antes de criar temporária
      const theme = workspace?.workspace?.themeSnapshot;
      let entities = [];
      let entityKey = "companies";

      if (theme) {
        const primaryEntity = theme.entities.find((e) => e.isPrimary);
        entityKey = `${primaryEntity.id}s`;
        if (entityKey === "companys") entityKey = "companies";
        entities = workspace?.workspace?.[entityKey] || [];
      } else {
        entities = workspace?.workspace?.companies || [];
      }

      // Se já tem entities no workspace, não criar temporária (deixar useEffect acima cuidar)
      if (entities && entities.length > 0) {
        console.log(
          "[AdminContainer] ℹ️ Workspace já tem companies, não criando temporária"
        );
        return;
      }

      console.log(
        "[AdminContainer] 🚨 FALLBACK: Criando company temporária imediatamente..."
      );
      const companyName = getCompanyNameFromJob();
      const tempCompany = {
        id: `temp_${jobIdFromUrl}`,
        name: companyName,
        title: companyName,
        tiles: [],
        tiles_status: "generating",
        tiles_to_generate: jobInfo?.totals?.items || 8, // ⭐ CORREÇÃO: Template tem 8 tiles
      };
      setSelectedCompany(tempCompany);
      setGeneratingTiles(true);
      // ⭐ BUG FIX: Só mostrar modal se não foi fechado pelo usuário E não há tiles ainda
      if (
        !userClosedModalRef.current &&
        (!tempCompany?.tiles || tempCompany.tiles.length === 0)
      ) {
        setShowLoadingModal(true);
      }
    }

    // ⭐ BUG FIX: Se há job_id mas ainda não há company, mostrar modal imediatamente
    // MAS só se o usuário não fechou o modal antes E não há tiles completos ainda
    if (
      jobIdFromUrl &&
      !selectedCompany &&
      !loading &&
      !userClosedModalRef.current
    ) {
      // ⭐ CRÍTICO: Verificar se workspace já tem tiles completos antes de mostrar modal
      const theme = workspace?.workspace?.themeSnapshot;
      let entities = [];
      if (theme) {
        const primaryEntity = theme.entities.find((e) => e.isPrimary);
        const entityKey = `${primaryEntity.id}s`.replace(
          "companys",
          "companies"
        );
        entities = workspace?.workspace?.[entityKey] || [];
      } else {
        entities = workspace?.workspace?.companies || [];
      }

      const hasCompletedTiles = entities.some(
        (e) =>
          e.tiles_status === "completed" ||
          (e.tiles && e.tiles.length >= (e.tiles_to_generate || 8))
      );

      if (!hasCompletedTiles) {
        console.log(
          "[AdminContainer] 🚀 Job_id detectado sem company - ativando modal de loading..."
        );
        setGeneratingTiles(true);
        setShowLoadingModal(true);
      } else {
        console.log(
          "[AdminContainer] ⏭️ Job_id detectado mas já há tiles completos, não mostrando modal"
        );
      }
    }
  }, [jobIdFromUrl, selectedCompany, loading, jobInfo, workspace]);

  // ⭐ DEBUG: Log detalhado do estado (ANTES dos early returns para não quebrar hooks)
  // ⭐ COMENTADO: Log excessivo removido - descomente apenas para debug
  // if (process.env.NODE_ENV === 'development') {
  //   console.log("🔍 [Render] Estado completo:", {
  //     jobIdFromUrl,
  //     guestIdFromUrl,
  //     selectedCompany: selectedCompany ? {
  //       id: selectedCompany.id,
  //       name: selectedCompany.name,
  //       tiles_count: selectedCompany.tiles?.length || 0,
  //       tiles_status: selectedCompany.tiles_status,
  //       tiles_to_generate: selectedCompany.tiles_to_generate,
  //     } : null,
  //     generatingTiles,
  //     showLoadingModal,
  //     workspace_loaded: !!workspace,
  //     sseConnected,
  //   });
  // }

  // ⭐ BUG FIX: Mostrar modal imediatamente se há job_id na URL (antes de qualquer conteúdo)
  // O modal deve aparecer desde o início se há job_id, mesmo sem selectedCompany ainda
  // ⭐ CRÍTICO: NUNCA mostrar modal se usuário já fechou manualmente OU se tiles já estão completos
  const hasCompletedTiles =
    selectedCompany?.tiles_status === "completed" ||
    (selectedCompany?.tiles &&
      selectedCompany.tiles.length >=
        (selectedCompany?.tiles_to_generate || 8));

  const shouldShowLoadingModalEarly =
    jobIdFromUrl &&
    !userClosedModalRef.current && // ⭐ CRÍTICO: Nunca mostrar se usuário fechou
    showLoadingModal && // ⭐ Só mostrar se showLoadingModal for true (usuário pode fechar)
    !hasCompletedTiles && // ⭐ CRÍTICO: Não mostrar se tiles já estão completos
    (generatingTiles ||
      !selectedCompany ||
      selectedCompany?.tiles_status === "generating" ||
      selectedCompany?.tiles_status === "pending");

  // Render states (DEPOIS de todos os hooks)
  // ⭐ BUG FIX: Se já há tiles sendo gerados, mostrar cards ao invés de loading workspace
  if (
    loading &&
    (!selectedCompany?.tiles || selectedCompany.tiles.length === 0)
  ) {
    return (
      <>
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
        {/* ⭐ Mostrar modal mesmo durante loading se há job_id */}
        {shouldShowLoadingModalEarly && (
          <LoadingModal
            isOpen={true}
            onAccept={handleAcceptLoadingModal}
            companyName={selectedCompany?.name || "your company"}
            progress={tileProgress}
          />
        )}
      </>
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

  return (
    <>
      {/* ⭐ BUG FIX: Mostrar modal PRIMEIRO se há job_id, antes de qualquer conteúdo */}
      {shouldShowLoadingModalEarly && (
        <LoadingModal
          isOpen={true}
          onAccept={handleAcceptLoadingModal}
          companyName={selectedCompany?.name || "your company"}
          progress={tileProgress}
        />
      )}

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
            disableGuestApis={Boolean(jobIdFromUrl)}
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
              tilesToGenerate={selectedCompany.tiles_to_generate || 8} // ⭐ CORREÇÃO: Template tem 8 tiles
              onReorder={handleTilesReorder}
            />
          </div>
        ) : (
          // ⭐ BUG FIX: Não mostrar mensagem se há job_id e modal está aberto
          !shouldShowLoadingModalEarly && (
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
          )
        )}

        {/* ⭐ NOVO: Só mostrar Notes e Files se company não for temporária */}
        {selectedCompany && !selectedCompany.id?.startsWith("temp_") && (
          <div className="mb-8">
            <NotesEditor
              companyId={getEntityName(selectedCompany)}
              companyName={getEntityName(selectedCompany)}
            />
          </div>
        )}

        {selectedCompany && !selectedCompany.id?.startsWith("temp_") && (
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

      {/* ⭐ BUG FIX: Remover modal duplicado - já está sendo renderizado acima com shouldShowLoadingModalEarly */}
      {/* Modal duplicado removido para evitar dois modais */}

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

      {/* ⭐ REMOVIDO: AdminOnboardingModal - LoadingModal já mostra progresso */}
    </>
  );
}
