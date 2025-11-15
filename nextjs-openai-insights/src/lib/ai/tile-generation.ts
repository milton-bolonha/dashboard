import OpenAI from "openai";

import { clampTiles } from "@/lib/cookies-store";
import {
  DEFAULT_MAX_OUTPUT_TOKENS,
  DEFAULT_TEMPERATURE,
  resolveModel,
} from "@/lib/ai/settings";
import type { TileMessage } from "@/lib/types";

const MAX_GENERATION_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 300;

type GenerateTileRole = TileMessage["role"];

type NullableRecord = Record<string, unknown> | null | undefined;

interface TileGenerationBaseOptions {
  prompt: string;
  title: string;
  templateId: string;
  templateTileId?: string;
  category?: string;
  model: string;
  orderIndex: number;
  maxTokens?: number;
}

export interface TileGenerationOptions extends TileGenerationBaseOptions {
  client?: OpenAI;
}

export interface TileGenerationResult {
  content: string;
  prompt: string;
  totalTokens: number | null;
  attempts: number;
  createdAt: string;
  updatedAt: string;
  history: TileMessage[];
  model: string;
}

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function coerceToText(value: unknown): string {
  if (value === null || typeof value === "undefined") return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (Array.isArray(value)) {
    return value.map(coerceToText).filter(Boolean).join("");
  }
  if (isObject(value)) {
    if ("output_text" in value) return coerceToText(value.output_text);
    if ("text" in value) return coerceToText(value.text);
    if ("content" in value) return coerceToText(value.content);
    if ("value" in value) return coerceToText(value.value);
    if ("parts" in value) return coerceToText(value.parts);
    if ("messages" in value) return coerceToText(value.messages);
  }
  return "";
}

function buildResponsesInput(prompt: string) {
  // Get language instruction from env var or default to English
  const responseLanguage = process.env.NEXT_PUBLIC_AI_RESPONSE_LANGUAGE || "English";
  const languageInstruction = `\n\nIMPORTANT: Respond ONLY in ${responseLanguage}. Do not use any other language.`;
  
  return [
    {
      role: "user" as const,
      content: [
        {
          type: "input_text" as const,
          text: prompt + languageInstruction,
        },
      ],
    },
  ];
}

function createHistoryEntry(
  role: GenerateTileRole,
  content: string,
  createdAt: string
): TileMessage {
  return {
    id: `${role}_${Date.now().toString(36)}`,
    role,
    content,
    createdAt,
  };
}

function extractResponseContent(response: NullableRecord) {
  const fromOutput = coerceToText(response?.output_text);
  if (fromOutput.trim()) {
    return fromOutput.trim();
  }

  if (Array.isArray(response?.output)) {
    const aggregated = (response?.output as unknown[])
      .map((item) => coerceToText(item))
      .filter(Boolean)
      .join("\n")
      .trim();
    if (aggregated) {
      return aggregated;
    }
  }

  return "";
}

async function runGenerationAttempt({
  client,
  prompt,
  title,
  orderIndex,
  model,
  maxTokens,
  templateId,
  templateTileId,
}: TileGenerationBaseOptions & { client: OpenAI }) {
  const normalizedModel = resolveModel(model).trim();
  const lowerModel = normalizedModel.toLowerCase();
  const shouldSendTemperature =
    !lowerModel.startsWith("gpt-5") && Number.isFinite(DEFAULT_TEMPERATURE);

  const requestPayload: Record<string, unknown> = {
    model: normalizedModel,
    input: buildResponsesInput(prompt),
    max_output_tokens: maxTokens ?? DEFAULT_MAX_OUTPUT_TOKENS,
    metadata: {
      templateId,
      templateTileId: templateTileId ?? "unknown",
      orderIndex: String(orderIndex),
      title,
    },
    tools: [],
    store: false,
    include: ["reasoning.encrypted_content", "web_search_call.action.sources"],
    reasoning: {
      effort: "minimal",
    },
    text: {
      format: { type: "text" },
      verbosity: "low",
    },
  };

  if (shouldSendTemperature && Number.isFinite(DEFAULT_TEMPERATURE)) {
    requestPayload.temperature = DEFAULT_TEMPERATURE;
  }

  const completion = (await client.responses.create(
    requestPayload as Record<string, unknown>
  )) as unknown as NullableRecord;

  const content = extractResponseContent(completion);
  const usage = completion?.usage as NullableRecord;

  return {
    content,
    usage,
  };
}

