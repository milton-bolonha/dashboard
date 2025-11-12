"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";

import { useToast } from "@/lib/state/toast-context";
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
import { resolveModel } from "@/lib/ai/settings";
import {
  deleteWorkspace as deleteCachedWorkspace,
  getLastSessionId,
  loadWorkspace as loadCachedWorkspace,
  saveWorkspace as saveCachedWorkspace,
  rememberSessionId,
  listStoredWorkspaces,
} from "@/lib/storage/workspace-browser";
import { useAdminTheme } from "@/lib/state/admin-theme-context";
import {
  computeAdeAppearanceTokens,
  type AdeAppearanceTokens,
} from "@/lib/ade-theme";
import { hexToRgb, rgbToHex, getLuminance } from "@/lib/color";
import {
  useMembership,
  type GuestAction,
} from "@/lib/state/membership-context";
import { UpgradeModal } from "@/components/ui/UpgradeModal";

const DEFAULT_BASE_COLOR = process.env.NEXT_PUBLIC_ADE_BASE_COLOR ?? "#f5f5f0";
const BASE_COLOR_STORAGE_KEY = "ade-base-color";

// Helper function to normalize color values (used before normalizeColorValue callback is available)
function normalizeColorValueSync(value: string): string {
  const trimmed = value?.trim() ?? "";
  const candidate = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  const rgb = hexToRgb(candidate);
  if (!rgb) {
    return DEFAULT_BASE_COLOR;
  }
  return rgbToHex(rgb);
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

  const { data, error, isLoading, mutate } = useSWR<WorkspaceResponse>(
    "/api/workspace",
    fetchWorkspace,
    {
      refreshInterval: (data) => {
        // Poll every 2 seconds if no tiles yet (generation in progress)
        const hasTiles = data?.company?.tiles && data.company.tiles.length > 0;
        if (hasTiles) {
          // Clear generation timestamp when tiles are detected
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("last-generation-time");
          }
          // Reset polling state
          pollingAttemptsRef.current = 0;
          lastPollingIntervalRef.current = 2000;
          console.log("[AdminContainer] ✅ Tiles found, stopping polling");
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
            } else {
              // Clear old timestamp
              window.localStorage.removeItem("last-generation-time");
            }
          }
        }

        // If we have a workspace but no tiles, check if it's a fresh workspace
        // Only poll if workspace was created very recently (within 1 minute)
        if (!shouldPoll && data && generatedAt) {
          const generatedTime = new Date(generatedAt).getTime();
          const now = Date.now();
          const oneMinuteAgo = now - 60 * 1000;
          if (generatedTime > oneMinuteAgo) {
            shouldPoll = true;
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
  const [baseColor, setBaseColor] = useState(() => {
    // Use default on server, will be updated on client
    if (typeof window === "undefined") {
      return DEFAULT_BASE_COLOR;
    }
    const stored = window.localStorage.getItem(BASE_COLOR_STORAGE_KEY);
    if (stored && /^#[0-9A-Fa-f]{6}$/.test(stored)) {
      // Normalize the color to ensure consistency
      const normalized = normalizeColorValueSync(stored);
      console.log(
        "[AdminContainer] 🎨 Initial state: Loading color from localStorage:",
        normalized
      );
      return normalized;
    }
    console.log(
      "[AdminContainer] 🎨 Initial state: Using default color:",
      DEFAULT_BASE_COLOR
    );
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
  const appearanceTokens = useMemo<AdeAppearanceTokens>(
    () => computeAdeAppearanceTokens(baseColor),
    [baseColor]
  );
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
    });
    setSessionId(data.sessionId);
    setLocalWorkspace(data);
    saveCachedWorkspace(data.sessionId, data);
    refreshStoredWorkspaces();
    setViewingSessionId((current) => current ?? data.sessionId);
    cacheWarningShownRef.current = false;

    // Clear generation timestamp if tiles are present (generation complete)
    if (data.company?.tiles && data.company.tiles.length > 0) {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("last-generation-time");
        console.log(
          "[AdminContainer] ✅ Tiles detected, cleared generation timestamp"
        );
      }
      // Force UI update by triggering a re-render
      // The tiles will be displayed via the useMemo that depends on workspace
    }
  }, [data, refreshStoredWorkspaces]);

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

  // Log workspace source para debug (apenas quando muda)
  useEffect(() => {
    if (workspace) {
      console.log(
        `[AdminContainer] 📍 Workspace source: ${workspaceState.source} (sessionId: ${workspace.sessionId})`
      );
    }
  }, [workspaceState.source, workspace?.sessionId]);

  const tiles: Tile[] = useMemo(() => {
    if (!workspace) return [];
    const now = new Date().toISOString();
    return [...workspace.company.tiles]
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
  }, [workspace]);

  const activeTile = useMemo(
    () => tiles.find((tile) => tile.id === selectedTileId) ?? null,
    [tiles, selectedTileId]
  );

  const notes: Note[] = useMemo(
    () => workspace?.company.notes ?? [],
    [workspace?.company.notes]
  );
  const contacts: Contact[] = useMemo(
    () => workspace?.company.contacts ?? [],
    [workspace?.company.contacts]
  );
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
        return {
          sessionId: session,
          name: snapshot.company.name || "Workspace",
          generatedAt,
          tilesCount: snapshot.company.tiles?.length ?? 0,
          notesCount: snapshot.company.notes?.length ?? 0,
          contactsCount: snapshot.company.contacts?.length ?? 0,
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

  const handleToggleDarkMode = useCallback(() => {
    // Toggle between light and dark base colors
    const isDark = getLuminance(baseColor) < 0.5;
    const newColor = isDark ? "#f5f5f0" : "#1a1a1a";
    const normalized = normalizeColorValue(newColor);

    // Save to localStorage immediately
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(BASE_COLOR_STORAGE_KEY, normalized);
        console.log(
          "[AdminContainer] 💾 Dark mode color saved immediately to localStorage:",
          normalized
        );
        hasLoadedFromStorageRef.current = true; // Mark that we have a custom color
      } catch {
        // ignore storage failures
      }
    }

    setBaseColor(normalized);

    push({
      title: isDark ? "Switched to light mode" : "Switched to dark mode",
      description: "Dashboard theme has been updated.",
      variant: "success",
    });
  }, [baseColor, normalizeColorValue, push]);

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

        // Save to localStorage immediately
        if (typeof window !== "undefined") {
          try {
            window.localStorage.setItem(BASE_COLOR_STORAGE_KEY, normalized);
            console.log(
              "[AdminContainer] 💾 Color saved immediately to localStorage:",
              normalized
            );
            hasLoadedFromStorageRef.current = true; // Mark that we have a custom color
          } catch {
            // ignore storage failures
          }
        }

        setBaseColor(normalized);

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
    }) => {
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
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);
          throw new Error(errorData?.error || "Failed to create tile");
        }

        await response.json();

        // Refresh the workspace data
        await mutate();

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
      if (data && data.sessionId === nextSessionId) {
        setViewingSessionId(nextSessionId);
        setLocalWorkspace(data);
        rememberSessionId(nextSessionId);
        return;
      }
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
      await mutate();
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
      await mutate();
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
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to generate follow-up insight");
      }
      if (isGuest) {
        commitUsage("tileChat");
      }
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
            appearance={appearanceTokens}
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
            onCustomizeBackground={handleCustomizeBackground}
            onToggleDarkMode={handleToggleDarkMode}
            onSaveTemplate={handleSaveTemplate}
            onLogin={handleHeaderLogin}
            onSignUp={handleStartCheckout}
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
          <EmptyStateAde
            title="Generating insights..."
            description="AI is creating insights for your research."
            isLoading={true}
          />
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
          />
        )}

        <div className="mt-12 space-y-12">
          <ContactsPanelAde
            appearance={appearanceTokens}
            contacts={contacts}
            onContactsChanged={async () => {
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
    </>
  );
}
