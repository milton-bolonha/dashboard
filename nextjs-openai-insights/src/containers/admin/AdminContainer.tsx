"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";

import { useToast } from "@/lib/state/toast-context";
import { useTileStreaming } from "@/lib/hooks/useTileStreaming";
import type {
  Contact,
  Note,
  Tile,
  TileChatAttachment,
  WorkspaceSnapshot,
} from "@/lib/types";
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
import { resolveModel } from "@/lib/ai/settings";
import { GUEST_DASHBOARD_TEMPLATES } from "@/lib/guest-templates";
import {
  deleteWorkspace as deleteCachedWorkspace,
  getLastSessionId,
  loadWorkspace as loadCachedWorkspace,
  saveWorkspace as saveCachedWorkspace,
  rememberSessionId,
  listStoredWorkspaces,
} from "@/lib/storage/workspace-browser";
import {
  getOrCreateCompanyFromWorkspace,
  createDashboard,
  getActiveDashboard,
  setActiveDashboard,
  updateDashboard,
  loadCompaniesWithDashboards,
  getCompanyById,
  deleteDashboard,
  type CompanyWithDashboards,
  type Dashboard as DashboardType,
} from "@/lib/storage/dashboards-store";
import { useAdminTheme } from "@/lib/state/admin-theme-context";
import {
  computeAdeAppearanceTokens,
  type AdeAppearanceTokens,
} from "@/lib/ade-theme";
import { getContrastingTextColor } from "@/lib/color";
import { hexToRgb, rgbToHex } from "@/lib/color";
import {
  useMembership,
  type GuestAction,
} from "@/lib/state/membership-context";
import { UpgradeModal } from "@/components/ui/UpgradeModal";

const DEFAULT_BASE_COLOR = process.env.NEXT_PUBLIC_ADE_BASE_COLOR ?? "#f5f5f0";
const BASE_COLOR_STORAGE_KEY = "ade-base-color";
const APPEARANCE_STORAGE_KEY = "ade-appearance-tokens"; // Store full appearance for immediate access after F5

// Helper function to normalize color values (used before normalizeColorValue callback is available)
function normalizeColorValueSync(value: string): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return DEFAULT_BASE_COLOR;
  }
  const candidate = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  const rgb = hexToRgb(candidate);
  if (!rgb) {
    return DEFAULT_BASE_COLOR;
  }
  const hex = rgbToHex(rgb);
  // Ensure we always return a valid hex color
  return hex && /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : DEFAULT_BASE_COLOR;
}

type WorkspaceResponse = WorkspaceSnapshot;
type WorkspaceFetcherError = Error & { status?: number; data?: unknown };
type TileChatPayload = {
  message: string;
  attachments?: TileChatAttachment[];
};

async function fetchWorkspace(url: string): Promise<WorkspaceResponse> {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    const error: WorkspaceFetcherError = new Error("Failed to load workspace");
    error.status = response.status;
    try {
      error.data = await response.json();
    } catch {
      error.data = null;
    }
    throw error;
  }
  return (await response.json()) as WorkspaceResponse;
}