function summarizeUsage(usage: NullableRecord): number | null {
  if (!usage || !isObject(usage)) return null;
  const totalTokens = usage.total_tokens ?? usage.total_token_count;
  if (typeof totalTokens === "number") {
    return totalTokens;
  }
  if (typeof totalTokens === "string") {
    const parsed = Number.parseInt(totalTokens, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function buildResult({
  prompt,
  content,
  totalTokens,
  attempts,
  timestamp,
  model,
}: {
  prompt: string;
  content: string;
  totalTokens: number | null;
  attempts: number;
  timestamp: string;
  model: string;
}): TileGenerationResult {
  const trimmedContent = clampTiles(content);
  const promptEntry = createHistoryEntry("user", prompt, timestamp);
  const assistantEntry = createHistoryEntry(
    "assistant",
    trimmedContent,
    timestamp
  );

  return {
    content: trimmedContent,
    prompt,
    totalTokens,
    attempts,
    createdAt: timestamp,
    updatedAt: timestamp,
    history: [promptEntry, assistantEntry],
    model: resolveModel(model),
  };
}

function buildFallbackContent(
  options: TileGenerationBaseOptions,
  reason?: string | null
): TileGenerationResult {
  const timestamp = new Date().toISOString();
  const fallback =
    "⚠️ This insight could not be generated right now. Try refreshing this tile in a few moments.";
  const decorated =
    reason && reason !== "empty_response"
      ? `${fallback}\n\nDetails: ${reason}`
      : fallback;
  return buildResult({
    prompt: options.prompt,
    content: decorated,
    totalTokens: null,
    attempts: MAX_GENERATION_ATTEMPTS,
    timestamp,
    model: options.model,
  });
}

export function generateMockTileContent(
  options: TileGenerationBaseOptions
): TileGenerationResult {
  const timestamp = new Date().toISOString();
  const description = `Mock insight for "${options.title}" about "${options.templateId}" generated at ${timestamp}.`;
  return buildResult({
    prompt: options.prompt,
    content: description,
    totalTokens: null,
    attempts: 1,
    timestamp,
    model: options.model,
  });
}

export function generateFallbackTileContent(
  options: TileGenerationBaseOptions,
  reason?: string | null
): TileGenerationResult {
  return buildFallbackContent(options, reason);
}

export async function generateTileContent(
  options: TileGenerationOptions
): Promise<TileGenerationResult> {
  const { prompt, model } = options;
  if (!prompt.trim()) {
    return buildFallbackContent(options, "Missing prompt");
  }

  const timestamp = new Date().toISOString();
  let client = options.client;
  if (!client) {
    if (!process.env.OPENAI_API_KEY) {
      return buildFallbackContent(options, "OPENAI_API_KEY is not configured");
    }
    client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < MAX_GENERATION_ATTEMPTS) {
    attempt += 1;
    try {
      const result = await runGenerationAttempt({
        client,
        prompt: options.prompt,
        title: options.title,
        orderIndex: options.orderIndex,
        model,
        maxTokens: options.maxTokens,
        templateId: options.templateId,
        templateTileId: options.templateTileId,
        category: options.category,
      });

      const content = result.content?.trim();
      if (!content) {
        throw new Error("empty_response");
      }

      const totalTokens = summarizeUsage(result.usage);
      return buildResult({
        prompt: options.prompt,
        content,
        totalTokens,
        attempts: attempt,
        timestamp,
        model,
      });
    } catch (error) {
      lastError = error;
      if (attempt >= MAX_GENERATION_ATTEMPTS) {
        break;
      }
      const backoff = Math.pow(2, attempt) * RETRY_BASE_DELAY_MS;
      await delay(backoff);
    }
  }

  const reason =
    lastError instanceof Error ? lastError.message : String(lastError ?? "");
  return buildFallbackContent(options, reason || null);
}
