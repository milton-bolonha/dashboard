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

  const abortControllerRef = useRef<AbortController | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader | null>(null);

  const stopStreaming = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.cancel();
      readerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const startStreaming = useCallback(async () => {
    if (isStreaming || isCompleted) return;

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

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      const response = await fetch('/api/generate/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Check if response is a readable stream
      if (!response.body) {
        throw new Error('Response body is not a readable stream');
      }

      // Get the reader from the response stream
      const reader = response.body.getReader();
      readerRef.current = reader;

      const decoder = new TextDecoder();
      let buffer = '';

      console.log('[useTileStreaming] 🔗 Connected to stream, reading events...');

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          console.log('[useTileStreaming] 📡 Stream ended');
          break;
        }

        // Decode the chunk and add to buffer
        buffer += decoder.decode(value, { stream: true });

        // Process complete lines (SSE format: "data: {...}\n\n")
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = line.slice(6); // Remove 'data: ' prefix
              if (data.trim()) {
                const streamingEvent: StreamingEvent = JSON.parse(data);

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
                      return; // Exit the loop
                    }
                    break;

                  case 'error':
                    console.error('[useTileStreaming] ❌ Stream error:', streamingEvent.error);
                    setError(streamingEvent.error || 'Unknown streaming error');
                    setIsStreaming(false);
                    onError?.(streamingEvent.error || 'Unknown streaming error');
                    return; // Exit the loop
                }
              }
            } catch (parseError) {
              console.error('[useTileStreaming] ❌ Parse error:', parseError, 'Line:', line);
              setError('Failed to parse streaming data');
              setIsStreaming(false);
              onError?.('Failed to parse streaming data');
              return; // Exit the loop
            }
          }
        }
      }

      // If we reach here, stream ended without completion
      console.log('[useTileStreaming] 📡 Stream ended without completion event');
      setIsCompleted(true);
      setIsStreaming(false);

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('[useTileStreaming] 🛑 Streaming aborted');
        return;
      }

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

