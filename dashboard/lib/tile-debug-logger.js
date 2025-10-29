/**
 * Logger específico para debug de tiles e loading states
 * Rastreia todo o ciclo de vida: loading → generation → display
 */

const TILE_DEBUG_PREFIX = "🎯 [TILE DEBUG]";

export class TileDebugLogger {
  constructor(guestId, themeId) {
    this.guestId = guestId;
    this.themeId = themeId;
    this.startTime = Date.now();
  }

  // ===== LANDING PAGE =====
  landingFormSubmit(context) {
    console.log(`${TILE_DEBUG_PREFIX} LANDING: Form submitted`, {
      guestId: this.guestId,
      themeId: this.themeId,
      context: Object.keys(context),
      timestamp: new Date().toISOString(),
    });
  }

  landingPreloadTriggered() {
    console.log(
      `${TILE_DEBUG_PREFIX} LANDING: Preload triggered (non-blocking)`,
      {
        guestId: this.guestId,
        timestamp: new Date().toISOString(),
      }
    );
  }

  landingRedirect() {
    console.log(`${TILE_DEBUG_PREFIX} LANDING: Redirecting to /admin`, {
      guestId: this.guestId,
      elapsed: Date.now() - this.startTime + "ms",
    });
  }

  // ===== WORKSPACE CREATION =====
  workspaceCreated(workspaceId) {
    console.log(`${TILE_DEBUG_PREFIX} WORKSPACE: Created successfully`, {
      guestId: this.guestId,
      workspaceId,
      themeId: this.themeId,
      timestamp: new Date().toISOString(),
    });
  }

  workspaceDynamicDataCreated(dynamicData) {
    console.log(`${TILE_DEBUG_PREFIX} WORKSPACE: Dynamic data created`, {
      guestId: this.guestId,
      entities: Object.keys(dynamicData),
      entityCounts: Object.entries(dynamicData).map(
        ([key, arr]) => `${key}: ${arr.length}`
      ),
      timestamp: new Date().toISOString(),
    });
  }

  // ===== TILE GENERATION =====
  tileGenerationStarted(expectedCount) {
    console.log(`${TILE_DEBUG_PREFIX} GENERATION: Started`, {
      guestId: this.guestId,
      expectedTiles: expectedCount,
      timestamp: new Date().toISOString(),
    });
  }

