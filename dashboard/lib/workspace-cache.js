// ⭐ FASE 1: Cache em memória para workspace
const workspaceCache = new Map();
const CACHE_TTL_MS = 1000; // 1 segundo (alinhado com polling de 3s)
const MAX_CACHE_SIZE = 1000;

/**
 * Invalida cache do workspace
 * @param {string} guestId - ID do guest
 * @param {string} jobId - ID do job (opcional)
 */
export function invalidateWorkspaceCache(guestId, jobId = null) {
  if (jobId) {
    const key = `${guestId}:${jobId}`;
    workspaceCache.delete(key);
    console.log(`[Workspace Cache] 🗑️ Cache invalidado para ${key}`);
  } else {
    // Invalidar todas as entradas deste guest
    const keysToDelete = [];
    for (const key of workspaceCache.keys()) {
      if (key.startsWith(`${guestId}:`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach((key) => workspaceCache.delete(key));
    console.log(
      `[Workspace Cache] 🗑️ Cache invalidado para guest ${guestId} (${keysToDelete.length} entradas)`
    );
  }
}

/**
 * Limpa entradas antigas do cache (LRU)
 */
function cleanupCache() {
  if (workspaceCache.size <= MAX_CACHE_SIZE) return;

  const entries = Array.from(workspaceCache.entries());
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);

  const toDelete = entries.slice(0, entries.length - MAX_CACHE_SIZE);
  toDelete.forEach(([key]) => workspaceCache.delete(key));

  console.log(
    `[Workspace Cache] 🧹 Limpeza LRU: ${toDelete.length} entradas removidas`
  );
}

/**
 * Obtém cache do workspace
 * @param {string} guestId - ID do guest
 * @param {string} jobId - ID do job (opcional)
 * @returns {object|null} Cache entry ou null
 */
export function getWorkspaceCache(guestId, jobId = null) {
  const cacheKey = `${guestId}:${jobId || "default"}`;
  const cached = workspaceCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached;
  }

  return null;
}

/**
 * Define cache do workspace
 * @param {string} guestId - ID do guest
 * @param {string} jobId - ID do job (opcional)
 * @param {object} data - Dados para cachear
 * @param {string} etag - ETag do response
 */
export function setWorkspaceCache(guestId, jobId, data, etag) {
  const cacheKey = `${guestId}:${jobId || "default"}`;
  workspaceCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    etag,
  });

  // Limpar cache antigo se necessário
  cleanupCache();
}
