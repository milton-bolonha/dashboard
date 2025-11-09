export const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";

function safeNumber(source: string | undefined, fallback: number): number {
  const parsed = Number(source);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export const DEFAULT_MAX_OUTPUT_TOKENS = safeNumber(
  process.env.OPENAI_MAX_OUTPUT_TOKENS,
  600
);

export const DEFAULT_TEMPERATURE = (() => {
  const parsed = Number(process.env.OPENAI_TEMPERATURE);
  return Number.isFinite(parsed) ? parsed : 0.7;
})();

export function resolveModel(preferred?: string | null): string {
  if (!preferred) return DEFAULT_MODEL;
  const candidate = preferred.trim();
  return candidate.length > 0 ? candidate : DEFAULT_MODEL;
}

