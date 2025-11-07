const ALLOWED_GENERATION_MODES = ["individual", "batch"];
const DEFAULT_GENERATION_MODE = (
  process.env.DECK_ENGINE_GENERATION_MODE ||
  process.env.DECK_GENERATION_MODE ||
  "individual"
).toLowerCase();
const DEFAULT_BATCH_CONCURRENCY = Math.max(
  1,
  parseInt(process.env.DECK_ENGINE_BATCH_CONCURRENCY || "3", 10)
);

function normalizeMode(mode) {
  if (!mode || typeof mode !== "string") {
    return null;
  }
  const normalized = mode.trim().toLowerCase();
  return ALLOWED_GENERATION_MODES.includes(normalized) ? normalized : null;
}

export function getDeckGenerationConfig() {
  const normalizedDefault =
    normalizeMode(DEFAULT_GENERATION_MODE) || "individual";
  return {
    allowedModes: [...ALLOWED_GENERATION_MODES],
    defaultMode: normalizedDefault,
    batchConcurrency: DEFAULT_BATCH_CONCURRENCY,
  };
}

export function resolveGenerationMode(candidate) {
  const { defaultMode } = getDeckGenerationConfig();
  const normalized = normalizeMode(candidate);
  if (!normalized) {
    if (candidate && typeof candidate === "string") {
      console.warn(
        `[DeckEngine][Config] ⚠️ generationMode "${candidate}" inválido. Usando default "${defaultMode}".`
      );
    }
    return defaultMode;
  }
  return normalized;
}