export function AdminContainer() {
  // Polling state com backoff exponencial (usando apenas refs para evitar re-renders)
  const pollingAttemptsRef = useRef(0);
  const lastPollingIntervalRef = useRef(2000); // Começa com 2s

  // Ref para prevenir sincronização durante atualizações (evita race conditions)
  const isUpdatingDashboardRef = useRef(false);

  // Ref para controlar geração (evita múltiplas inicializações)
  const generationInProgressRef = useRef(false);

  const { data, error, isLoading, mutate } = useSWR<WorkspaceResponse>(
    "/api/workspace",
    fetchWorkspace,
    {
      refreshInterval: (data) => {
        // Disable polling when using streaming OR when generation is in progress
        if (shouldUseStreaming || generationState.isGenerating || generationInProgressRef.current) {
          console.log(
            "[AdminContainer] 📺 Streaming/generation active, disabling polling completely"
          );
          return 0; // Disable polling completely
        }

        // Poll every 2 seconds if no tiles yet (generation in progress)
        const hasTiles = data?.company?.tiles && data.company.tiles.length > 0;
        console.log("[AdminContainer] 🔍 Polling check:", {
          hasData: !!data,
          hasCompany: !!data?.company,
          hasTiles: !!data?.company?.tiles,
          tilesCount: data?.company?.tiles?.length || 0,
          hasCurrentDashboard: !!currentDashboard,
          currentDashboardTiles: currentDashboard?.tiles?.length || 0,
          lastGenerationTime:
            typeof window !== "undefined"
              ? window.localStorage.getItem("last-generation-time")
              : null,
        });

        if (hasTiles) {
          console.log("[AdminContainer] ✅ Tiles found via polling!", {
            tilesCount: data.company.tiles.length,
            hasCurrentCompany: !!currentCompany,
            hasCurrentDashboard: !!currentDashboard,
          });

          // If we have tiles but current dashboard doesn't, sync them
          if (
            currentCompany &&
            currentDashboard &&
            currentDashboard.tiles.length === 0
          ) {
            console.log(
              "[AdminContainer] 🔄 Syncing tiles to current dashboard",
              {
                tilesCount: data.company.tiles.length,
                companyId: currentCompany.id,
                dashboardId: currentDashboard.id,
              }
            );
            updateDashboard(currentCompany.id, currentDashboard.id, {
              tiles: data.company.tiles,
            });

            // Force refresh companies/dashboards to trigger UI update
            refreshStoredWorkspaces();
          }

          // Clear generation timestamp when tiles are detected
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("last-generation-time");
          }
          // Reset polling state
          pollingAttemptsRef.current = 0;
          lastPollingIntervalRef.current = 2000;
          console.log("[AdminContainer] ✅ Polling stopped, tiles synced");
          return 0; // Stop polling once we have tiles
        }

        // Check if workspace was recently created (likely still generating)
        const generatedAt = data?.generatedAt;
        let shouldPoll = false;

        if (generatedAt) {
          const generatedTime = new Date(generatedAt).getTime();
          const now = Date.now();
          const fiveMinutesAgo = now - 5 * 60 * 1000;
          // If generated within last 5 minutes, keep polling
          if (generatedTime > fiveMinutesAgo) {
            shouldPoll = true;
          }
        }

        // Also check if we're coming from home page (check localStorage for recent generation)
        if (!shouldPoll && typeof window !== "undefined") {
          const lastGenerationTime = window.localStorage.getItem(
            "last-generation-time"
          );
          if (lastGenerationTime) {
            const genTime = parseInt(lastGenerationTime, 10);
            const now = Date.now();
            const fiveMinutesAgo = now - 5 * 60 * 1000;
            if (genTime > fiveMinutesAgo) {
              shouldPoll = true;
              console.log(
                "[AdminContainer] 🔄 Polling: generation timestamp detected",
                {
                  genTime: new Date(genTime).toISOString(),
                  timeAgo: Math.round((now - genTime) / 1000) + "s ago",
                }
              );
            } else {
              // Clear old timestamp
              window.localStorage.removeItem("last-generation-time");
              console.log(
                "[AdminContainer] 🧹 Cleared old generation timestamp"
              );
            }
          }
        }

        // If we have a workspace but no tiles, check if it's a fresh workspace
        // Only poll if workspace was created very recently (within 2 minutes)
        if (!shouldPoll && data && generatedAt) {
          const generatedTime = new Date(generatedAt).getTime();
          const now = Date.now();
          const twoMinutesAgo = now - 2 * 60 * 1000;
          if (generatedTime > twoMinutesAgo) {
            shouldPoll = true;
            console.log(
              "[AdminContainer] 🔄 Polling: fresh workspace detected (no tiles yet)"
            );
          }
        }

        if (shouldPoll) {
          // Backoff exponencial: 2s → 3s → 4.5s → 6.75s → max 10s
          if (pollingAttemptsRef.current < 30) {
            const nextInterval = Math.min(
              Math.round(lastPollingIntervalRef.current * 1.5),
              10000 // max 10s
            );
            lastPollingIntervalRef.current = nextInterval;
            pollingAttemptsRef.current++;
            console.log(
              `[AdminContainer] 🔄 Polling (attempt ${pollingAttemptsRef.current}, interval: ${nextInterval}ms)`
            );
            return nextInterval;
          } else {
            // Max attempts reached, stop polling
            console.log(
              "[AdminContainer] ⏸️ Stopping polling (max attempts reached)"
            );
            pollingAttemptsRef.current = 0;
            lastPollingIntervalRef.current = 2000;
            return 0;
          }
        }

        console.log(
          "[AdminContainer] ⏸️ Stopping polling (no active generation detected)"
        );
        pollingAttemptsRef.current = 0;
        lastPollingIntervalRef.current = 2000;
        return 0; // Stop polling if no workspace or old generation
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );
  const { push } = useToast();
  const router = useRouter();
  const { theme } = useAdminTheme();

  // Reabilitado: Streaming é fundamental para experiência em tempo real
  // Arquitetura documentada prevê streaming + polling inteligente
  const shouldUseStreaming = useMemo(() => true, []);

  // Estado de geração independente de cookies (mais resiliente)
  const [generationState, setGenerationState] = useState<{
    isGenerating: boolean;
    sessionId: string | null;
    startedAt: number | null;
    tilesGenerated: number;
    totalTiles: number;
  }>({
    isGenerating: false,
    sessionId: null,
    startedAt: null,
    tilesGenerated: 0,
    totalTiles: 0,
  });

  // Reset generation state on page load to prevent stale states
  useEffect(() => {
    console.log("[AdminContainer] 🔄 Page loaded, resetting generation flags");
    generationInProgressRef.current = false;
    setGenerationState(prev => ({
      ...prev,
      isGenerating: false,
    }));
  }, []); // Empty dependency array - só executa na montagem

  // Safety timeout - reset generation state after 10 minutes to prevent infinite loading
  useEffect(() => {
    if (generationState.isGenerating && generationState.startedAt) {
      const timeSinceStart = Date.now() - generationState.startedAt;
      const tenMinutes = 10 * 60 * 1000;

      if (timeSinceStart > tenMinutes) {
        console.warn("[AdminContainer] ⏰ Generation timeout reached, resetting state");
        generationInProgressRef.current = false;
        setGenerationState(prev => ({
          ...prev,
          isGenerating: false,
        }));

        push({
          variant: "destructive",
          title: "Generation Timeout",
          description: "Generation took too long and was cancelled. Please try again.",
        });
      }
    }
  }, [generationState.isGenerating, generationState.startedAt, push]);
  const [baseColor, setBaseColor] = useState(() => {
    // Use default on server, will be updated on client
    if (typeof window === "undefined") {
      return DEFAULT_BASE_COLOR;
    }
    // PRIORITY 1: Load from localStorage first (most persistent)
    const stored = window.localStorage.getItem(BASE_COLOR_STORAGE_KEY);
    if (stored && stored.trim() && /^#[0-9A-Fa-f]{6}$/.test(stored.trim())) {
      // Normalize the color to ensure consistency
      const normalized = normalizeColorValueSync(stored);
      if (normalized && normalized !== "") {
        console.log(
          "[AdminContainer] 🎨 Initial state: Loading color from localStorage:",
          normalized
        );
        // Apply to body immediately
        if (document.body) {
          document.body.style.backgroundColor = normalized;
        }
        return normalized;
      }
    }
    console.log(
      "[AdminContainer] 🎨 Initial state: Using default color:",
      DEFAULT_BASE_COLOR
    );
    // Apply default to body immediately
    if (document.body) {
      document.body.style.backgroundColor = DEFAULT_BASE_COLOR;
    }
    // Save default to localStorage for consistency
    try {
      window.localStorage.setItem(BASE_COLOR_STORAGE_KEY, DEFAULT_BASE_COLOR);
    } catch {
      // Ignore storage errors
    }
    return DEFAULT_BASE_COLOR;
  });

  // Track if we've loaded from localStorage to prevent workspace from overriding
  const hasLoadedFromStorageRef = useRef(false);

  // Sync with localStorage on mount to avoid hydration mismatch
  // This runs FIRST before workspace sync to ensure user's custom color is loaded
  useEffect(() => {
    if (typeof window !== "undefined" && !hasLoadedFromStorageRef.current) {
      const stored = window.localStorage.getItem(BASE_COLOR_STORAGE_KEY);
      if (stored && /^#[0-9A-Fa-f]{6}$/.test(stored)) {
        const normalized = normalizeColorValueSync(stored);
        if (normalized !== baseColor) {
          console.log(
            "[AdminContainer] 🎨 Loading custom color from localStorage:",
            normalized
          );
          setBaseColor(normalized);
          // Apply to body immediately
          if (document.body) {
            document.body.style.backgroundColor = normalized;
          }
          hasLoadedFromStorageRef.current = true;
        } else {
          hasLoadedFromStorageRef.current = true;
        }
      } else {
        // No stored color, mark as loaded so workspace can set default
        // Ensure body has default color
        if (document.body && baseColor === DEFAULT_BASE_COLOR) {
          document.body.style.backgroundColor = DEFAULT_BASE_COLOR;
        }
        hasLoadedFromStorageRef.current = true;
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    isMember,
    isGuest,
    limits,
    usage,
    evaluateUsage,
    consumeUsage,
    startCheckout,
    markMember,
    stripeCheckoutUrl,
  } = useMembership();
  const [isUpgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<GuestAction | null>(null);
  const [isAddPromptModalOpen, setAddPromptModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setBulkUploadModalOpen] = useState(false);
  const [isCreateBlankDashboardModalOpen, setCreateBlankDashboardModalOpen] =
    useState(false);
  const [isCreatingBlankDashboard, setIsCreatingBlankDashboard] =
    useState(false);
  const [currentCompany, setCurrentCompany] =
    useState<CompanyWithDashboards | null>(null);
  const [currentDashboard, setCurrentDashboard] =
    useState<DashboardType | null>(null);

  // Calculate appearance tokens AFTER currentDashboard is declared
  const appearanceTokens = useMemo<AdeAppearanceTokens>(() => {
    console.log("[AdminContainer] 🔄 Computing appearanceTokens - START", {
      baseColor,
      hasCurrentDashboard: !!currentDashboard,
      currentDashboardId: currentDashboard?.id,
      currentDashboardAppearance: currentDashboard?.appearance,
    });

    // Ensure baseColor is never empty
    const safeBaseColor =
      baseColor && baseColor.trim() ? baseColor : DEFAULT_BASE_COLOR;

    // PRIORITY 1: Try to load from localStorage first (for immediate access after F5)
    // This ensures appearance is available before currentDashboard is loaded
    // IMPORTANT: Try to load even if baseColor is empty (might be loading from localStorage)
    if (typeof window !== "undefined") {
      try {
        const storedAppearance = window.localStorage.getItem(
          APPEARANCE_STORAGE_KEY
        );
        if (storedAppearance) {
          const parsed = JSON.parse(
            storedAppearance
          ) as Partial<AdeAppearanceTokens>;
          // Normalize both colors for comparison (handle case differences, whitespace, etc.)
          const parsedBaseColorNormalized = parsed.baseColor
            ? normalizeColorValueSync(parsed.baseColor)
            : null;
          const safeBaseColorNormalized =
            safeBaseColor && safeBaseColor !== DEFAULT_BASE_COLOR
              ? normalizeColorValueSync(safeBaseColor)
              : null;

          // Use stored appearance if:
          // 1. baseColor matches (normalized) OR
          // 2. baseColor is empty/default but we have stored appearance (use it!) OR
          // 3. baseColor is not set but we have sidebarColor and textColor (use anyway)
          const baseColorMatches =
            safeBaseColorNormalized && parsedBaseColorNormalized
              ? parsedBaseColorNormalized === safeBaseColorNormalized
              : false;
          const baseColorIsEmpty =
            !safeBaseColorNormalized || safeBaseColor === DEFAULT_BASE_COLOR;
          const hasRequiredColors = parsed.sidebarColor && parsed.textColor;

          // Use stored appearance if colors match OR if baseColor is empty (still loading) and we have stored appearance
          if (
            (baseColorMatches ||
              (baseColorIsEmpty && parsedBaseColorNormalized)) &&
            hasRequiredColors
          ) {
            console.log(
              "[AdminContainer] 🎨 Loading appearance from localStorage (before dashboard load):",
              {
                storedBaseColor: parsed.baseColor,
                storedBaseColorNormalized: parsedBaseColorNormalized,
                currentBaseColor: safeBaseColor,
                currentBaseColorNormalized: safeBaseColorNormalized,
                baseColorMatches,
                baseColorIsEmpty,
                sidebarColor: parsed.sidebarColor,
                textColor: parsed.textColor,
                headingColor: parsed.headingColor,
              }
            );
            // Use saved values directly from localStorage (don't recalculate!)
            // This ensures we use the exact colors that were saved
            const finalTokens: AdeAppearanceTokens = {
              baseColor: parsedBaseColorNormalized || safeBaseColor,
              surfaceColor:
                parsed.surfaceColor ||
                computeAdeAppearanceTokens(
                  parsedBaseColorNormalized || safeBaseColor
                ).surfaceColor,
              sidebarColor:
                parsed.sidebarColor ||
                computeAdeAppearanceTokens(
                  parsedBaseColorNormalized || safeBaseColor
                ).sidebarColor,
              sidebarBorderColor:
                parsed.sidebarBorderColor ||
                computeAdeAppearanceTokens(
                  parsedBaseColorNormalized || safeBaseColor
                ).sidebarBorderColor,
              cardBorderColor:
                parsed.cardBorderColor ||
                computeAdeAppearanceTokens(
                  parsedBaseColorNormalized || safeBaseColor
                ).cardBorderColor,
              headingColor:
                parsed.headingColor ||
                parsed.textColor ||
                computeAdeAppearanceTokens(
                  parsedBaseColorNormalized || safeBaseColor
                ).headingColor,
              textColor:
                parsed.textColor ||
                computeAdeAppearanceTokens(
                  parsedBaseColorNormalized || safeBaseColor
                ).textColor,
              mutedTextColor:
                parsed.mutedTextColor ||
                computeAdeAppearanceTokens(
                  parsedBaseColorNormalized || safeBaseColor
                ).mutedTextColor,
              actionColor:
                parsed.actionColor ||
                computeAdeAppearanceTokens(
                  parsedBaseColorNormalized || safeBaseColor
                ).actionColor,
              overlayColor:
                parsed.overlayColor ||
                computeAdeAppearanceTokens(
                  parsedBaseColorNormalized || safeBaseColor
                ).overlayColor,
            };
            console.log(
              "[AdminContainer] ✅ appearanceTokens FINAL (from localStorage):",
              {
                baseColor: finalTokens.baseColor,
                sidebarColor: finalTokens.sidebarColor,
                textColor: finalTokens.textColor,
                headingColor: finalTokens.headingColor,
                mutedTextColor: finalTokens.mutedTextColor,
              }
            );
            return finalTokens;
          } else {
            console.log(
              "[AdminContainer] ⚠️ Stored appearance doesn't match current baseColor:",
              {
                storedBaseColor: parsed.baseColor,
                storedBaseColorNormalized: parsedBaseColorNormalized,
                currentBaseColor: safeBaseColor,
                currentBaseColorNormalized: safeBaseColorNormalized,
                hasRequiredColors,
              }
            );
          }
        } else {
          console.log(
            "[AdminContainer] ⚠️ No stored appearance found in localStorage"
          );
        }
      } catch (e) {
        console.warn(
          "[AdminContainer] ⚠️ Failed to parse stored appearance:",
          e
        );
      }
    }

    // PRIORITY 2: Use saved appearance values from dashboard if available (calculated once when color was saved)
    // Check if dashboard has saved appearance values (even if baseColor doesn't match exactly, use saved values if they exist)
    // FALLBACK: Calculate if not saved (backward compatibility or new dashboards)
    if (currentDashboard?.appearance && currentDashboard.appearance.baseColor) {
      const saved = currentDashboard.appearance;
      // Use saved values first, fallback to calculated only if not saved
      const fallbackTokens = computeAdeAppearanceTokens(safeBaseColor);
      const tokens: AdeAppearanceTokens = {
        baseColor: saved.baseColor || safeBaseColor,
        surfaceColor: saved.surfaceColor || fallbackTokens.surfaceColor,
        sidebarColor: saved.sidebarColor || fallbackTokens.sidebarColor,
        sidebarBorderColor: fallbackTokens.sidebarBorderColor,
        cardBorderColor: fallbackTokens.cardBorderColor,
        headingColor:
          saved.headingColor || saved.textColor || fallbackTokens.headingColor, // Use saved headingColor first, fallback to textColor, then calculated
        textColor: saved.textColor || fallbackTokens.textColor,
        mutedTextColor: saved.mutedTextColor || fallbackTokens.mutedTextColor,
        actionColor: fallbackTokens.actionColor,
        overlayColor: fallbackTokens.overlayColor,
      };
      console.log(
        "[AdminContainer] 🎨 Using saved appearance tokens from dashboard:",
        {
          baseColor: saved.baseColor,
          sidebarColor: tokens.sidebarColor,
          textColor: tokens.textColor,
          mutedTextColor: tokens.mutedTextColor,
          headingColor: tokens.headingColor,
          savedHeadingColor: saved.headingColor,
          savedTextColor: saved.textColor,
          dashboardId: currentDashboard.id,
        }
      );
      console.log(
        "[AdminContainer] ✅ appearanceTokens FINAL (from dashboard):",
        {
          baseColor: tokens.baseColor,
          sidebarColor: tokens.sidebarColor,
          textColor: tokens.textColor,
          headingColor: tokens.headingColor,
          mutedTextColor: tokens.mutedTextColor,
        }
      );
      return tokens;
    }

    // Calculate tokens if not saved (backward compatibility)
    const tokens = computeAdeAppearanceTokens(safeBaseColor);
    console.log("[AdminContainer] 🎨 Appearance tokens computed (not saved):", {
      baseColor: safeBaseColor,
      sidebarColor: tokens.sidebarColor,
      textColor: tokens.textColor,
      headingColor: tokens.headingColor,
      mutedTextColor: tokens.mutedTextColor,
    });

    const finalTokens = tokens;
    console.log("[AdminContainer] ✅ appearanceTokens FINAL:", {
      baseColor: finalTokens.baseColor,
      sidebarColor: finalTokens.sidebarColor,
      textColor: finalTokens.textColor,
      headingColor: finalTokens.headingColor,
      mutedTextColor: finalTokens.mutedTextColor,
    });

    // CRITICAL: Save appearance to localStorage whenever it's calculated
    // This ensures it's available immediately after F5, even before dashboard loads
    // Save even if baseColor is default, as long as we have sidebarColor and textColor
    if (
      typeof window !== "undefined" &&
      finalTokens.sidebarColor &&
      finalTokens.textColor
    ) {
      try {
        window.localStorage.setItem(
          APPEARANCE_STORAGE_KEY,
          JSON.stringify(finalTokens)
        );
        console.log(
          "[AdminContainer] 💾 Auto-saved appearance to localStorage:",
          {
            baseColor: finalTokens.baseColor,
            sidebarColor: finalTokens.sidebarColor,
            textColor: finalTokens.textColor,
          }
        );
      } catch (e) {
        console.warn(
          "[AdminContainer] ⚠️ Failed to auto-save appearance to localStorage:",
          e
        );
      }
    }

    return finalTokens;
  }, [baseColor, currentDashboard?.appearance, currentDashboard?.id]);
  const normalizeColorValue = useCallback((value: string) => {
    const trimmed = value?.trim() ?? "";
    const candidate = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    const rgb = hexToRgb(candidate);
    if (!rgb) {
      return DEFAULT_BASE_COLOR;
    }
    return rgbToHex(rgb);
  }, []);
  useEffect(() => {
    if (isMember) {
      setUpgradeModalOpen(false);
      setUpgradeReason(null);
    }
  }, [isMember]);
  const requestUpgrade = useCallback((action: GuestAction) => {
    setUpgradeReason(action);
    setUpgradeModalOpen(true);
  }, []);
  const ensureAllowance = useCallback(
    (action: GuestAction) => {
      if (isMember) return true;
      const preview = evaluateUsage(action);
      if (!preview.allowed) {
        requestUpgrade(action);
        return false;
      }
      return true;
    },
    [evaluateUsage, isMember, requestUpgrade]
  );
  const commitUsage = useCallback(
    (action: GuestAction) => {
      if (isMember) return;
      consumeUsage(action);
    },
    [consumeUsage, isMember]
  );
  const handleStartCheckout = useCallback(() => {
    const opened = startCheckout();
    if (!opened) {
      push({
        title: "Configure o checkout",
        description:
          "Defina NEXT_PUBLIC_STRIPE_CHECKOUT_URL para habilitar a compra do plano.",
        variant: "destructive",
      });
    }
  }, [push, startCheckout]);
  const handleConfirmMembership = useCallback(() => {
    markMember();
    push({
      title: "Plano ativado",
      description: "Agora você tem acesso completo sem limites!",
      variant: "success",
    });
    setUpgradeModalOpen(false);
    setUpgradeReason(null);
  }, [markMember, push]);
  const handleHeaderLogin = useCallback(() => {
    if (isMember) {
      push({
        title: "Acesso liberado",
        description: "Você já está utilizando o plano completo.",
        variant: "success",
      });
      return;
    }
    requestUpgrade("createWorkspace");
  }, [isMember, push, requestUpgrade]);
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null);
  const [isPersistingOrder, setIsPersistingOrder] = useState(false);
  const [isChatting, setIsChatting] = useState(false);
  const [localWorkspace, setLocalWorkspace] =
    useState<WorkspaceSnapshot | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
  const [storedWorkspaces, setStoredWorkspaces] = useState<
    Array<{ sessionId: string; snapshot: WorkspaceSnapshot }>
  >([]);
  // Track if user manually selected a workspace to prevent auto-switching
  const userSelectedSessionRef = useRef<string | null>(null);
  const [isAddContactModalOpen, setAddContactModalOpen] = useState(false);
  const [isAddCompanyModalOpen, setAddCompanyModalOpen] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isGeneratingWorkspace, setIsGeneratingWorkspace] = useState(false);
  const [regeneratingTileIds, setRegeneratingTileIds] = useState<Set<string>>(
    new Set()
  );
  const [regeneratingContactId, setRegeneratingContactId] = useState<
    string | null
  >(null);
  const [isContactChatting, setIsContactChatting] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(
    null
  );
  const workspaceError = error as WorkspaceFetcherError | undefined;
  const cacheWarningShownRef = useRef(false);

  const refreshStoredWorkspaces = useCallback(() => {
    const entries = listStoredWorkspaces();
    setStoredWorkspaces(entries);
  }, []);

  useEffect(() => {
    refreshStoredWorkspaces();
    const lastSession = getLastSessionId();
    if (!lastSession) {
      // No cached session, trigger initial fetch
      mutate();
      return;
    }
    const cached = loadCachedWorkspace(lastSession);
    if (cached) {
      setSessionId(lastSession);
      setLocalWorkspace(cached);
      setViewingSessionId(lastSession);
      // If cached workspace has tiles, clear generation timestamp
      if (cached.company?.tiles && cached.company.tiles.length > 0) {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("last-generation-time");
        }
      }
    } else {
      // Cached session doesn't exist, trigger fetch
      mutate();
    }
  }, [refreshStoredWorkspaces, mutate]);

  useEffect(() => {
    if (!data) return;
    console.log("[AdminContainer] 📦 Workspace data received:", {
      sessionId: data.sessionId,
      tilesCount: data.company?.tiles?.length || 0,
      generatedAt: data.generatedAt,
      viewingSessionId,
      userSelectedSession: userSelectedSessionRef.current,
    });

    // Se a sessão do servidor é diferente da que estamos visualizando, sempre trocar
    // Isso garante que após reset, usamos a nova sessão do servidor
    const isNewSession =
      viewingSessionId && viewingSessionId !== data.sessionId;

    // Don't auto-switch if user manually selected a different session
    const isUserSelectedSession =
      userSelectedSessionRef.current !== null &&
      userSelectedSessionRef.current !== data.sessionId;

    // If we're viewing a different session than the server, preserve local workspace
    // Don't overwrite if user selected a different session or if local workspace has more recent chat history
    const shouldPreserveLocal =
      viewingSessionId &&
      viewingSessionId !== data.sessionId &&
      (isUserSelectedSession || localWorkspace?.sessionId === viewingSessionId);

    if (isNewSession && !isUserSelectedSession && !shouldPreserveLocal) {
      console.log(
        `[AdminContainer] 🔄 New session detected from server: ${data.sessionId} (was viewing: ${viewingSessionId})`
      );
      // Limpar workspace local antigo se a sessão mudou
      if (viewingSessionId && typeof window !== "undefined") {
        const oldCached = loadCachedWorkspace(viewingSessionId);
        if (
          oldCached &&
          (!oldCached.company?.tiles || oldCached.company.tiles.length === 0)
        ) {
          console.log(
            `[AdminContainer] 🗑️ Clearing old empty session from localStorage: ${viewingSessionId}`
          );
          deleteCachedWorkspace(viewingSessionId);
        }
      }
      // CRITICAL: Clear appearance tokens from localStorage when session resets
      // This ensures new session starts with default colors, not old session colors
      if (typeof window !== "undefined") {
        try {
          window.localStorage.removeItem(APPEARANCE_STORAGE_KEY);
          console.log(
            `[AdminContainer] 🗑️ Cleared appearance tokens from localStorage (new session: ${data.sessionId})`
          );
        } catch (e) {
          console.warn(
            "[AdminContainer] ⚠️ Failed to clear appearance tokens:",
            e
          );
        }
      }
    }

    // Only update if we're not preserving local workspace
    if (!shouldPreserveLocal) {
      setSessionId(data.sessionId);
      setLocalWorkspace(data);
      saveCachedWorkspace(data.sessionId, data);
    } else {
      console.log(
        `[AdminContainer] 🔒 Preserving local workspace (session: ${viewingSessionId}) to prevent overwriting chat history`
      );
    }
    refreshStoredWorkspaces();

    // Se a nova sessão tem tiles, sempre trocar para ela (é a mais recente)
    // MAS só se o usuário não selecionou manualmente outra sessão
    const hasTiles = data.company?.tiles && data.company.tiles.length > 0;

    if (hasTiles) {
      // Se tem tiles e não é uma seleção manual do usuário, usar esta sessão (é a mais recente com dados)
      if (viewingSessionId !== data.sessionId && !isUserSelectedSession) {
        console.log(
          "[AdminContainer] 🔄 Switching to session with tiles:",
          data.sessionId
        );
        setViewingSessionId(data.sessionId);
        // Clear user selection flag since we're auto-switching
        userSelectedSessionRef.current = null;
      }
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("last-generation-time");
        console.log(
          "[AdminContainer] ✅ Tiles detected, cleared generation timestamp"
        );
      }
    } else {
      // Sempre usar a sessão do servidor, mesmo sem tiles (pode estar gerando)
      // MAS só se o usuário não selecionou manualmente outra sessão
      if (
        (viewingSessionId !== data.sessionId || isNewSession) &&
        !isUserSelectedSession
      ) {
        console.log(
          "[AdminContainer] 🔄 Switching to server session:",
          data.sessionId
        );
        setViewingSessionId(data.sessionId);
        // Clear user selection flag since we're auto-switching
        userSelectedSessionRef.current = null;
      }
    }

    cacheWarningShownRef.current = false;
  }, [data, refreshStoredWorkspaces, viewingSessionId]);

  useEffect(() => {
    if (
      !cacheWarningShownRef.current &&
      workspaceError?.status === 404 &&
      localWorkspace
    ) {
      cacheWarningShownRef.current = true;
      push({
        title: "Session expired",
        description:
          "Showing the last saved workspace. Generate a new one to refresh.",
        variant: "destructive",
      });
    }
  }, [workspaceError, localWorkspace, push]);

  // Estado unificado com source tracking para melhor debug e controle
  type WorkspaceSource = "server" | "localStorage" | "cache";

  const workspaceState = useMemo<{
    data: WorkspaceResponse | null;
    source: WorkspaceSource | null;
  }>(() => {
    // Prioridade explícita: server > localStorage > cache
    if (viewingSessionId) {
      // 1. Server data (mais atualizado)
      if (data && data.sessionId === viewingSessionId) {
        return { data, source: "server" };
      }
      // 2. Local workspace (cache recente)
      if (localWorkspace && localWorkspace.sessionId === viewingSessionId) {
        return { data: localWorkspace, source: "localStorage" };
      }
      // 3. Stored workspaces (cache antigo)
      const stored = storedWorkspaces.find(
        (entry) => entry.sessionId === viewingSessionId
      );
      if (stored) {
        return { data: stored.snapshot, source: "cache" };
      }
    }
    // Fallback: usar o que estiver disponível
    if (data) return { data, source: "server" };
    if (localWorkspace) return { data: localWorkspace, source: "localStorage" };
    return { data: null, source: null };
  }, [data, localWorkspace, storedWorkspaces, viewingSessionId]);

  const workspace = workspaceState.data;

  // Tile streaming hook - only active when coming from home page
  const {
    tiles: streamingTiles,
    isStreaming,
    isCompleted: streamingCompleted,
    error: streamingError,
    totalTiles: streamingTotalTiles,
    completedTiles: streamingCompletedTiles,
    startStreaming,
    stopStreaming,
  } = useTileStreaming({
    salesRepCompany: workspace?.company?.name || "",
    salesRepWebsite: workspace?.company?.website || "",
    solution: workspace?.promptSettings?.sellingSolutionsFor || "",
    targetCompany: workspace?.promptSettings?.target || "",
    targetWebsite: workspace?.promptSettings?.targetWebsite || "",
    templateId: workspace?.promptSettings?.templateId || "",
    model: workspace?.promptSettings?.model,
    promptAgent: workspace?.promptSettings?.promptAgent,
    responseLength: workspace?.promptSettings?.responseLength,
    promptVariables: workspace?.promptSettings?.promptVariables,
    bulkPrompts: workspace?.promptSettings?.bulkPrompts,
    onTileGenerated: useCallback((tile: Tile, index: number) => {
      console.log(
        `[AdminContainer] 🎯 Tile ${index + 1} streamed:`,
        tile.title
      );

      // Update local generation state (independente de cookies)
      setGenerationState(prev => ({
        ...prev,
        tilesGenerated: prev.tilesGenerated + 1,
      }));

      // Update dashboard with new tile
      if (currentCompany && currentDashboard) {
        const updatedTiles = [...currentDashboard.tiles];
        updatedTiles[index] = tile;
        updateDashboard(currentCompany.id, currentDashboard.id, {
          tiles: updatedTiles,
        });

        // Immediately update UI state for real-time feedback
        const updatedDashboard = {
          ...currentDashboard,
          tiles: updatedTiles,
          updatedAt: new Date().toISOString(),
        };
        setCurrentDashboard(updatedDashboard);

        console.log(`[AdminContainer] 🔄 UI updated with tile ${index + 1}:`, {
          tileTitle: tile.title,
          totalTiles: updatedTiles.length,
        });
      }
    }, [currentCompany, currentDashboard, updateDashboard]),
    onCompleted: useCallback(async (workspace: WorkspaceSnapshot, sessionId: string) => {
      console.log("[AdminContainer] ✅ Streaming completed, workspace ready");

      // Update local generation state
      setGenerationState(prev => ({
        ...prev,
        isGenerating: false,
        sessionId,
        tilesGenerated: prev.totalTiles, // Mark as complete
      }));

      // Reset generation flag
      generationInProgressRef.current = false;

      // Clear localStorage generation timestamp to prevent future polling
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("last-generation-time");
        console.log("[AdminContainer] 🧹 Cleared generation timestamp");
      }

      // Force reload of current dashboard from localStorage
      console.log("[AdminContainer] 🔄 Reloading dashboard after streaming");
      try {
        if (currentCompany) {
          const freshCompanies = loadCompaniesWithDashboards();
          const freshCurrentCompany = freshCompanies.find(c => c.id === currentCompany.id);

          if (freshCurrentCompany) {
            const freshCurrentDashboard = getActiveDashboard(freshCurrentCompany.id);
            if (freshCurrentDashboard) {
              setCurrentDashboard(freshCurrentDashboard);
              setCurrentCompany(freshCurrentCompany);

              console.log("[AdminContainer] ✅ UI state updated with fresh data", {
                tilesCount: freshCurrentDashboard.tiles?.length ?? 0,
                dashboardId: freshCurrentDashboard.id,
              });
            }
          }
        }
      } catch (error) {
        console.error("[AdminContainer] ❌ Failed to reload dashboard:", error);
      }

      // Refresh the SWR cache to get updated workspace data
      refreshStoredWorkspaces();
      mutate();

      // Success notification
      push({
        variant: "success",
        title: "Insights Generated!",
        description: `Successfully generated ${workspace.company?.tiles?.length || 0} insights.`,
      });
    }, [refreshStoredWorkspaces, mutate, push, currentCompany, currentDashboard]),
    onError: useCallback((error: string) => {
      console.error("[AdminContainer] ❌ Streaming error:", error);

      // Update local generation state on error
      setGenerationState(prev => ({
        ...prev,
        isGenerating: false,
      }));

      // Reset generation flag on error
      generationInProgressRef.current = false;

      push({
        variant: "destructive",
        title: "Generation Failed",
        description: `Error generating insights: ${error}`,
      });
    }, [push]),
  });

  // Start streaming when coming from home page with recent generation
  // Refatorado para evitar loops - só executa quando workspace muda
  useEffect(() => {
    if (
      shouldUseStreaming &&
      !generationInProgressRef.current &&
      !generationState.isGenerating &&
      workspace &&
      workspace.promptSettings
    ) {
      console.log("[AdminContainer] 🚀 Checking if we should start streaming...");

      // Check if we have the minimum required data for streaming
      const hasRequiredData =
        workspace.promptSettings.target &&
        workspace.promptSettings.sellingSolutionsFor &&
        workspace.promptSettings.targetWebsite &&
        workspace.promptSettings.templateId;

      // Check if workspace was recently generated (within last 10 minutes)
      const shouldStartGeneration = (() => {
        if (!workspace.generatedAt) return true; // No generation yet

        const generatedTime = new Date(workspace.generatedAt).getTime();
        const now = Date.now();
        const tenMinutesAgo = now - 10 * 60 * 1000;
        return generatedTime > tenMinutesAgo; // Recent generation
      })();

      if (hasRequiredData && shouldStartGeneration) {
        console.log("[AdminContainer] ✅ Starting streaming with valid recent data");

        // Mark generation as in progress
        generationInProgressRef.current = true;

        // Update local generation state
        setGenerationState(prev => ({
          ...prev,
          isGenerating: true,
          startedAt: Date.now(),
          totalTiles: 8, // fallback
          tilesGenerated: 0,
          sessionId: null,
        }));

        startStreaming();
      } else {
        console.log("[AdminContainer] ⏸️ Skipping streaming - no recent generation needed");
      }
    }
  }, [
    shouldUseStreaming,
    workspace, // Só workspace como dependência - evita loops
    startStreaming,
  ]);

  // Migrate workspace to company structure and load current dashboard
  useEffect(() => {
    if (!workspace) {
      console.log("[DataSync] 🚫 No workspace, clearing company and dashboard");
      setCurrentCompany(null);
      setCurrentDashboard(null);
      return;
    }

    // ⚠️ IMPORTANTE: Pular sincronização se estivermos atualizando dashboard
    // Isso previne race conditions onde mutate() dispara sync que sobrescreve dados recém-salvos
    if (isUpdatingDashboardRef.current) {
      console.log(
        "[DataSync] ⏸️ Dashboard update in progress, skipping sync to prevent race condition"
      );
      return;
    }

    console.log("[DataSync] 🔄 Starting workspace → company sync", {
      workspaceSessionId: workspace.sessionId,
      workspaceTilesCount: workspace.company?.tiles?.length ?? 0,
      workspaceContactsCount: workspace.company?.contacts?.length ?? 0,
      workspaceNotesCount: workspace.company?.notes?.length ?? 0,
    });

    // Migrate workspace to company structure
    const company = getOrCreateCompanyFromWorkspace(workspace);
    if (!company) {
      console.log(
        "[DataSync] ❌ Failed to get or create company from workspace"
      );
      return;
    }

    console.log("[DataSync] ✅ Company loaded/created", {
      companyId: company.id,
      companyName: company.name,
      dashboardsCount: company.dashboards.length,
      companyContactsCount: company.dashboards.reduce(
        (sum, d) => sum + (d.contacts?.length ?? 0),
        0
      ),
      companyNotesCount: company.dashboards.reduce(
        (sum, d) => sum + (d.notes?.length ?? 0),
        0
      ),
    });

    setCurrentCompany(company);

    // Get active dashboard
    const activeDashboard =
      getActiveDashboard(company.id) ?? company.dashboards[0] ?? null;

    if (activeDashboard) {
      console.log("[DataSync] 📊 Active dashboard found", {
        dashboardId: activeDashboard.id,
        dashboardName: activeDashboard.name,
        dashboardTilesCount: activeDashboard.tiles?.length ?? 0,
        isActive: activeDashboard.isActive,
      });

      // Load dashboard's background color (PRIORITY 1: Dashboard color)
      const dashboardColor = activeDashboard.appearance?.baseColor;
      if (dashboardColor && dashboardColor.trim()) {
        const normalized = normalizeColorValueSync(dashboardColor);
        console.log("[DataSync] 🎨 Loading dashboard color:", normalized);
        setBaseColor(normalized);
        if (document.body) {
          document.body.style.backgroundColor = normalized;
        }
        // Persist to localStorage for F5 persistence
        if (typeof window !== "undefined") {
          window.localStorage.setItem(BASE_COLOR_STORAGE_KEY, normalized);
        }
      } else {
        // PRIORITY 2: Check localStorage for user's custom color
        if (typeof window !== "undefined") {
          const storedColor = window.localStorage.getItem(
            BASE_COLOR_STORAGE_KEY
          );
          if (
            storedColor &&
            storedColor.trim() &&
            /^#[0-9A-Fa-f]{6}$/.test(storedColor.trim())
          ) {
            const normalized = normalizeColorValueSync(storedColor);
            console.log(
              "[DataSync] 🎨 Dashboard has no color, using localStorage color:",
              normalized
            );
            setBaseColor(normalized);
            if (document.body) {
              document.body.style.backgroundColor = normalized;
            }
            return; // Don't check workspace if we have localStorage color
          }
        }

        // PRIORITY 3: Use workspace color (backward compatibility)
        const workspaceColor = workspace.appearance?.baseColor;
        if (workspaceColor && workspaceColor.trim()) {
          const normalized = normalizeColorValueSync(workspaceColor);
          console.log(
            "[DataSync] 🎨 Dashboard has no color, using workspace color:",
            normalized
          );
          setBaseColor(normalized);
          if (document.body) {
            document.body.style.backgroundColor = normalized;
          }
          // Persist to localStorage for F5 persistence
          if (typeof window !== "undefined") {
            window.localStorage.setItem(BASE_COLOR_STORAGE_KEY, normalized);
          }
        } else {
          // PRIORITY 4: Use default color
          console.log("[DataSync] 🎨 No color found, using default");
          setBaseColor(DEFAULT_BASE_COLOR);
          if (document.body) {
            document.body.style.backgroundColor = DEFAULT_BASE_COLOR;
          }
          // Persist default to localStorage for consistency
          if (typeof window !== "undefined") {
            window.localStorage.setItem(
              BASE_COLOR_STORAGE_KEY,
              DEFAULT_BASE_COLOR
            );
          }
        }
      }
    } else {
      console.log("[DataSync] ⚠️ No active dashboard found");
    }

    setCurrentDashboard(activeDashboard);

    console.log(
      `[AdminContainer] 🏢 Company: ${company.name}, Dashboards: ${company.dashboards.length}, Active: ${activeDashboard?.name}`
    );
  }, [workspace]);

  // Log workspace source para debug (apenas quando muda)
  useEffect(() => {
    if (workspace) {
      console.log(
        `[AdminContainer] 📍 Workspace source: ${workspaceState.source} (sessionId: ${workspace.sessionId})`
      );
    }
  }, [workspaceState.source, workspace?.sessionId]);

  const tiles: Tile[] = useMemo(() => {
    // Use tiles from current dashboard if available - NO FALLBACK to workspace
    if (currentDashboard) {
      const dashboardTiles = currentDashboard.tiles ?? [];
      console.log("[TilesSource] 📊 Using tiles from currentDashboard", {
        dashboardId: currentDashboard.id,
        dashboardName: currentDashboard.name,
        tilesCount: dashboardTiles.length,
        source: "currentDashboard",
      });
      return dashboardTiles.sort((a, b) => a.orderIndex - b.orderIndex);
    }

    // Only fallback to workspace if no dashboard exists (backward compatibility)
    console.log(
      "[TilesSource] ⚠️ No currentDashboard, falling back to workspace",
      {
        hasWorkspace: !!workspace,
        workspaceSource: workspaceState.source,
      }
    );

    if (!workspace) {
      console.log(
        "[TilesSource] 🚫 No workspace available, returning empty tiles"
      );
      return [];
    }
    const tilesArray = workspace.company?.tiles ?? [];
    console.log(`[TilesSource] 📊 Using tiles from workspace`, {
      sessionId: workspace.sessionId,
      source: workspaceState.source,
      hasCompany: !!workspace.company,
      tilesCount: tilesArray?.length ?? 0,
    });
    if (!tilesArray || tilesArray.length === 0) {
      console.log("[TilesSource] ⚠️ No tiles found in workspace");
      return [];
    }
    const now = new Date().toISOString();
    return [...tilesArray]
      .map((tile, index) => {
        const createdAt = tile.createdAt ?? now;
        const updatedAt = tile.updatedAt ?? createdAt;
        const prompt =
          tile.prompt && tile.prompt.trim().length > 0
            ? tile.prompt
            : `Provide a concise insight for "${tile.title}".`;
        const history =
          tile.history && tile.history.length > 0
            ? tile.history.map((entry, entryIndex) => ({
                id: entry.id ?? `history_${tile.id}_${entryIndex}`,
                role:
                  entry.role === "assistant" ||
                  entry.role === "system" ||
                  entry.role === "user"
                    ? entry.role
                    : "assistant",
                content: entry.content ?? "",
                createdAt: entry.createdAt ?? updatedAt,
              }))
            : [
                {
                  id: `legacy_user_${tile.id}`,
                  role: "user" as const,
                  content: prompt,
                  createdAt,
                },
                {
                  id: `legacy_assistant_${tile.id}`,
                  role: "assistant" as const,
                  content: tile.content ?? "",
                  createdAt,
                },
              ];

        return {
          ...tile,
          prompt,
          model: resolveModel(tile.model),
          templateId: tile.templateId ?? "legacy_template",
          templateTileId: tile.templateTileId ?? undefined,
          category: tile.category,
          orderIndex: tile.orderIndex ?? index,
          createdAt,
          updatedAt,
          totalTokens: tile.totalTokens ?? null,
          attempts: tile.attempts ?? 1,
          history,
          content: tile.content ?? "",
        };
      })
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }, [workspace, workspaceState.source, currentDashboard]);

  const activeTile = useMemo(
    () => tiles.find((tile) => tile.id === selectedTileId) ?? null,
    [tiles, selectedTileId]
  );

  const notes: Note[] = useMemo(() => {
    // Use notes from current dashboard (isolated per dashboard)
    if (currentDashboard) {
      const dashboardNotes = currentDashboard.notes ?? [];
      console.log("[NotesSource] 📝 Loading notes from dashboard", {
        dashboardId: currentDashboard.id,
        dashboardName: currentDashboard.name,
        notesCount: dashboardNotes.length,
      });
      return dashboardNotes;
    }

    // Fallback to workspace for backward compatibility
    const notesFromWorkspace = workspace?.company.notes ?? [];
    console.log(
      "[NotesSource] ⚠️ No dashboard, falling back to workspace notes",
      {
        notesCount: notesFromWorkspace.length,
      }
    );
    return notesFromWorkspace;
  }, [currentDashboard?.notes, currentDashboard?.id, workspace?.company.notes]);

  const contacts: Contact[] = useMemo(() => {
    // Use contacts from current dashboard (isolated per dashboard)
    if (currentDashboard) {
      const dashboardContacts = currentDashboard.contacts ?? [];
      console.log("[ContactsSource] 👥 Loading contacts from dashboard", {
        dashboardId: currentDashboard.id,
        dashboardName: currentDashboard.name,
        contactsCount: dashboardContacts.length,
      });
      return dashboardContacts;
    }

    // Fallback to workspace for backward compatibility
    const contactsFromWorkspace = workspace?.company.contacts ?? [];
    console.log(
      "[ContactsSource] ⚠️ No dashboard, falling back to workspace contacts",
      {
        contactsCount: contactsFromWorkspace.length,
      }
    );
    return contactsFromWorkspace;
  }, [
    currentDashboard?.contacts,
    currentDashboard?.id,
    workspace?.company.contacts,
  ]);

  const activeContact = useMemo(
    () => contacts.find((contact) => contact.id === selectedContactId) ?? null,
    [contacts, selectedContactId]
  );

  useEffect(() => {
    if (
      selectedContactId &&
      !contacts.some((contact) => contact.id === selectedContactId)
    ) {
      setSelectedContactId(null);
    }
  }, [contacts, selectedContactId]);
  const companyOptions = useMemo(() => {
    const map = new Map<string, WorkspaceSnapshot>();
    storedWorkspaces.forEach(({ sessionId, snapshot }) => {
      map.set(sessionId, snapshot);
    });
    if (data) {
      map.set(data.sessionId, data);
    }
    if (localWorkspace) {
      map.set(localWorkspace.sessionId, localWorkspace);
    }
    const entries = Array.from(map.entries())
      .map(([session, snapshot]) => {
        const generatedAt =
          snapshot.generatedAt ?? snapshot.company?.tiles?.[0]?.createdAt ?? "";
        const isActive = viewingSessionId
          ? viewingSessionId === session
          : data
          ? data.sessionId === session
          : localWorkspace?.sessionId === session;
        // Get dashboards count from company if available
        const companies = loadCompaniesWithDashboards();
        const company = companies.find((c) => c.id === session);
        const dashboardsCount = company?.dashboards?.length ?? 0;

        return {
          sessionId: session,
          name: snapshot.company.name || "Workspace",
          generatedAt,
          tilesCount: snapshot.company.tiles?.length ?? 0,
          notesCount: snapshot.company.notes?.length ?? 0,
          contactsCount: snapshot.company.contacts?.length ?? 0,
          dashboardsCount,
          isActive,
        };
      })
      .filter((entry) => {
        // Filter out empty "New Company" workspaces
        const isEmpty =
          entry.tilesCount === 0 &&
          entry.notesCount === 0 &&
          entry.contactsCount === 0;
        const isNewCompany = entry.name === "New Company";
        // Only show if it has content OR it's not "New Company"
        return !isEmpty || !isNewCompany;
      });
    return entries.sort((a, b) => {
      const aTime = a.generatedAt ? Date.parse(a.generatedAt) : 0;
      const bTime = b.generatedAt ? Date.parse(b.generatedAt) : 0;
      return bTime - aTime;
    });
  }, [storedWorkspaces, data, localWorkspace, viewingSessionId]);
  const isViewingServerWorkspace = useMemo(() => {
    if (!data) return false;
    if (!viewingSessionId) return true;
    return viewingSessionId === data.sessionId;
  }, [data, viewingSessionId]);

  // Persist baseColor to localStorage when it changes and apply to body
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const currentStored = window.localStorage.getItem(
          BASE_COLOR_STORAGE_KEY
        );
        // Only update if different to avoid unnecessary writes
        if (currentStored !== baseColor) {
          window.localStorage.setItem(BASE_COLOR_STORAGE_KEY, baseColor);
          console.log(
            "[AdminContainer] 💾 Saved color to localStorage:",
            baseColor
          );
        }
        // Always apply to body to ensure consistency
        if (document.body) {
          document.body.style.backgroundColor = baseColor;
        }
      } catch {
        // ignore storage failures
      }
    }
  }, [baseColor]);

  useEffect(() => {
    // Only sync workspace color if user hasn't customized it
    // Priority: localStorage > workspace > default
    if (!workspace) {
      return;
    }

    // Wait for localStorage check to complete first
    if (!hasLoadedFromStorageRef.current) {
      return;
    }

    // ALWAYS check localStorage first - user customizations take absolute priority
    if (typeof window !== "undefined") {
      const storedColor = window.localStorage.getItem(BASE_COLOR_STORAGE_KEY);
      if (storedColor && /^#[0-9A-Fa-f]{6}$/.test(storedColor)) {
        // User has custom color, ensure it's applied and NEVER override
        const normalized = normalizeColorValue(storedColor);
        if (normalized !== baseColor) {
          console.log(
            "[AdminContainer] 🎨 Restoring user's custom color from localStorage:",
            normalized
          );
          setBaseColor(normalized);
        }
        return; // Never override user's custom color, even if workspace has different color
      }
    }

    // Only use workspace color if NO custom color exists in localStorage
    // This means user hasn't customized, so workspace default is OK
    const candidate = workspace.appearance?.baseColor ?? DEFAULT_BASE_COLOR;
    const normalized = normalizeColorValue(candidate);
    if (normalized !== baseColor) {
      console.log(
        "[AdminContainer] 🎨 Using workspace default color:",
        normalized
      );
      setBaseColor(normalized);
    }
  }, [workspace, baseColor, normalizeColorValue]);

  const handleCustomizeBackground = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      // Get button position
      const button = event.currentTarget;
      const rect = button.getBoundingClientRect();

      // Create a color picker input positioned near the button
      const input = document.createElement("input");
      input.type = "color";
      input.value = baseColor;
      input.style.position = "fixed";
      input.style.left = `${rect.left}px`;
      input.style.top = `${rect.bottom + 8}px`;
      input.style.width = "40px";
      input.style.height = "40px";
      input.style.border = "none";
      input.style.borderRadius = "8px";
      input.style.cursor = "pointer";
      input.style.zIndex = "9999";
      document.body.appendChild(input);

      input.addEventListener("change", (e) => {
        const newColor = (e.target as HTMLInputElement).value;
        const normalized = normalizeColorValue(newColor);

        // Calculate all appearance tokens once and save them to avoid recalculation
        const computedTokens = computeAdeAppearanceTokens(normalized);

        // Calculate contrast mode (true if background is dark, false if light)
        const contrastMode = getContrastingTextColor(normalized) === "#ffffff";

        // Save color and computed tokens to current dashboard (isolated per dashboard)
        if (currentCompany && currentDashboard) {
          const updatedAppearance = {
            baseColor: normalized,
            surfaceColor: computedTokens.surfaceColor,
            sidebarColor: computedTokens.sidebarColor,
            headingColor: computedTokens.headingColor, // Save headingColor separately
            textColor: computedTokens.textColor,
            mutedTextColor: computedTokens.mutedTextColor,
            ...currentDashboard.appearance,
          };

          updateDashboard(currentCompany.id, currentDashboard.id, {
            appearance: updatedAppearance,
            contrastMode: contrastMode,
          });

          // CRITICAL: Also save appearance to localStorage for immediate access after F5
          // This ensures appearance is available before currentDashboard is loaded
          if (typeof window !== "undefined") {
            try {
              // Use the computed tokens (most up-to-date) - save complete appearance
              const tokensToStore: AdeAppearanceTokens = {
                baseColor: normalized, // Use normalized color
                surfaceColor: computedTokens.surfaceColor,
                sidebarColor: computedTokens.sidebarColor,
                sidebarBorderColor: computedTokens.sidebarBorderColor,
                cardBorderColor: computedTokens.cardBorderColor,
                headingColor: computedTokens.headingColor,
                textColor: computedTokens.textColor,
                mutedTextColor: computedTokens.mutedTextColor,
                actionColor: computedTokens.actionColor,
                overlayColor: computedTokens.overlayColor,
              };
              window.localStorage.setItem(
                APPEARANCE_STORAGE_KEY,
                JSON.stringify(tokensToStore)
              );
              console.log(
                "[AdminContainer] 💾 Saved appearance to localStorage for F5 persistence:",
                {
                  baseColor: tokensToStore.baseColor,
                  sidebarColor: tokensToStore.sidebarColor,
                  textColor: tokensToStore.textColor,
                  headingColor: tokensToStore.headingColor,
                  mutedTextColor: tokensToStore.mutedTextColor,
                }
              );
            } catch (e) {
              console.warn(
                "[AdminContainer] ⚠️ Failed to save appearance to localStorage:",
                e
              );
            }
          }

          console.log(
            "[AdminContainer] 💾 Color and contrast saved to dashboard:",
            {
              dashboardId: currentDashboard.id,
              dashboardName: currentDashboard.name,
              baseColor: normalized,
              textColor: computedTokens.textColor,
              headingColor: computedTokens.headingColor,
              sidebarColor: computedTokens.sidebarColor,
              contrastMode: contrastMode,
            }
          );

          // Reload company to get updated dashboard
          const updatedCompany = getCompanyById(currentCompany.id);
          if (updatedCompany) {
            const updatedDashboard = updatedCompany.dashboards.find(
              (d) => d.id === currentDashboard.id
            );
            if (updatedDashboard) {
              setCurrentDashboard(updatedDashboard);
            }
          }
        }

        setBaseColor(normalized);

        // Persist to localStorage immediately for F5 persistence
        if (typeof window !== "undefined") {
          window.localStorage.setItem(BASE_COLOR_STORAGE_KEY, normalized);
          console.log(
            "[AdminContainer] 💾 Color saved to localStorage:",
            normalized
          );
        }

        push({
          title: "Color updated",
          description: "Dashboard color has been updated.",
          variant: "success",
        });

        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      });

      input.addEventListener("blur", () => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      });

      // Focus and click to open color picker
      setTimeout(() => {
        input.focus();
        input.click();
      }, 0);
    },
    [baseColor, normalizeColorValue, push]
  );

  const handleSaveTemplate = useCallback(() => {
    push({
      title: "Templates personalizados",
      description:
        "Estamos finalizando essa área. Fique de olho nas próximas entregas!",
    });
  }, [push]);

  const handleCreateBlankDashboard = useCallback(
    async (payload: { dashboardName: string }) => {
      if (isCreatingBlankDashboard) return;

      // CRITICAL: Se não há currentCompany, precisamos criar uma primeiro
      // Isso pode acontecer se o usuário cria um blank dashboard antes de ter um workspace
      let companyToUse = currentCompany;

      if (!companyToUse) {
        // Tentar criar company a partir do workspace se existir
        if (workspace) {
          console.log(
            "[CreateBlankDashboard] ⚠️ No currentCompany, creating from workspace",
            {
              workspaceSessionId: workspace.sessionId,
            }
          );
          const createdCompany = getOrCreateCompanyFromWorkspace(workspace);
          if (createdCompany) {
            companyToUse = createdCompany;
            setCurrentCompany(createdCompany);
            // Set active dashboard from created company
            const activeDashboard =
              getActiveDashboard(createdCompany.id) ??
              createdCompany.dashboards[0] ??
              null;
            if (activeDashboard) {
              setCurrentDashboard(activeDashboard);
            }
          }
        }

        // Se ainda não temos company, não podemos criar dashboard
        if (!companyToUse) {
          push({
            title: "Cannot create dashboard",
            description:
              "Please create a workspace first by selecting a template.",
            variant: "destructive",
          });
          return;
        }
      }

      setIsCreatingBlankDashboard(true);

      try {
        console.log("[CreateBlankDashboard] 🆕 Creating blank dashboard", {
          companyId: companyToUse.id,
          dashboardName: payload.dashboardName,
          hasCurrentCompany: !!currentCompany,
        });

        // Create new dashboard in current company (blank dashboard = no templateId)
        const newDashboard = createDashboard(
          companyToUse.id,
          payload.dashboardName,
          undefined
        );

        console.log("[CreateBlankDashboard] ✅ Dashboard created", {
          dashboardId: newDashboard.id,
          dashboardName: newDashboard.name,
          tilesCount: newDashboard.tiles?.length ?? 0,
        });

        // Reload company directly from storage (don't sync from workspace)
        // This ensures the blank dashboard stays empty
        const updatedCompany = getCompanyById(companyToUse.id);
        if (!updatedCompany) {
          throw new Error("Failed to reload company after creating dashboard");
        }

        console.log(
          "[CreateBlankDashboard] 🔄 Reloading company from storage",
          {
            companyId: updatedCompany.id,
            dashboardsCount: updatedCompany.dashboards.length,
          }
        );

        // CRITICAL: Atualizar estado de forma síncrona e garantir que está atualizado
        setCurrentCompany(updatedCompany);

        const updatedDashboard = updatedCompany.dashboards.find(
          (d) => d.id === newDashboard.id
        );
        if (!updatedDashboard) {
          throw new Error(
            `Dashboard ${newDashboard.id} not found after reload`
          );
        }

        console.log("[CreateBlankDashboard] 📊 Setting active dashboard", {
          dashboardId: updatedDashboard.id,
          dashboardName: updatedDashboard.name,
          tilesCount: updatedDashboard.tiles?.length ?? 0,
          templateId: updatedDashboard.templateId,
          isBlank: !updatedDashboard.templateId,
        });

        // CRITICAL: Criar nova referência do objeto para garantir que React detecta a mudança
        setCurrentDashboard({ ...updatedDashboard });

        // Set default background color for new blank dashboard
        // Don't inherit color from previous dashboard
        console.log(
          "[CreateBlankDashboard] 🎨 Setting default color for new dashboard"
        );
        setBaseColor(DEFAULT_BASE_COLOR);
        if (document.body) {
          document.body.style.backgroundColor = DEFAULT_BASE_COLOR;
        }
        // CRITICAL: Clear appearance tokens from localStorage to force recalculation with default colors
        // This ensures sidebar, text, and all other colors are reset to default, not inherited from previous dashboard
        if (typeof window !== "undefined") {
          window.localStorage.setItem(
            BASE_COLOR_STORAGE_KEY,
            DEFAULT_BASE_COLOR
          );
          // Clear appearance tokens so they are recalculated with default colors
          window.localStorage.removeItem(APPEARANCE_STORAGE_KEY);
          console.log(
            "[CreateBlankDashboard] 🗑️ Cleared appearance tokens to force default colors"
          );
        }

        // CRITICAL: Aguardar um tick para garantir que estado foi atualizado antes de fechar modal
        // Isso previne race conditions onde usuário tenta criar prompt antes do estado estar pronto
        await new Promise((resolve) => setTimeout(resolve, 100));

        push({
          title: "Dashboard created",
          description: `"${payload.dashboardName}" has been created. You can now add custom prompts.`,
          variant: "success",
        });

        setCreateBlankDashboardModalOpen(false);
      } catch (error) {
        console.error(
          "[CreateBlankDashboard] ❌ Error creating dashboard",
          error
        );
        push({
          title: "Failed to create dashboard",
          description:
            error instanceof Error
              ? error.message
              : "Please try again in a few moments.",
          variant: "destructive",
        });
      } finally {
        setIsCreatingBlankDashboard(false);
      }
    },
    [isCreatingBlankDashboard, currentCompany, workspace, push]
  );

  const handleSelectDashboard = useCallback(
    (dashboardId: string) => {
      if (!currentCompany) {
        console.log("[DashboardSwitch] ❌ No currentCompany available");
        return;
      }

      console.log("[DashboardSwitch] 🔄 Starting dashboard switch", {
        companyId: currentCompany.id,
        companyName: currentCompany.name,
        fromDashboardId: currentDashboard?.id,
        fromDashboardName: currentDashboard?.name,
        toDashboardId: dashboardId,
        currentTilesCount: currentDashboard?.tiles?.length ?? 0,
        currentContactsCount: currentCompany.dashboards.reduce(
          (sum, d) => sum + (d.contacts?.length ?? 0),
          0
        ),
        currentNotesCount: currentCompany.dashboards.reduce(
          (sum, d) => sum + (d.notes?.length ?? 0),
          0
        ),
      });

      setActiveDashboard(currentCompany.id, dashboardId);

      // Reload company from storage to get updated dashboard states
      const updatedCompany = getCompanyById(currentCompany.id);
      if (updatedCompany) {
        setCurrentCompany(updatedCompany);
        const dashboard = updatedCompany.dashboards.find(
          (d) => d.id === dashboardId
        );
        if (dashboard) {
          console.log("[DashboardSwitch] ✅ Dashboard found and switched", {
            dashboardId: dashboard.id,
            dashboardName: dashboard.name,
            tilesCount: dashboard.tiles?.length ?? 0,
            isActive: dashboard.isActive,
            contactsCount: updatedCompany.dashboards.reduce(
              (sum, d) => sum + (d.contacts?.length ?? 0),
              0
            ),
            notesCount: updatedCompany.dashboards.reduce(
              (sum, d) => sum + (d.notes?.length ?? 0),
              0
            ),
          });
          setCurrentDashboard(dashboard);

          // Load dashboard's background color
          const dashboardColor = dashboard.appearance?.baseColor;
          if (dashboardColor && dashboardColor.trim()) {
            const normalized = normalizeColorValueSync(dashboardColor);
            console.log(
              "[DashboardSwitch] 🎨 Loading dashboard color:",
              normalized
            );
            setBaseColor(normalized);
            if (document.body) {
              document.body.style.backgroundColor = normalized;
            }
            // CRITICAL: Save dashboard's appearance tokens to localStorage for F5 persistence
            // This ensures the dashboard's custom colors are restored after refresh
            if (typeof window !== "undefined") {
              window.localStorage.setItem(BASE_COLOR_STORAGE_KEY, normalized);
              // If dashboard has saved appearance, restore it to localStorage
              if (
                dashboard.appearance &&
                dashboard.appearance.sidebarColor &&
                dashboard.appearance.textColor
              ) {
                const computed = computeAdeAppearanceTokens(normalized);
                const appearanceTokens: AdeAppearanceTokens = {
                  baseColor: normalized,
                  surfaceColor:
                    dashboard.appearance.surfaceColor || computed.surfaceColor,
                  sidebarColor: dashboard.appearance.sidebarColor,
                  sidebarBorderColor: computed.sidebarBorderColor,
                  cardBorderColor: computed.cardBorderColor,
                  headingColor:
                    dashboard.appearance.headingColor ||
                    dashboard.appearance.textColor ||
                    computed.headingColor,
                  textColor: dashboard.appearance.textColor,
                  mutedTextColor:
                    dashboard.appearance.mutedTextColor ||
                    computed.mutedTextColor,
                  actionColor: computed.actionColor,
                  overlayColor: computed.overlayColor,
                };
                window.localStorage.setItem(
                  APPEARANCE_STORAGE_KEY,
                  JSON.stringify(appearanceTokens)
                );
                console.log(
                  "[DashboardSwitch] 💾 Saved dashboard appearance to localStorage:",
                  {
                    baseColor: appearanceTokens.baseColor,
                    sidebarColor: appearanceTokens.sidebarColor,
                    textColor: appearanceTokens.textColor,
                  }
                );
              }
            }
          } else {
            // Check localStorage first, then default
            if (typeof window !== "undefined") {
              const storedColor = window.localStorage.getItem(
                BASE_COLOR_STORAGE_KEY
              );
              if (
                storedColor &&
                storedColor.trim() &&
                /^#[0-9A-Fa-f]{6}$/.test(storedColor.trim())
              ) {
                const normalized = normalizeColorValueSync(storedColor);
                console.log(
                  "[DashboardSwitch] 🎨 Dashboard has no color, using localStorage color:",
                  normalized
                );
                setBaseColor(normalized);
                if (document.body) {
                  document.body.style.backgroundColor = normalized;
                }
                return; // Don't set default if we have localStorage color
              }
            }
            // Use default if dashboard has no color
            console.log(
              "[DashboardSwitch] 🎨 Dashboard has no color, using default"
            );
            setBaseColor(DEFAULT_BASE_COLOR);
            if (document.body) {
              document.body.style.backgroundColor = DEFAULT_BASE_COLOR;
            }
            // Clear appearance tokens to force default colors for dashboards without custom colors
            if (typeof window !== "undefined") {
              window.localStorage.setItem(
                BASE_COLOR_STORAGE_KEY,
                DEFAULT_BASE_COLOR
              );
              window.localStorage.removeItem(APPEARANCE_STORAGE_KEY);
              console.log(
                "[DashboardSwitch] 🗑️ Cleared appearance tokens (dashboard has no custom colors)"
              );
            }
          }

          push({
            title: "Dashboard switched",
            description: `Switched to "${dashboard.name}"`,
            variant: "success",
          });
        } else {
          console.log("[DashboardSwitch] ❌ Dashboard not found", {
            dashboardId,
            availableDashboards: updatedCompany.dashboards.map((d) => ({
              id: d.id,
              name: d.name,
            })),
          });
        }
      } else {
        console.log("[DashboardSwitch] ❌ Failed to reload company", {
          companyId: currentCompany.id,
        });
      }
    },
    [currentCompany, currentDashboard, push]
  );

  const handleDeleteDashboard = useCallback(
    (dashboardId: string) => {
      if (!currentCompany) return;

      // Don't allow deleting the last dashboard
      if (currentCompany.dashboards.length <= 1) {
        push({
          title: "Cannot delete dashboard",
          description: "You must have at least one dashboard.",
          variant: "destructive",
        });
        return;
      }

      console.log("[DeleteDashboard] 🗑️ Deleting dashboard", {
        companyId: currentCompany.id,
        dashboardId,
        dashboardName: currentCompany.dashboards.find(
          (d) => d.id === dashboardId
        )?.name,
      });

      deleteDashboard(currentCompany.id, dashboardId);

      // Reload company from storage
      const updatedCompany = getCompanyById(currentCompany.id);
      if (updatedCompany) {
        setCurrentCompany(updatedCompany);
        const activeDashboard =
          updatedCompany.dashboards.find((d) => d.isActive) ??
          updatedCompany.dashboards[0] ??
          null;
        setCurrentDashboard(activeDashboard);

        push({
          title: "Dashboard deleted",
          description: "Dashboard has been deleted successfully.",
          variant: "success",
        });
      }
    },
    [currentCompany, push]
  );

  const handleApplyTemplate = useCallback(
    async (templateId: string) => {
      if (!currentCompany || !workspace) return;

      const template =
        GUEST_DASHBOARD_TEMPLATES[
          templateId as keyof typeof GUEST_DASHBOARD_TEMPLATES
        ];
      if (!template) {
        push({
          title: "Template not found",
          variant: "destructive",
        });
        return;
      }

      try {
        push({
          title: "Creating dashboard from template",
          description: `Generating "${template.name}"...`,
        });

        // Create dashboard with template
        const dashboardName = `${template.name} Dashboard`;
        const newDashboard = createDashboard(
          currentCompany.id,
          dashboardName,
          templateId
        );

        // Generate tiles from template
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            salesRepCompany: workspace.company.name,
            salesRepWebsite: workspace.company.website || "",
            solution: "Research platform",
            targetCompany: workspace.company.name,
            targetWebsite: workspace.company.website || "",
            templateId,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to generate tiles from template");
        }

        const data = await response.json();

        // Update dashboard with generated tiles
        if (data.workspace?.company?.tiles) {
          updateDashboard(currentCompany.id, newDashboard.id, {
            tiles: data.workspace.company.tiles,
          });
        }

        // Refresh company and dashboard
        if (workspace) {
          const updatedCompany = getOrCreateCompanyFromWorkspace(workspace);
          if (updatedCompany) {
            setCurrentCompany(updatedCompany);
            const updatedDashboard = updatedCompany.dashboards.find(
              (d) => d.id === newDashboard.id
            );
            if (updatedDashboard) {
              setCurrentDashboard(updatedDashboard);
              // Also update workspace to sync
              if (data.workspace) {
                setLocalWorkspace(data.workspace);
                saveCachedWorkspace(workspace.sessionId, data.workspace);
              }
            }
          }
        }

        push({
          title: "Dashboard created",
          description: `"${dashboardName}" has been created from template.`,
          variant: "success",
        });
      } catch (error) {
        push({
          title: "Failed to create dashboard",
          description:
            error instanceof Error
              ? error.message
              : "Please try again in a few moments.",
          variant: "destructive",
        });
      }
    },
    [currentCompany, workspace, push]
  );

  const handleAddPrompt = useCallback(() => {
    setAddPromptModalOpen(true);
  }, []);

  const handleBulkUploadPrompts = useCallback(() => {
    setBulkUploadModalOpen(true);
  }, []);

  const handleCreateCustomPrompt = useCallback(
    async (promptData: {
      title: string;
      description: string;
      useMaxPrompt: boolean;
      requestSize?: "small" | "medium" | "large";
    }) => {
      // CRITICAL: Tentar recarregar do storage se não temos no estado (pode ser race condition)
      let companyToUse = currentCompany;
      let dashboardToUse = currentDashboard;

      if (!companyToUse || !dashboardToUse) {
        console.warn(
          "[AddPrompt] ⚠️ Missing currentCompany or currentDashboard, attempting reload",
          {
            hasCurrentCompany: !!currentCompany,
            hasCurrentDashboard: !!currentDashboard,
          }
        );

        // Tentar recarregar do workspace se existir
        if (workspace) {
          const reloadedCompany = getOrCreateCompanyFromWorkspace(workspace);
          if (reloadedCompany) {
            companyToUse = reloadedCompany;
            setCurrentCompany(reloadedCompany);

            const activeDashboard =
              getActiveDashboard(reloadedCompany.id) ??
              reloadedCompany.dashboards[0] ??
              null;
            if (activeDashboard) {
              dashboardToUse = activeDashboard;
              setCurrentDashboard(activeDashboard);
            }
          }
        }

        // Se ainda não temos, tentar carregar do storage diretamente
        if (!companyToUse) {
          const companies = loadCompaniesWithDashboards();
          if (companies.length > 0) {
            companyToUse = companies[0];
            setCurrentCompany(companyToUse);

            const activeDashboard =
              getActiveDashboard(companyToUse.id) ??
              companyToUse.dashboards[0] ??
              null;
            if (activeDashboard) {
              dashboardToUse = activeDashboard;
              setCurrentDashboard(activeDashboard);
            }
          }
        }

        // Se ainda não temos, não podemos continuar
        if (!companyToUse || !dashboardToUse) {
          console.error(
            "[AddPrompt] ❌ Still missing currentCompany or currentDashboard after reload",
            {
              hasCurrentCompany: !!companyToUse,
              hasCurrentDashboard: !!dashboardToUse,
            }
          );
          push({
            title: "Cannot add prompts",
            description:
              "Please select a dashboard first or create a new dashboard.",
            variant: "destructive",
          });
          return;
        }

        console.log("[AddPrompt] ✅ Reloaded company and dashboard", {
          companyId: companyToUse.id,
          dashboardId: dashboardToUse.id,
        });
      }

      if (!workspace || !isViewingServerWorkspace) {
        push({
          title: "Cannot add prompts",
          description:
            "Please generate a workspace first or switch to the latest one.",
          variant: "destructive",
        });
        return;
      }

      try {
        push({
          title: "Creating custom prompt...",
          description: `Generating "${promptData.title}"`,
        });

        const response = await fetch("/api/workspace/tiles", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: promptData.title,
            prompt: promptData.description,
            useMaxPrompt: promptData.useMaxPrompt,
            requestSize: promptData.requestSize || "small",
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || "Failed to create tile");
        }

        const tileData = await response.json();

        console.log("[AddPrompt] 📥 Tile data received from API", {
          hasTile: !!tileData.tile,
          tileId: tileData.tile?.id,
          tileTitle: tileData.tile?.title,
          hasCurrentCompany: !!currentCompany,
          hasCurrentDashboard: !!currentDashboard,
        });

        // Update dashboard directly - don't rely on workspace sync for blank dashboards
        if (companyToUse && dashboardToUse && tileData.tile) {
          // Marcar que estamos atualizando para prevenir sync durante a operação
          isUpdatingDashboardRef.current = true;

          try {
            // IMPORTANTE: Para Default Dashboard, precisamos mesclar tiles do workspace com o novo tile
            // Porque workspace já foi atualizado pela API com todos os tiles (incluindo o novo)
            const isDefaultDashboard =
              dashboardToUse.name === "Default Dashboard";

            // Reload dashboard from storage first to get the most up-to-date tiles
            const freshCompany = getCompanyById(companyToUse.id);
            const freshDashboard = freshCompany?.dashboards.find(
              (d) => d.id === dashboardToUse.id
            );

            let currentTiles =
              freshDashboard?.tiles || dashboardToUse.tiles || [];

            console.log("[AddPrompt] 📊 Adding tile to dashboard", {
              companyId: companyToUse.id,
              companyName: companyToUse.name,
              dashboardId: dashboardToUse.id,
              dashboardName: dashboardToUse.name,
              isDefaultDashboard,
              tileId: tileData.tile.id,
              tileTitle: tileData.tile.title,
              currentTilesCount: currentTiles.length,
              currentTileIds: currentTiles.map((t) => t.id),
              workspaceTilesCount: workspace?.company?.tiles?.length ?? 0,
              usingFreshData: !!freshDashboard,
            });

            // Para Default Dashboard: mesclar tiles existentes com o novo tile
            // IMPORTANTE: Não confiar no workspace aqui porque pode não estar atualizado ainda
            // Usar o tileData.tile diretamente que vem da API
            if (isDefaultDashboard) {
              console.log(
                "[AddPrompt] 🔄 Default Dashboard detected - adding new tile to existing tiles",
                {
                  existingTilesCount: currentTiles.length,
                  newTileId: tileData.tile.id,
                  newTileTitle: tileData.tile.title,
                  newTileOrderIndex: tileData.tile.orderIndex,
                }
              );

              // Verificar se o tile já existe (prevent duplicates)
              const tileExists = currentTiles.some(
                (t) => t.id === tileData.tile.id
              );
              if (tileExists) {
                console.warn(
                  "[AddPrompt] ⚠️ Tile already exists in dashboard, skipping",
                  {
                    tileId: tileData.tile.id,
                  }
                );
                // Mas ainda atualizar o tile existente com dados mais recentes
                currentTiles = currentTiles.map((t) =>
                  t.id === tileData.tile.id ? tileData.tile : t
                );
              } else {
                // Adicionar o novo tile no início do array para aparecer primeiro
                // O novo tile já tem orderIndex negativo (vem da API)
                // Mas vamos garantir que ele fique primeiro mesmo assim
                currentTiles = [tileData.tile, ...currentTiles];
              }

              // Ordenar por orderIndex (negativos primeiro, depois positivos)
              // Isso garante que tiles novos (negativos) apareçam antes dos templates (positivos)
              currentTiles = currentTiles.sort((a, b) => {
                const aIndex = a.orderIndex ?? 0;
                const bIndex = b.orderIndex ?? 0;
                return aIndex - bIndex; // Negativos primeiro (ex: -1, -2), depois positivos (0, 1, 2...)
              });

              console.log("[AddPrompt] ✅ Added new tile and sorted", {
                finalTilesCount: currentTiles.length,
                finalTileIds: currentTiles.map((t) => ({
                  id: t.id,
                  title: t.title,
                  orderIndex: t.orderIndex,
                })),
                hasNewTile: currentTiles.some((t) => t.id === tileData.tile.id),
              });
            } else {
              // Para blank dashboards: apenas adicionar o novo tile
              // Check if tile already exists (prevent duplicates)
              const tileExists = currentTiles.some(
                (t) => t.id === tileData.tile.id
              );
              if (tileExists) {
                console.warn("[AddPrompt] ⚠️ Tile already exists, skipping", {
                  tileId: tileData.tile.id,
                });
                return;
              }

              // Para blank dashboards: adicionar o novo tile no início
              // Usar orderIndex negativo para aparecer primeiro
              const minOrderIndex =
                currentTiles.length > 0
                  ? Math.min(...currentTiles.map((t) => t.orderIndex ?? 0))
                  : 0;
              const newOrderIndex = minOrderIndex < 0 ? minOrderIndex - 1 : -1;

              const newTileWithOrder = {
                ...tileData.tile,
                orderIndex: newOrderIndex,
              };

              // Adicionar no início do array para aparecer primeiro
              currentTiles = [newTileWithOrder, ...currentTiles];
            }

            console.log("[AddPrompt] 💾 Updating dashboard with tiles", {
              dashboardId: dashboardToUse.id,
              finalTilesCount: currentTiles.length,
              finalTileIds: currentTiles.map((t) => t.id),
            });

            updateDashboard(companyToUse.id, dashboardToUse.id, {
              tiles: currentTiles,
            });

            // Reload company directly from storage (don't sync from workspace)
            // This ensures blank dashboards get the tile immediately
            const reloadedCompany = getCompanyById(companyToUse.id);
            if (reloadedCompany) {
              console.log("[AddPrompt] 🔄 Reloading company from storage", {
                companyId: reloadedCompany.id,
                dashboardsCount: reloadedCompany.dashboards.length,
                dashboardIds: reloadedCompany.dashboards.map((d) => ({
                  id: d.id,
                  name: d.name,
                  tilesCount: d.tiles?.length ?? 0,
                })),
              });
              setCurrentCompany(reloadedCompany);
              const reloadedDashboard = reloadedCompany.dashboards.find(
                (d) => d.id === dashboardToUse.id
              );
              if (reloadedDashboard) {
                console.log("[AddPrompt] ✅ Dashboard reloaded", {
                  dashboardId: reloadedDashboard.id,
                  dashboardName: reloadedDashboard.name,
                  tilesCount: reloadedDashboard.tiles?.length ?? 0,
                  tileIds:
                    reloadedDashboard.tiles?.map((t) => ({
                      id: t.id,
                      title: t.title,
                    })) ?? [],
                });
                // Force update by creating a new object reference to trigger useMemo recalculation
                setCurrentDashboard({ ...reloadedDashboard });
              } else {
                console.error(
                  "[AddPrompt] ❌ Dashboard not found after reload",
                  {
                    expectedDashboardId: dashboardToUse.id,
                    availableDashboards: reloadedCompany.dashboards.map(
                      (d) => ({ id: d.id, name: d.name })
                    ),
                  }
                );
              }
            } else {
              console.error("[AddPrompt] ❌ Company not found after reload", {
                expectedCompanyId: companyToUse.id,
              });
            }
          } finally {
            // Liberar lock após um delay maior para garantir que estado foi atualizado
            // IMPORTANTE: NÃO chamar mutate() aqui porque isso dispara useEffect que pode sobrescrever
            // O workspace já foi atualizado pela API, não precisamos atualizar o estado React
            setTimeout(() => {
              isUpdatingDashboardRef.current = false;
              console.log("[AddPrompt] 🔓 Released update lock");
            }, 1000); // Aumentado para 1s para garantir que tudo foi atualizado antes de permitir sync
          }
        } else {
          console.error("[AddPrompt] ❌ Missing required data", {
            hasCurrentCompany: !!currentCompany,
            hasCurrentDashboard: !!currentDashboard,
            hasTileData: !!tileData?.tile,
            currentCompanyId: currentCompany?.id,
            currentDashboardId: currentDashboard?.id,
          });
        }

        // Don't call mutate() here - it can cause workspace to sync and overwrite dashboard tiles
        // The dashboard is already updated directly, so we don't need to refresh workspace
        // await mutate(); // Commented out to prevent overwriting dashboard tiles

        push({
          title: "Custom prompt added!",
          description: `"${promptData.title}" has been added to your dashboard.`,
          variant: "success",
        });
      } catch (error) {
        console.error("Failed to create custom prompt:", error);
        push({
          title: "Failed to add prompt",
          description:
            error instanceof Error ? error.message : "Please try again.",
          variant: "destructive",
        });
      }
    },
    [workspace, isViewingServerWorkspace, mutate, push]
  );

  const handleSelectWorkspace = useCallback(
    (nextSessionId: string) => {
      if (nextSessionId === viewingSessionId) return;

      console.log(
        `[AdminContainer] 👤 User manually selected workspace: ${nextSessionId} (was: ${viewingSessionId})`
      );

      // If user selects the server session, clear the flag to allow auto-switching again
      if (data && data.sessionId === nextSessionId) {
        userSelectedSessionRef.current = null;
        setViewingSessionId(nextSessionId);
        setLocalWorkspace(data);
        rememberSessionId(nextSessionId);
        return;
      }

      // Mark this as a user selection to prevent auto-switching
      // This prevents the system from switching back to server session automatically
      userSelectedSessionRef.current = nextSessionId;

      const cached = loadCachedWorkspace(nextSessionId);
      if (cached) {
        setLocalWorkspace(cached);
        setViewingSessionId(nextSessionId);
        setSessionId(nextSessionId);
        rememberSessionId(nextSessionId);
        return;
      }
      push({
        title: "Workspace unavailable",
        description:
          "We couldn't find that workspace locally. Generate it again from the landing page.",
        variant: "destructive",
      });
    },
    [data, push, viewingSessionId]
  );

  const handleDeleteTile = async (tileId: string) => {
    if (!isViewingServerWorkspace) {
      push({
        title: "Switch to latest workspace",
        description: "Delete tiles on the most recently generated workspace.",
        variant: "destructive",
      });
      return;
    }
    try {
      const response = await fetch(`/api/workspace/tiles/${tileId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        if (response.status === 404) {
          push({
            title: "Session expired",
            description: "Return to the homepage to generate a new workspace.",
            variant: "destructive",
          });
          if (sessionId) {
            deleteCachedWorkspace(sessionId);
          }
          setLocalWorkspace(null);
          await mutate();
          return;
        }
        throw new Error("Failed to remove tile");
      }

      // Update dashboard if we have one
      if (currentCompany && currentDashboard) {
        isUpdatingDashboardRef.current = true;
        try {
          const updatedTiles = currentDashboard.tiles.filter(
            (t) => t.id !== tileId
          );
          updateDashboard(currentCompany.id, currentDashboard.id, {
            tiles: updatedTiles,
          });
          // Reload company directly from storage (don't sync from workspace)
          const reloadedCompany = getCompanyById(currentCompany.id);
          if (reloadedCompany) {
            setCurrentCompany(reloadedCompany);
            const reloadedDashboard = reloadedCompany.dashboards.find(
              (d) => d.id === currentDashboard.id
            );
            if (reloadedDashboard) {
              setCurrentDashboard({ ...reloadedDashboard });
            }
          }
        } finally {
          setTimeout(() => {
            isUpdatingDashboardRef.current = false;
          }, 200);
        }
      }

      // Não chamar mutate() aqui - pode causar sync que sobrescreve dados
      // await mutate();
      refreshStoredWorkspaces();
      push({
        title: "Tile removed",
        variant: "success",
      });
    } catch (err) {
      push({
        title: "Deletion failed",
        description:
          err instanceof Error
            ? err.message
            : "Please try again in a few moments.",
        variant: "destructive",
      });
    }
  };

  const handleReorderTiles = async (order: string[]) => {
    if (!order.length) return;
    if (!isViewingServerWorkspace) {
      push({
        title: "Switch to latest workspace",
        description: "Reorder tiles on the most recently generated workspace.",
        variant: "destructive",
      });
      return;
    }
    try {
      setIsPersistingOrder(true);
      const response = await fetch("/api/workspace/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order }),
      });
      if (!response.ok) {
        if (response.status === 404) {
          push({
            title: "Session expired",
            description: "Return to the homepage to generate a new workspace.",
            variant: "destructive",
          });
          if (sessionId) {
            deleteCachedWorkspace(sessionId);
          }
          setLocalWorkspace(null);
          await mutate();
          return;
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to persist tile order");
      }

      // Update dashboard if we have one
      if (currentCompany && currentDashboard) {
        isUpdatingDashboardRef.current = true;
        try {
          // Reorder tiles based on new order
          const tileMap = new Map(currentDashboard.tiles.map((t) => [t.id, t]));
          const reorderedTiles = order
            .map((id, index) => {
              const tile = tileMap.get(id);
              if (tile) {
                return { ...tile, orderIndex: index };
              }
              return null;
            })
            .filter((t): t is Tile => t !== null);

          updateDashboard(currentCompany.id, currentDashboard.id, {
            tiles: reorderedTiles,
          });
          // Reload company directly from storage (don't sync from workspace)
          const reloadedCompany = getCompanyById(currentCompany.id);
          if (reloadedCompany) {
            setCurrentCompany(reloadedCompany);
            const reloadedDashboard = reloadedCompany.dashboards.find(
              (d) => d.id === currentDashboard.id
            );
            if (reloadedDashboard) {
              setCurrentDashboard({ ...reloadedDashboard });
            }
          }
        } finally {
          setTimeout(() => {
            isUpdatingDashboardRef.current = false;
          }, 200);
        }
      }

      // Não chamar mutate() aqui - pode causar sync que sobrescreve dados
      // await mutate();
      refreshStoredWorkspaces();
    } catch (err) {
      push({
        title: "Reorder failed",
        description:
          err instanceof Error ? err.message : "Please try again shortly.",
        variant: "destructive",
      });
    } finally {
      setIsPersistingOrder(false);
    }
  };

  const handleRegenerateTile = async (tileId: string) => {
    if (!isViewingServerWorkspace) {
      push({
        title: "Switch to latest workspace",
        description:
          "Regenerate insights on the most recently generated workspace.",
        variant: "destructive",
      });
      return;
    }
    if (!ensureAllowance("regenerate")) {
      return;
    }
    setRegeneratingTileIds((prev) => {
      const next = new Set(prev);
      next.add(tileId);
      return next;
    });
    try {
      const response = await fetch(
        `/api/workspace/tiles/${tileId}/regenerate`,
        {
          method: "POST",
        }
      );
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(
          (payload.error as string) ??
            "We couldn't regenerate this insight right now."
        );
      }
      if (isGuest) {
        commitUsage("regenerate");
      }
      await mutate();
      refreshStoredWorkspaces();
    } catch (err) {
      push({
        title: "Regeneration failed",
        description:
          err instanceof Error ? err.message : "Please try again shortly.",
        variant: "destructive",
      });
    } finally {
      setRegeneratingTileIds((prev) => {
        const next = new Set(prev);
        next.delete(tileId);
        return next;
      });
    }
  };

  const handleCreateContactFromModal = async (payload: {
    name: string;
    jobTitle: string;
    linkedinUrl: string;
  }) => {
    if (isSavingContact) return;
    if (!isViewingServerWorkspace) {
      push({
        title: "Switch to latest workspace",
        description: "Add contacts on the most recently generated workspace.",
        variant: "destructive",
      });
      return;
    }
    if (!ensureAllowance("createContact")) {
      return;
    }
    const trimmedName = payload.name.trim();
    if (!trimmedName) {
      push({
        title: "Add a name first",
        description: "The contact must have at least a name.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingContact(true);
    try {
      const response = await fetch("/api/workspace/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          jobTitle: payload.jobTitle.trim(),
          linkedinUrl: payload.linkedinUrl.trim(),
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (data.error as string) ?? "We couldn't save this contact right now."
        );
      }
      if (isGuest) {
        commitUsage("createContact");
      }
      setAddContactModalOpen(false);
      await mutate();
      refreshStoredWorkspaces();
      push({
        title: "Contact saved",
        variant: "success",
      });
    } catch (err) {
      push({
        title: "Contact not saved",
        description:
          err instanceof Error
            ? err.message
            : "Please try again in a few moments.",
        variant: "destructive",
      });
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleGenerateWorkspaceFromModal = async ({
    company,
    companyWebsite,
    solution,
    researchTarget,
    researchWebsite,
  }: {
    company: string;
    companyWebsite: string;
    solution: string;
    researchTarget: string;
    researchWebsite: string;
  }) => {
    if (isGeneratingWorkspace) return;
    if (!ensureAllowance("createWorkspace")) {
      return;
    }
    setIsGeneratingWorkspace(true);

    const payload = {
      salesRepCompany: company.trim(),
      salesRepWebsite: companyWebsite.trim(),
      solution: solution.trim(),
      targetCompany: researchTarget.trim(),
      targetWebsite: researchWebsite.trim(),
    };

    try {
      push({
        title: "Generating insights",
        description: `Starting AI generation for ${payload.targetCompany}.`,
      });
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ??
            "We couldn't start the generation for this company. Try again in a few moments."
        );
      }

      if (data?.sessionId) {
        rememberSessionId(data.sessionId);
      }
      if (data?.workspace) {
        // Clear user selection flag when new workspace is generated
        // This allows the system to auto-switch to the new workspace
        userSelectedSessionRef.current = null;
        saveCachedWorkspace(data.workspace.sessionId, data.workspace);
        setLocalWorkspace(data.workspace);
        setViewingSessionId(data.workspace.sessionId);
        setSessionId(data.workspace.sessionId);
      }

      if (isGuest) {
        commitUsage("createWorkspace");
      }
      push({
        title: "Workspace updated",
        description: `We're populating insights for ${payload.targetCompany}.`,
        variant: "success",
      });
      setAddCompanyModalOpen(false);
      await mutate();
      router.refresh();
      refreshStoredWorkspaces();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Please try again shortly.";
      push({
        title: "Generation failed",
        description: message,
        variant: "destructive",
      });
      throw new Error(message);
    } finally {
      setIsGeneratingWorkspace(false);
    }
  };

  const handleOpenTile = (tile: Tile) => {
    setSelectedTileId(tile.id);
  };

  const handleCloseTile = () => {
    setSelectedTileId(null);
  };

  const handleOpenContactCard = (contact: Contact) => {
    setSelectedContactId(contact.id);
  };

  const handleCloseContactModal = () => {
    setSelectedContactId(null);
  };

  const handleSubmitContactChat = async (
    contactId: string,
    message: string
  ) => {
    if (!isViewingServerWorkspace) {
      push({
        title: "Switch to latest workspace",
        description:
          "Continue the AI conversation on the most recent workspace.",
        variant: "destructive",
      });
      return;
    }

    const trimmed = message.trim();
    if (!trimmed) return;
    if (!ensureAllowance("contactChat")) {
      return;
    }

    try {
      setIsContactChatting(true);
      const response = await fetch(
        `/api/workspace/contacts/${contactId}/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed }),
        }
      );
      if (!response.ok) {
        if (response.status === 404) {
          push({
            title: "Session expired",
            description: "Return to the homepage to generate a new workspace.",
            variant: "destructive",
          });
          if (sessionId) {
            deleteCachedWorkspace(sessionId);
          }
          setLocalWorkspace(null);
          await mutate();
          return;
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to generate follow-up insight");
      }
      if (isGuest) {
        commitUsage("contactChat");
      }
      await mutate();
      refreshStoredWorkspaces();
      push({
        title: "Contact insight updated",
        variant: "success",
      });
    } catch (error) {
      push({
        title: "Chat failed",
        description:
          error instanceof Error
            ? error.message
            : "Please try again in a few moments.",
        variant: "destructive",
      });
    } finally {
      setIsContactChatting(false);
    }
  };

  const handleSubmitFollowUp = async (
    tileId: string,
    payload: TileChatPayload
  ) => {
    if (!isViewingServerWorkspace) {
      push({
        title: "Switch to latest workspace",
        description:
          "Continue the AI conversation on the most recent workspace.",
        variant: "destructive",
      });
      return;
    }

    const trimmedMessage = payload.message.trim();
    if (!trimmedMessage) return;
    if (!ensureAllowance("tileChat")) {
      return;
    }

    const attachments = payload.attachments ?? [];

    try {
      setIsChatting(true);
      const response = await fetch(`/api/workspace/tiles/${tileId}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmedMessage, attachments }),
      });
      if (!response.ok) {
        if (response.status === 404) {
          push({
            title: "Session expired",
            description: "Return to the homepage to generate a new workspace.",
            variant: "destructive",
          });
          if (sessionId) {
            deleteCachedWorkspace(sessionId);
          }
          setLocalWorkspace(null);
          await mutate();
          return;
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error ?? "Failed to generate follow-up insight"
        );
      }

      // Get the updated tile from the response
      const responseData = await response.json().catch(() => null);

      if (isGuest) {
        commitUsage("tileChat");
      }

      if (responseData?.tile) {
        // Update local workspace immediately with the new tile data
        const updatedTile = responseData.tile;
        console.log(
          `[AdminContainer] 💬 Chat response received for tile ${tileId}:`,
          {
            historyLength: updatedTile.history?.length ?? 0,
            lastMessage: updatedTile.history?.[
              updatedTile.history.length - 1
            ]?.content?.substring(0, 50),
          }
        );

        setLocalWorkspace((prev) => {
          if (!prev) return prev;
          const currentTiles = prev.company.tiles || [];
          const tileIndex = currentTiles.findIndex((t) => t.id === tileId);
          if (tileIndex === -1) {
            console.warn(
              `[AdminContainer] ⚠️ Tile ${tileId} not found in local workspace`
            );
            return prev;
          }

          const nextTiles = [...currentTiles];
          nextTiles[tileIndex] = updatedTile;

          const updated = {
            ...prev,
            company: {
              ...prev.company,
              tiles: nextTiles,
            },
          };

          // Save to cache immediately to ensure persistence
          saveCachedWorkspace(prev.sessionId, updated);
          console.log(
            `[AdminContainer] 💾 Saved chat history to cache for tile ${tileId} (session: ${prev.sessionId})`
          );

          return updated;
        });
      } else {
        console.warn(
          `[AdminContainer] ⚠️ No tile data in chat response for ${tileId}`
        );
      }

      // Refresh from server to ensure consistency
      await mutate();
      refreshStoredWorkspaces();
      push({
        title: "Follow-up insight added",
        variant: "success",
      });
    } catch (err) {
      push({
        title: "Follow-up failed",
        description:
          err instanceof Error
            ? err.message
            : "Please try again in a few moments.",
        variant: "destructive",
      });
    } finally {
      setIsChatting(false);
    }
  };

  const handleRegenerateContact = async (contactId: string) => {
    if (!isViewingServerWorkspace) {
      push({
        title: "Switch to latest workspace",
        description: "Regenerate contacts on the most recent workspace.",
        variant: "destructive",
      });
      return;
    }
    if (!ensureAllowance("regenerate")) {
      return;
    }

    setRegeneratingContactId(contactId);
    try {
      const response = await fetch(
        `/api/workspace/contacts/${contactId}/regenerate`,
        { method: "POST" }
      );
      if (!response.ok) {
        if (response.status === 404) {
          push({
            title: "Session expired",
            description: "Return to the homepage to generate a new workspace.",
            variant: "destructive",
          });
          if (sessionId) {
            deleteCachedWorkspace(sessionId);
          }
          setLocalWorkspace(null);
          await mutate();
          return;
        }
        const data = await response.json().catch(() => ({}));
        throw new Error(
          (data.error as string) ?? "We couldn't refresh this contact now."
        );
      }
      if (isGuest) {
        commitUsage("regenerate");
      }
      await mutate();
      router.refresh();
      refreshStoredWorkspaces();
      push({
        title: "Contact updated",
        description: "Outreach insights regenerated for this contact.",
        variant: "success",
      });
    } catch (error) {
      push({
        title: "Regeneration failed",
        description:
          error instanceof Error
            ? error.message
            : "Try again in a few moments.",
        variant: "destructive",
      });
    } finally {
      setRegeneratingContactId(null);
    }
  };

  const tileDetailModal = activeTile ? (
    <TileDetailModal
      tile={activeTile}
      onClose={handleCloseTile}
      onSubmit={(payload) => handleSubmitFollowUp(activeTile.id, payload)}
      isSubmitting={isChatting}
      theme={theme}
    />
  ) : null;

  if (workspaceError && !workspace) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f8] text-[#3a3a41]">
        <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-4 text-sm">
          {workspaceError.status === 404
            ? "Your workspace cache expired. Return to the homepage to generate a new set of insights."
            : "We couldn&apos;t load the workspace. Refresh the page and try again."}
        </div>
      </div>
    );
  }

  const workspaceLabel = workspace?.company.name ?? "Workspace";
  const companyName = workspace?.company.name ?? "Workspace";

  const handleOpenAddContactModal = () => {
    if (!ensureAllowance("createContact")) return;
    setAddContactModalOpen(true);
  };
  const handleOpenAddCompanyModal = () => {
    if (!ensureAllowance("createWorkspace")) return;
    setAddCompanyModalOpen(true);
  };

  return (
    <>
      <AdminShellAde
        appearance={appearanceTokens}
        sidebar={
          <AdminSidebarAde
            appearance={(() => {
              console.log(
                "[AdminContainer] 📤 Passing appearanceTokens to AdminSidebarAde:",
                {
                  baseColor: appearanceTokens.baseColor,
                  sidebarColor: appearanceTokens.sidebarColor,
                  textColor: appearanceTokens.textColor,
                  headingColor: appearanceTokens.headingColor,
                  mutedTextColor: appearanceTokens.mutedTextColor,
                }
              );
              return appearanceTokens;
            })()}
            workspaceName={workspaceLabel}
            companies={companyOptions}
            onSelectCompany={handleSelectWorkspace}
            onAddCompany={handleOpenAddCompanyModal}
            onAddContact={handleOpenAddContactModal}
          />
        }
        header={
          <AdminHeaderAde
            appearance={appearanceTokens}
            workspaceName={workspaceLabel}
            companyName={companyName}
            companyId={currentCompany?.id}
            currentDashboardId={currentDashboard?.id}
            dashboards={currentCompany?.dashboards.map((d) => ({
              id: d.id,
              name: d.name,
              isActive: d.isActive,
            }))}
            onCustomizeBackground={handleCustomizeBackground}
            onSaveTemplate={handleSaveTemplate}
            onLogin={handleHeaderLogin}
            onSignUp={handleStartCheckout}
            onCreateBlankDashboard={() =>
              setCreateBlankDashboardModalOpen(true)
            }
            onSelectDashboard={handleSelectDashboard}
            onDeleteDashboard={handleDeleteDashboard}
            onApplyTemplate={handleApplyTemplate}
          />
        }
      >
        {isLoading && !workspace ? (
          <EmptyStateAde
            title="Loading insights"
            description="Rehydrating workspace data from the local cache."
            isLoading={true}
          />
        ) : tiles.length === 0 ? (
          (() => {
            // Check if we're actually generating or if it's just an empty blank dashboard
            // Simplified generation detection using local state + fallbacks
            const isActuallyGenerating = (() => {
              // PRIORITY 0: Use local generation state (mais confiável)
              if (generationState.isGenerating) {
                console.log("[EmptyState] 🚀 Local generation state active");
                return true;
              }

              // PRIORITY 1: Check streaming state
              if (shouldUseStreaming && isStreaming && !streamingCompleted) {
                console.log("[EmptyState] 📺 Streaming active");
                return true;
              }

              // PRIORITY 2: Fallback to workspace timestamps (menos confiável)
              if (workspace?.generatedAt) {
                const generatedTime = new Date(workspace.generatedAt).getTime();
                const now = Date.now();
                const fiveMinutesAgo = now - 5 * 60 * 1000;
                if (generatedTime > fiveMinutesAgo) {
                  console.log("[EmptyState] ⚡ Workspace recently generated");
                  return true;
                }
              }

              // PRIORITY 3: Check localStorage as last resort
              if (typeof window !== "undefined") {
                const lastGenerationTime = window.localStorage.getItem("last-generation-time");
                if (lastGenerationTime) {
                  const genTime = parseInt(lastGenerationTime, 10);
                  const now = Date.now();
                  const fiveMinutesAgo = now - 5 * 60 * 1000;
                  if (genTime > fiveMinutesAgo) {
                    console.log("[EmptyState] 📱 localStorage generation timestamp");
                    return true;
                  }
                }
              }

              // PRIORITY 4: Check if dashboard is intentionally blank
              const isBlankDashboard = currentDashboard &&
                !currentDashboard.templateId &&
                currentDashboard.name !== "Default Dashboard";

              if (isBlankDashboard) {
                console.log("[EmptyState] 🆕 Blank dashboard (user created)");
                return false;
              }

              console.log("[EmptyState] ✅ No generation detected");
              return false;
            })();

            const isBlankDashboard =
              currentDashboard &&
              !currentDashboard.templateId &&
              currentDashboard.name !== "Default Dashboard";

            if (isActuallyGenerating) {
              // Estado: Gerando insights (vindo do onboarding)
              return (
                <EmptyStateAde
                  title="Generating insights..."
                  description="AI is creating insights for your research."
                  isLoading={false}
                  isGenerating={true} // Diferencia de loading normal
                  streamingProgress={
                    (shouldUseStreaming && isStreaming) || generationState.isGenerating
                      ? {
                          completed: generationState.tilesGenerated || streamingCompletedTiles,
                          total: generationState.totalTiles || streamingTotalTiles,
                        }
                      : undefined
                  }
                />
              );
            } else if (isBlankDashboard) {
              // Estado: Dashboard vazio criado pelo usuário (não está gerando)
              return (
                <EmptyStateAde
                  title="No insights yet"
                  description="This dashboard is empty. Create your first insight to get started."
                  isLoading={false}
                  isGenerating={false}
                  action={{
                    label: "Add Prompt",
                    onClick: handleAddPrompt,
                  }}
                />
              );
            } else {
              // Estado: Default Dashboard vazio (pode ser vazio ou carregando)
              return (
                <EmptyStateAde
                  title="No insights yet"
                  description="This dashboard is empty. Create your first insight to get started."
                  isLoading={false}
                  isGenerating={false}
                  action={{
                    label: "Add Prompt",
                    onClick: handleAddPrompt,
                  }}
                />
              );
            }
          })()
        ) : (
          <TileGridAde
            appearance={appearanceTokens}
            tiles={tiles}
            onDeleteTile={handleDeleteTile}
            onReorderTiles={handleReorderTiles}
            onOpenTile={handleOpenTile}
            isReordering={isPersistingOrder}
            onRegenerateTile={handleRegenerateTile}
            regeneratingTileIds={Array.from(regeneratingTileIds)}
            onAddPrompt={handleAddPrompt}
            onBulkUploadPrompts={handleBulkUploadPrompts}
            animateEntrance={shouldUseStreaming && streamingCompleted}
          />
        )}

        <div className="mt-12 space-y-12">
          <ContactsPanelAde
            appearance={appearanceTokens}
            contacts={contacts}
            onContactsChanged={async () => {
              // CRITICAL: Update dashboard contacts from workspace after API call
              if (currentCompany && currentDashboard) {
                const updatedWorkspace = await fetch("/api/workspace")
                  .then((r) => r.json())
                  .catch(() => null);
                if (updatedWorkspace?.company?.contacts) {
                  updateDashboard(currentCompany.id, currentDashboard.id, {
                    contacts: updatedWorkspace.company.contacts,
                  });
                  // Reload company to refresh UI
                  const reloadedCompany = getCompanyById(currentCompany.id);
                  if (reloadedCompany) {
                    setCurrentCompany(reloadedCompany);
                    const reloadedDashboard = reloadedCompany.dashboards.find(
                      (d) => d.id === currentDashboard.id
                    );
                    if (reloadedDashboard) {
                      setCurrentDashboard(reloadedDashboard);
                    }
                  }
                }
              }
              await mutate();
              refreshStoredWorkspaces();
            }}
            onAddContact={handleOpenAddContactModal}
            onRegenerateContact={handleRegenerateContact}
            regeneratingContactId={regeneratingContactId}
            onOpenContact={handleOpenContactCard}
          />
          <NotesPanelAde
            appearance={appearanceTokens}
            notes={notes}
            onNotesChanged={async () => {
              // CRITICAL: Update dashboard notes from workspace after API call
              if (currentCompany && currentDashboard) {
                const updatedWorkspace = await fetch("/api/workspace")
                  .then((r) => r.json())
                  .catch(() => null);
                if (updatedWorkspace?.company?.notes) {
                  updateDashboard(currentCompany.id, currentDashboard.id, {
                    notes: updatedWorkspace.company.notes,
                  });
                  // Reload company to refresh UI
                  const reloadedCompany = getCompanyById(currentCompany.id);
                  if (reloadedCompany) {
                    setCurrentCompany(reloadedCompany);
                    const reloadedDashboard = reloadedCompany.dashboards.find(
                      (d) => d.id === currentDashboard.id
                    );
                    if (reloadedDashboard) {
                      setCurrentDashboard(reloadedDashboard);
                    }
                  }
                }
              }
              await mutate();
              refreshStoredWorkspaces();
            }}
          />
          <FilesPlaceholderAde appearance={appearanceTokens} />
        </div>
        {tileDetailModal}
        {activeContact ? (
          <ContactDetailModal
            contact={activeContact}
            onClose={handleCloseContactModal}
            onRegenerate={() => handleRegenerateContact(activeContact.id)}
            isRegenerating={regeneratingContactId === activeContact.id}
            onSubmitChat={(message) =>
              handleSubmitContactChat(activeContact.id, message)
            }
            isChatting={isContactChatting}
          />
        ) : null}
      </AdminShellAde>

      <UpgradeModal
        open={isUpgradeModalOpen}
        onClose={() => {
          setUpgradeModalOpen(false);
          setUpgradeReason(null);
        }}
        onCheckout={handleStartCheckout}
        onMarkMember={handleConfirmMembership}
        stripeCheckoutUrl={stripeCheckoutUrl}
        usage={usage}
        limits={limits}
        lastAction={upgradeReason}
      />

      <AddContactModal
        open={isAddContactModalOpen}
        onClose={() => setAddContactModalOpen(false)}
        onSubmit={handleCreateContactFromModal}
        isSubmitting={isSavingContact}
      />
      <AddCompanyModal
        open={isAddCompanyModalOpen}
        onClose={() => setAddCompanyModalOpen(false)}
        onSubmit={handleGenerateWorkspaceFromModal}
        isSubmitting={isGeneratingWorkspace}
      />

      <AddPromptModal
        open={isAddPromptModalOpen}
        onClose={() => setAddPromptModalOpen(false)}
        onAddPrompt={async (prompt) => {
          await handleCreateCustomPrompt(prompt);
          setAddPromptModalOpen(false);
        }}
      />

      <BulkUploadModal
        open={isBulkUploadModalOpen}
        onClose={() => setBulkUploadModalOpen(false)}
        onBulkUpload={(file) => {
          push({
            title: "Bulk Upload Started",
            description: `Processing ${file.name}... This may take a moment.`,
          });
          setBulkUploadModalOpen(false);
        }}
      />

      <CreateBlankDashboardModal
        open={isCreateBlankDashboardModalOpen}
        onClose={() => setCreateBlankDashboardModalOpen(false)}
        onSubmit={handleCreateBlankDashboard}
        isSubmitting={isCreatingBlankDashboard}
      />
    </>
  );
}
