/**
 * 🔍 Sistema de Logging Estruturado para Pipeline de AI
 *
 * Rastreia todos os eventos do pipeline de onboarding e geração de tiles
 * com métricas de tempo e payloads estruturados
 */

import { db } from "./db";

// Tipos de eventos do pipeline
export const PIPELINE_EVENTS = {
  // Onboarding
  FORM_SUBMITTED: "form_submitted",
  WORKSPACE_CREATED: "workspace_created",

  // Geração de tiles
  TILES_GENERATION_STARTED: "tiles_generation_started",
  TILES_GENERATION_COMPLETED: "tiles_generation_completed",
  TILES_GENERATION_FAILED: "tiles_generation_failed",

  // Tile individual
  TILE_STARTED: "tile_started",
  TILE_STREAMING: "tile_streaming",
  TILE_COMPLETED: "tile_completed",
  TILE_FAILED: "tile_failed",

  // Cache
  CACHE_HIT: "cache_hit",
  CACHE_MISS: "cache_miss",
};

/**
 * Loga um evento do pipeline
 */
export async function logPipelineEvent({
  eventType,
  guestId = null,
  userId = null,
  companyName = null,
  payload = {},
  previousEventTimestamp = null,
}) {
  try {
    const now = new Date();

    // Calcular duração desde último evento
    let durationFromPrevious = null;
    if (previousEventTimestamp) {
      durationFromPrevious = now - previousEventTimestamp;
    }

    const logEntry = {
      event_type: eventType,
      guest_id: guestId,
      user_id: userId,
      company_name: companyName,
      timestamp: now,
      duration_from_previous_ms: durationFromPrevious,
      payload,
      created_at: now,
    };

    await db.insertOne("pipeline_logs", logEntry);

    // Log para console também
    const durationStr =
      durationFromPrevious !== null ? ` (+${durationFromPrevious}ms)` : "";
    console.log(`📊 [PIPELINE LOG] ${eventType}${durationStr}`, payload);

    return logEntry;
  } catch (error) {
    console.error("❌ Erro ao logar evento do pipeline:", error);
    // Não quebrar o fluxo se logging falhar
    return null;
  }
}

/**
 * Busca métricas do pipeline para uma company
 */
export async function getPipelineMetrics(companyName, limit = 100) {
  try {
    const logs = await db.find(
      "pipeline_logs",
      { company_name: companyName },
      {
        sort: { created_at: -1 },
        limit,
      }
    );

    return logs;
  } catch (error) {
    console.error("❌ Erro ao buscar métricas do pipeline:", error);
    return [];
  }
}

/**
 * Calcula estatísticas agregadas do pipeline
 */
export async function getPipelineStats(companyName = null) {
  try {
    const match = companyName ? { company_name: companyName } : {};

    const stats = await db.aggregate("pipeline_logs", [
      { $match: match },
      {
        $group: {
          _id: "$event_type",
          count: { $sum: 1 },
          avgDuration: { $avg: "$duration_from_previous_ms" },
          totalDuration: { $sum: "$duration_from_previous_ms" },
        },
      },
    ]);

    return stats;
  } catch (error) {
    console.error("❌ Erro ao calcular estatísticas do pipeline:", error);
    return [];
  }
}

/**
 * Busca eventos de um tipo específico
 */
export async function getEventsByType(eventType, limit = 50) {
  try {
    const logs = await db.find(
      "pipeline_logs",
      { event_type: eventType },
      {
        sort: { created_at: -1 },
        limit,
      }
    );

    return logs;
  } catch (error) {
    console.error("❌ Erro ao buscar eventos por tipo:", error);
    return [];
  }
}

/**
 * Constrói contexto de logging para uma company
 */
export function createPipelineContext({ guestId, userId, companyName }) {
  let lastEventTimestamp = null;

  // Função logEvent definida separadamente para evitar problemas com 'this'
  const logEvent = async (eventType, payload = {}) => {
    const logEntry = await logPipelineEvent({
      eventType,
      guestId,
      userId,
      companyName,
      payload,
      previousEventTimestamp: lastEventTimestamp,
    });

    if (logEntry) {
      lastEventTimestamp = logEntry.timestamp;
    }

    return logEntry;
  };

  return {
    // Logar evento e rastrear tempo
    logEvent,

    // Helpers específicos
    logFormSubmitted: async (context) => {
      return logEvent(PIPELINE_EVENTS.FORM_SUBMITTED, { context });
    },

    logWorkspaceCreated: async (workspaceData) => {
      return logEvent(PIPELINE_EVENTS.WORKSPACE_CREATED, { workspaceData });
    },

    logTilesGenerationStarted: async (templateId, tilesCount) => {
      return logEvent(PIPELINE_EVENTS.TILES_GENERATION_STARTED, {
        templateId,
        tilesCount,
      });
    },

    logTileStarted: async (tileId, tileTitle) => {
      return logEvent(PIPELINE_EVENTS.TILE_STARTED, {
        tileId,
        tileTitle,
      });
    },

    logTileCompleted: async (tileId, metrics) => {
      return logEvent(PIPELINE_EVENTS.TILE_COMPLETED, {
        tileId,
        metrics,
      });
    },

    logTilesGenerationCompleted: async (tilesCount, totalDuration) => {
      return logEvent(PIPELINE_EVENTS.TILES_GENERATION_COMPLETED, {
        tilesCount,
        totalDuration,
      });
    },

    logCacheHit: async (tileId) => {
      return logEvent(PIPELINE_EVENTS.CACHE_HIT, { tileId });
    },

    logCacheMiss: async (tileId) => {
      return logEvent(PIPELINE_EVENTS.CACHE_MISS, { tileId });
    },
  };
}
