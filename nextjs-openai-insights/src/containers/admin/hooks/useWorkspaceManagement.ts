"use client";

import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import useSWR from "swr";
import type { WorkspaceSnapshot } from "@/lib/types";
import { workspaceService } from "@/lib/services";
import {
  loadWorkspace as loadCachedWorkspace,
  saveWorkspace as saveCachedWorkspace,
  deleteWorkspace as deleteCachedWorkspace,
  getLastSessionId,
  listStoredWorkspaces,
  rememberSessionId,
} from "@/lib/storage/workspace-browser";

type WorkspaceSource = "server" | "localStorage" | "cache";

interface WorkspaceState {
  data: WorkspaceSnapshot | null;
  source: WorkspaceSource | null;
}

/**
 * Workspace management hook with intelligent polling
 * Handles workspace fetching, caching, session management, and sync
 */
export function useWorkspaceManagement(
  currentCompany: { id: string } | null,
  currentDashboard: { id: string; tiles: any[] } | null,
  isUpdatingDashboardRef: React.MutableRefObject<boolean>
) {
  // Polling state (refs to avoid re-renders)
  const pollingAttemptsRef = useRef(0);
  const lastPollingIntervalRef = useRef(2000);
  const generationInProgressRef = useRef(false);
  const tilesSyncedForSessionRef = useRef<string | null>(null);
  const cacheWarningShownRef = useRef(false);
  const userSelectedSessionRef = useRef<string | null>(null);

  // Local state
  const [localWorkspace, setLocalWorkspace] = useState<WorkspaceSnapshot | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
  const [storedWorkspaces, setStoredWorkspaces] = useState<
    Array<{ sessionId: string; snapshot: WorkspaceSnapshot }>
  >([]);

  // Generation state
  const [generationState, setGenerationState] = useState({
    isGenerating: false,
    sessionId: null as string | null,
    startedAt: null as number | null,
    tilesGenerated: 0,
    totalTiles: 0,
  });

  // SWR with intelligent polling
  const { data, error, isLoading, mutate } = useSWR<WorkspaceSnapshot>(
    "/api/workspace",
    () => workspaceService.fetchWorkspace(),
    {
      refreshInterval: (data) => {
        // Disable polling when generation is in progress
        if (generationInProgressRef.current) {
          return 0;
        }

        const hasTiles = data?.company?.tiles && data.company.tiles.length > 0;

        if (hasTiles) {
          // Sync tiles to dashboard if needed
          if (
            currentCompany &&
            currentDashboard &&
            currentDashboard.tiles.length === 0 &&
            tilesSyncedForSessionRef.current !== data.sessionId &&
            !isUpdatingDashboardRef.current
          ) {
            tilesSyncedForSessionRef.current = data.sessionId;
            // Dashboard update will be handled by parent
          }

          // Clear generation flags
          if (typeof window !== "undefined") {
            window.localStorage.removeItem("last-generation-time");
          }
          pollingAttemptsRef.current = 0;
          lastPollingIntervalRef.current = 2000;
          return 0; // Stop polling
        }

        // Check if should poll
        const generatedAt = data?.generatedAt;
        let shouldPoll = false;

        if (generatedAt) {
          const generatedTime = new Date(generatedAt).getTime();
          const now = Date.now();
          const fiveMinutesAgo = now - 5 * 60 * 1000;
          if (generatedTime > fiveMinutesAgo) {
            shouldPoll = true;
          }
        }

        // Check localStorage for recent generation
        if (!shouldPoll && typeof window !== "undefined") {
          const lastGenerationTime = window.localStorage.getItem("last-generation-time");
          if (lastGenerationTime) {
            const genTime = parseInt(lastGenerationTime, 10);
            const now = Date.now();
            const fiveMinutesAgo = now - 5 * 60 * 1000;
            if (genTime > fiveMinutesAgo) {
              shouldPoll = true;
            } else {
              window.localStorage.removeItem("last-generation-time");
            }
          }
        }

        if (shouldPoll) {
          // Exponential backoff: 2s → 3s → 4.5s → max 10s
          if (pollingAttemptsRef.current < 30) {
            const nextInterval = Math.min(
              Math.round(lastPollingIntervalRef.current * 1.5),
              10000
            );
            lastPollingIntervalRef.current = nextInterval;
            pollingAttemptsRef.current++;
            return nextInterval;
          } else {
            pollingAttemptsRef.current = 0;
            lastPollingIntervalRef.current = 2000;
            return 0;
          }
        }

        pollingAttemptsRef.current = 0;
        lastPollingIntervalRef.current = 2000;
        return 0;
      },
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
    }
  );

  // Refresh stored workspaces
  const refreshStoredWorkspaces = useCallback(() => {
    const entries = listStoredWorkspaces();
    setStoredWorkspaces(entries);
  }, []);

  // Load initial workspace from cache
  useEffect(() => {
    refreshStoredWorkspaces();
    const lastSession = getLastSessionId();

    if (!lastSession) {
      const stored = listStoredWorkspaces();
      if (stored.length > 0) {
        const firstWorkspace = stored[0];
        setSessionId(firstWorkspace.sessionId);
        setLocalWorkspace(firstWorkspace.snapshot);
        setViewingSessionId(firstWorkspace.sessionId);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("last-session-id", firstWorkspace.sessionId);
        }
        return;
      }
      mutate();
      return;
    }

    const cached = loadCachedWorkspace(lastSession);
    if (cached) {
      setSessionId(lastSession);
      setLocalWorkspace(cached);
      setViewingSessionId(lastSession);
      if (cached.company?.tiles && cached.company.tiles.length > 0) {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem("last-generation-time");
        }
      }
    } else {
      const stored = listStoredWorkspaces();
      if (stored.length > 0) {
        const firstWorkspace = stored[0];
        setSessionId(firstWorkspace.sessionId);
        setLocalWorkspace(firstWorkspace.snapshot);
        setViewingSessionId(firstWorkspace.sessionId);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("last-session-id", firstWorkspace.sessionId);
        }
        return;
      }
      mutate();
    }
  }, [refreshStoredWorkspaces, mutate]);

  // Sync server data to local state
  useEffect(() => {
    if (!data) return;

    const isNewSession = viewingSessionId && viewingSessionId !== data.sessionId;
    const isUserSelectedSession =
      userSelectedSessionRef.current !== null &&
      userSelectedSessionRef.current !== data.sessionId;
    const shouldPreserveLocal =
      viewingSessionId &&
      viewingSessionId !== data.sessionId &&
      (isUserSelectedSession || localWorkspace?.sessionId === viewingSessionId);

    if (isNewSession && !isUserSelectedSession && !shouldPreserveLocal) {
      if (viewingSessionId && typeof window !== "undefined") {
        const oldCached = loadCachedWorkspace(viewingSessionId);
        if (oldCached && (!oldCached.company?.tiles || oldCached.company.tiles.length === 0)) {
          deleteCachedWorkspace(viewingSessionId);
        }
      }
    }

    if (!shouldPreserveLocal) {
      setSessionId(data.sessionId);
      setLocalWorkspace(data);
      saveCachedWorkspace(data.sessionId, data);
    }

    refreshStoredWorkspaces();

    const hasTiles = data.company?.tiles && data.company.tiles.length > 0;
    if (hasTiles) {
      if (viewingSessionId !== data.sessionId && !isUserSelectedSession) {
        setViewingSessionId(data.sessionId);
        userSelectedSessionRef.current = null;
      }

      generationInProgressRef.current = false;
      setGenerationState((prev) => ({ ...prev, isGenerating: false }));

      if (typeof window !== "undefined") {
        window.localStorage.removeItem("last-generation-time");
      }
    } else {
      if ((viewingSessionId !== data.sessionId || isNewSession) && !isUserSelectedSession) {
        setViewingSessionId(data.sessionId);
        userSelectedSessionRef.current = null;
      }
    }

    cacheWarningShownRef.current = false;
  }, [data, refreshStoredWorkspaces, viewingSessionId, localWorkspace]);

  // Workspace state with source tracking
  const workspaceState = useMemo<WorkspaceState>(() => {
    if (viewingSessionId) {
      if (data && data.sessionId === viewingSessionId) {
        return { data, source: "server" };
      }
      if (localWorkspace && localWorkspace.sessionId === viewingSessionId) {
        return { data: localWorkspace, source: "localStorage" };
      }
      const stored = storedWorkspaces.find((entry) => entry.sessionId === viewingSessionId);
      if (stored) {
        return { data: stored.snapshot, source: "cache" };
      }
    }
    return { data: data || localWorkspace || null, source: data ? "server" : "localStorage" };
  }, [data, localWorkspace, viewingSessionId, storedWorkspaces]);

  // Select workspace
  const selectWorkspace = useCallback((newSessionId: string) => {
    userSelectedSessionRef.current = newSessionId;
    setViewingSessionId(newSessionId);
    const cached = loadCachedWorkspace(newSessionId);
    if (cached) {
      setLocalWorkspace(cached);
    }
    rememberSessionId(newSessionId);
  }, []);

  // Delete workspace
  const deleteWorkspace = useCallback((sessionIdToDelete: string) => {
    deleteCachedWorkspace(sessionIdToDelete);
    refreshStoredWorkspaces();
    
    if (viewingSessionId === sessionIdToDelete) {
      const remaining = listStoredWorkspaces();
      if (remaining.length > 0) {
        selectWorkspace(remaining[0].sessionId);
      } else {
        setViewingSessionId(null);
        setLocalWorkspace(null);
      }
    }
  }, [viewingSessionId, refreshStoredWorkspaces, selectWorkspace]);

  return {
    // State
    workspace: workspaceState.data,
    workspaceSource: workspaceState.source,
    isLoading,
    error,
    sessionId,
    viewingSessionId,
    storedWorkspaces,
    generationState,
    
    // Actions
    selectWorkspace,
    deleteWorkspace,
    refreshWorkspace: mutate,
    refreshStoredWorkspaces,
    
    // Refs (for parent to use)
    generationInProgressRef,
    tilesSyncedForSessionRef,
    
    // Direct setters (for advanced use cases)
    setLocalWorkspace,
    setGenerationState,
  };
}
