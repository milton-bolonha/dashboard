import { useEffect, useRef, useState, useCallback } from 'react';
import type { Tile, WorkspaceSnapshot } from '@/lib/types';

interface StreamingEvent {
  type: 'connected' | 'tile_generated' | 'completed' | 'error';
  tile?: Tile;
  tileIndex?: number;
  completedTiles?: number;
  totalTiles?: number;
  sessionId?: string;
  workspace?: WorkspaceSnapshot;
  error?: string;
  timestamp: string;
}

interface UseTileStreamingOptions {
  salesRepCompany: string;
  salesRepWebsite: string;
  solution: string;
  targetCompany: string;
  targetWebsite: string;
  templateId?: string;
  model?: string;
  promptAgent?: string;
  responseLength?: 'short' | 'medium' | 'long';
  promptVariables?: string[];
  bulkPrompts?: string[];
  onTileGenerated?: (tile: Tile, index: number) => void;
  onCompleted?: (workspace: WorkspaceSnapshot, sessionId: string) => void;
  onError?: (error: string) => void;
}

interface UseTileStreamingReturn {
  tiles: Tile[];
  isStreaming: boolean;
  isCompleted: boolean;
  error: string | null;
  totalTiles: number;
  completedTiles: number;
  startStreaming: () => void;
  stopStreaming: () => void;
}

export function useTileStreaming(options: UseTileStreamingOptions): UseTileStreamingReturn {
  const {
    salesRepCompany,
    salesRepWebsite,
    solution,
    targetCompany,
    targetWebsite,
    templateId,
    model,
    promptAgent,
    responseLength,
    promptVariables,
    bulkPrompts,
    onTileGenerated,
    onCompleted,
    onError,
  } = options;

  const [tiles, setTiles] = useState<Tile[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalTiles, setTotalTiles] = useState(0);
  const [completedTiles, setCompletedTiles] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const stopStreaming = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const startStreaming = useCallback(async () => {
    if (isStreaming) return;

    // Reset state
    setTiles([]);
    setIsCompleted(false);
    setError(null);
    setTotalTiles(0);
    setCompletedTiles(0);

    // Stop any existing connection
    stopStreaming();

    setIsStreaming(true);

    try {
      const payload = {
        salesRepCompany,
        salesRepWebsite,
        solution,
        targetCompany,
        targetWebsite,
        templateId,
        model,
        promptAgent,
        responseLength,
        promptVariables,
        bulkPrompts,
      };

      const response = await fetch('/api/generate/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Handle Server-Sent Events
      const eventSource = new EventSource('/api/generate/stream');

      eventSource.onmessage = (event) => {
        try {
          const streamingEvent: StreamingEvent = JSON.parse(event.data);

          switch (streamingEvent.type) {
            case 'connected':
              console.log('[useTileStreaming] 🔗 Connected, expecting', streamingEvent.totalTiles, 'tiles');
              setTotalTiles(streamingEvent.totalTiles || 0);
              break;

            case 'tile_generated':
              if (streamingEvent.tile && streamingEvent.tileIndex !== undefined) {
                console.log('[useTileStreaming] 🆕 Tile generated:', streamingEvent.tile.title, `(${streamingEvent.completedTiles}/${streamingEvent.totalTiles})`);

                setTiles(prevTiles => {
                  const newTiles = [...prevTiles];
                  newTiles[streamingEvent.tileIndex!] = streamingEvent.tile!;
                  return newTiles;
                });

                setCompletedTiles(streamingEvent.completedTiles || 0);
                onTileGenerated?.(streamingEvent.tile, streamingEvent.tileIndex);
              }
              break;

            case 'completed':
              if (streamingEvent.workspace && streamingEvent.sessionId) {
                console.log('[useTileStreaming] ✅ Generation completed');
                setIsCompleted(true);
                setIsStreaming(false);
                onCompleted?.(streamingEvent.workspace, streamingEvent.sessionId);
              }
              eventSource.close();
              break;

            case 'error':
              console.error('[useTileStreaming] ❌ Stream error:', streamingEvent.error);
              setError(streamingEvent.error || 'Unknown streaming error');
              setIsStreaming(false);
              onError?.(streamingEvent.error || 'Unknown streaming error');
              eventSource.close();
              break;
          }
        } catch (parseError) {
          console.error('[useTileStreaming] ❌ Parse error:', parseError);
          setError('Failed to parse streaming data');
          setIsStreaming(false);
          onError?.('Failed to parse streaming data');
          eventSource.close();
        }
      };

      eventSource.onerror = (event) => {
        console.error('[useTileStreaming] ❌ EventSource error:', event);
        setError('Connection lost');
        setIsStreaming(false);
        onError?.('Connection lost');
      };

      eventSourceRef.current = eventSource;

    } catch (error) {
      console.error('[useTileStreaming] ❌ Setup error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to start streaming';
      setError(errorMessage);
      setIsStreaming(false);
      onError?.(errorMessage);
    }
  }, [
    salesRepCompany,
    salesRepWebsite,
    solution,
    targetCompany,
    targetWebsite,
    templateId,
    model,
    promptAgent,
    responseLength,
    promptVariables,
    bulkPrompts,
    isStreaming,
    stopStreaming,
    onTileGenerated,
    onCompleted,
    onError,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  return {
    tiles,
    isStreaming,
    isCompleted,
    error,
    totalTiles,
    completedTiles,
    startStreaming,
    stopStreaming,
  };
}