  tileGenerationStatus(status) {
    console.log(`${TILE_DEBUG_PREFIX} GENERATION: Status changed`, {
      guestId: this.guestId,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  tileProcessing(templateId, templateTitle, prompt) {
    console.log(`${TILE_DEBUG_PREFIX} GENERATION: Processing tile`, {
      guestId: this.guestId,
      templateId,
      templateTitle,
      promptLength: prompt.length,
      timestamp: new Date().toISOString(),
    });
  }

  tileGenerated(templateId, tileId, duration) {
    console.log(`${TILE_DEBUG_PREFIX} GENERATION: Tile completed`, {
      guestId: this.guestId,
      templateId,
      tileId,
      duration: duration + "ms",
      timestamp: new Date().toISOString(),
    });
  }

  tileGenerationCompleted(totalTiles, totalDuration) {
    console.log(`${TILE_DEBUG_PREFIX} GENERATION: All tiles completed`, {
      guestId: this.guestId,
      totalTiles,
      totalDuration: totalDuration + "ms",
      averagePerTile: Math.round(totalDuration / totalTiles) + "ms",
      timestamp: new Date().toISOString(),
    });
  }

  // ===== PRELOAD SYSTEM =====
  preloadStarted(tilesCount) {
    console.log(`${TILE_DEBUG_PREFIX} PRELOAD: Started`, {
      guestId: this.guestId,
      tilesCount,
      timestamp: new Date().toISOString(),
    });
  }

  preloadTileGenerated(tileTitle, duration) {
    console.log(`${TILE_DEBUG_PREFIX} PRELOAD: Tile generated`, {
      guestId: this.guestId,
      tileTitle,
      duration: duration + "ms",
      timestamp: new Date().toISOString(),
    });
  }

  preloadCompleted(tilesCount, totalDuration) {
    console.log(`${TILE_DEBUG_PREFIX} PRELOAD: Completed`, {
      guestId: this.guestId,
      tilesCount,
      totalDuration: totalDuration + "ms",
      timestamp: new Date().toISOString(),
    });
  }

  // ===== ADMIN DASHBOARD =====
  adminPageLoad() {
    console.log(`${TILE_DEBUG_PREFIX} ADMIN: Page loaded`, {
      guestId: this.guestId,
      timestamp: new Date().toISOString(),
    });
  }

  adminWorkspaceLoaded(workspace) {
    console.log(`${TILE_DEBUG_PREFIX} ADMIN: Workspace loaded`, {
      guestId: this.guestId,
      workspaceName: workspace.name,
      themeId: workspace.themeSnapshot?.id,
      tilesStatus: workspace.tiles_status,
      timestamp: new Date().toISOString(),
    });
  }

  adminTilesDetected(tilesCount, entityKey) {
    console.log(`${TILE_DEBUG_PREFIX} ADMIN: Tiles detected`, {
      guestId: this.guestId,
      tilesCount,
      entityKey,
      timestamp: new Date().toISOString(),
    });
  }

  adminLoadingStateChanged(showLoading, generatingTiles, reason) {
    console.log(`${TILE_DEBUG_PREFIX} ADMIN: Loading state changed`, {
      guestId: this.guestId,
      showLoading,
      generatingTiles,
      reason,
      timestamp: new Date().toISOString(),
    });
  }

  adminPollingStarted(interval) {
    console.log(`${TILE_DEBUG_PREFIX} ADMIN: Polling started`, {
      guestId: this.guestId,
      interval: interval + "ms",
      timestamp: new Date().toISOString(),
    });
  }

  adminPollingTick(tickNumber, tilesCount, status) {
    console.log(`${TILE_DEBUG_PREFIX} ADMIN: Polling tick #${tickNumber}`, {
      guestId: this.guestId,
      tilesCount,
      status,
      timestamp: new Date().toISOString(),
    });
  }

  adminPollingStopped(reason, totalTicks) {
    console.log(`${TILE_DEBUG_PREFIX} ADMIN: Polling stopped`, {
      guestId: this.guestId,
      reason,
      totalTicks,
      timestamp: new Date().toISOString(),
    });
  }

  adminTilesUpdated(previousCount, newCount, newTiles) {
    console.log(`${TILE_DEBUG_PREFIX} ADMIN: Tiles updated`, {
      guestId: this.guestId,
      previousCount,
      newCount,
      newTilesCount: newCount - previousCount,
      newTiles: newTiles.map((t) => ({ id: t.id, title: t.title })),
      timestamp: new Date().toISOString(),
    });
  }

  // ===== CUSTOM TILES =====
  customTileRequested(companyName, prompt) {
    console.log(`${TILE_DEBUG_PREFIX} CUSTOM: Tile requested`, {
      guestId: this.guestId,
      companyName,
      promptLength: prompt.length,
      timestamp: new Date().toISOString(),
    });
  }

  customTileGenerated(tileId, duration) {
    console.log(`${TILE_DEBUG_PREFIX} CUSTOM: Tile generated`, {
      guestId: this.guestId,
      tileId,
      duration: duration + "ms",
      timestamp: new Date().toISOString(),
    });
  }

  // ===== ERROR HANDLING =====
  error(phase, error, context = {}) {
    console.error(`${TILE_DEBUG_PREFIX} ERROR: ${phase}`, {
      guestId: this.guestId,
      error: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  // ===== UTILITY =====
  getElapsed() {
    return Date.now() - this.startTime;
  }

  summary() {
    console.log(`${TILE_DEBUG_PREFIX} SUMMARY: Complete tile lifecycle`, {
      guestId: this.guestId,
      themeId: this.themeId,
      totalElapsed: this.getElapsed() + "ms",
      timestamp: new Date().toISOString(),
    });
  }
}

// Factory function para criar logger
export function createTileDebugLogger(guestId, themeId) {
  return new TileDebugLogger(guestId, themeId);
}

// Helper para debug de estados
export function debugTileStates(guestId, states) {
  console.log(`${TILE_DEBUG_PREFIX} STATE DEBUG:`, {
    guestId,
    ...states,
    timestamp: new Date().toISOString(),
  });
}
