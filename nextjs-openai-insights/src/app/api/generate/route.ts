import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import OpenAI from "openai";

import { clampTiles, writeWorkspace } from "@/lib/cookies-store";
import {
  getGuestTemplate,
  processPromptVariables,
} from "@/lib/guest-templates";
import type { Tile, TileMessage, WorkspaceSnapshot } from "@/lib/types";
import {
  DEFAULT_MAX_OUTPUT_TOKENS,
  DEFAULT_TEMPERATURE,
  resolveModel,
} from "@/lib/ai/settings";

const requestSchema = z.object({
  salesRepCompany: z.string().min(2),
  salesRepWebsite: z.string().url(),
  solution: z.string().min(2),
  targetCompany: z.string().min(2),
  targetWebsite: z.string().url(),
  templateId: z.string().min(2).optional(),
  model: z.string().min(2).optional(),
});

const MAX_TOKENS = DEFAULT_MAX_OUTPUT_TOKENS;
const TEMPERATURE = DEFAULT_TEMPERATURE;

// Reduce tokens for tiles that often hit limits
function getMaxTokensForTile(templateTileId: string | undefined): number {
  const problemTiles = [
    "business_goals_2025",
    "biggest_goal_2025",
    "business_challenges",
    "industry_challenges",
    "solution_need",
    "solution_need_2",
    "ceo_info",
    "ceo_info_2",
    "sales_email",
    "cold_call_scripts",
  ];

  if (templateTileId && problemTiles.includes(templateTileId)) {
    return 400; // Reduced from 600 to avoid incomplete responses
  }

  return MAX_TOKENS;
}

function normalizeContext(raw: {
  salesRepCompany: string;
  salesRepWebsite: string;
  solution: string;
  targetCompany: string;
  targetWebsite: string;
}) {
  const salesRepCompany = raw.salesRepCompany.trim();
  const targetCompany = raw.targetCompany.trim();
  const solution = raw.solution.trim();

  return {
    salesRepAt: salesRepCompany,
    salesRepCompany,
    salesRepCompanyWebsite: raw.salesRepWebsite.trim(),
    sellingSolutionsFor: solution,
    target: targetCompany,
    targetWebsite: raw.targetWebsite.trim(),
    company: {
      name: targetCompany,
      website: raw.targetWebsite.trim(),
    },
    companyName: targetCompany,
    companyWebsite: raw.targetWebsite.trim(),
    salesRepWebsite: raw.salesRepWebsite.trim(),
    solution,
  };
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
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    if ("output_text" in record) return coerceToText(record.output_text);
    if ("text" in record) return coerceToText(record.text);
    if ("content" in record) return coerceToText(record.content);
    if ("value" in record) return coerceToText(record.value);
    if ("parts" in record) return coerceToText(record.parts);
    if ("messages" in record) return coerceToText(record.messages);
  }
  return "";
}

function extractResponseContent(
  response: Awaited<ReturnType<OpenAI["responses"]["create"]>>
): string {
  const safeResponse = response as {
    output_text?: unknown;
    output?: unknown;
  };

  const fromOutput = coerceToText(safeResponse.output_text);
  if (fromOutput.trim()) {
    return fromOutput.trim();
  }

  if (Array.isArray(safeResponse.output)) {
    const aggregated = safeResponse.output
      .map((item: unknown) => coerceToText(item))
      .filter(Boolean)
      .join("\n")
      .trim();
    if (aggregated) return aggregated;
  }

  return "";
}

const TILE_BATCH_SIZE = Math.max(
  1,
  parseInt(process.env.BROWSER_TILE_BATCH_SIZE ?? "2", 10)
);
const MAX_GENERATION_ATTEMPTS = 3;
const RETRY_BASE_DELAY_MS = 300;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type OpenAIResponse = Awaited<ReturnType<OpenAI["responses"]["create"]>>;

function summarizeResponse(response: OpenAIResponse) {
  const safe = response as unknown as Record<string, unknown>;
  const output = safe.output as unknown[];

  const preview = Array.isArray(output)
    ? output.slice(0, 3).map((item, index) => {
        const text = coerceToText(item)?.trim() ?? "";
        return {
          index,
          type:
            (item as { type?: string; role?: string })?.type ||
            (item as { role?: string })?.role ||
            "unknown",
          textPreview: text.substring(0, 160),
          textLength: text.length,
        };
      })
    : [];

  return {
    status: safe.status ?? null,
    incompleteReason: (safe.incomplete_details as { reason?: string })?.reason,
    usage: safe.usage ?? null,
    outputCount: Array.isArray(output) ? output.length : 0,
    preview,
  };
}

async function runGenerationAttempt(
  client: OpenAI,
  prompt: string,
  title: string,
  orderIndex: number,
  model: string,
  maxTokens: number | undefined,
  templateContext: {
    templateId?: string;
    templateTileId?: string;
  }
) {
  console.log("[api/generate] 🧠 Calling OpenAI for tile", {
    orderIndex,
    title,
    promptPreview: prompt.substring(0, 120),
    model,
    maxTokens: maxTokens || MAX_TOKENS,
    temperature: TEMPERATURE,
    promptLength: prompt.length,
    templateId: templateContext.templateId,
    templateTileId: templateContext.templateTileId,
  });

  const normalizedModel = model.trim();
  const lowerModel = normalizedModel.toLowerCase();
  const shouldSendTemperature =
    !lowerModel.startsWith("gpt-5") && Number.isFinite(TEMPERATURE);

  if (!shouldSendTemperature && Number.isFinite(TEMPERATURE)) {
    console.log(
      `[api/generate] ℹ️ Ignorando temperature para modelo ${normalizedModel} (Responses API)`
    );
  }

  const completion = await client.responses.create({
    model: normalizedModel,
    input: prompt,
    max_output_tokens: maxTokens || MAX_TOKENS,
    metadata: {
      templateId: templateContext.templateId ?? "unknown",
      templateTileId: templateContext.templateTileId ?? "unknown",
      orderIndex: String(orderIndex),
      title,
    },
  });

  const content = extractResponseContent(completion);
  const usage = completion?.usage ?? null;

  console.log("[api/generate] 📥 Response summary", {
    orderIndex,
    title,
    summary: summarizeResponse(completion),
    parsedPreview: content.substring(0, 160),
    parsedLength: content.length,
  });

  return {
    content,
    usage: usage ? (usage as unknown as Record<string, unknown>) : null,
    raw: completion,
  };
}

function createHistoryEntry(
  role: TileMessage["role"],
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

function buildFallbackTile({
  prompt,
  title,
  templateTileId,
  templateId,
  category,
  model,
  orderIndex,
}: {
  prompt: string;
  title: string;
  templateTileId?: string;
  templateId: string;
  category?: string;
  model: string;
  orderIndex: number;
}): Tile {
  const timestamp = new Date().toISOString();
  const fallbackContent =
    "⚠️ This insight could not be generated right now. Try refreshing this tile in a few moments.";

  return {
    id: `tile_fallback_${orderIndex}_${Date.now().toString(36)}`,
    title: `${title} (fallback)`,
    content: fallbackContent,
    prompt,
    templateId,
    templateTileId,
    category,
    model,
    orderIndex,
    createdAt: timestamp,
    updatedAt: timestamp,
    totalTokens: null,
    attempts: MAX_GENERATION_ATTEMPTS,
    history: [
      createHistoryEntry("user", prompt, timestamp),
      createHistoryEntry("assistant", fallbackContent, timestamp),
    ],
  };
}

async function generateTileWithRetry({
  client,
  prompt,
  title,
  orderIndex,
  model,
  templateId,
  templateTileId,
  category,
  maxTokens,
}: {
  client: OpenAI;
  prompt: string;
  title: string;
  orderIndex: number;
  model: string;
  templateId: string;
  templateTileId?: string;
  category?: string;
  maxTokens?: number;
}): Promise<Tile> {
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < MAX_GENERATION_ATTEMPTS) {
    attempt += 1;
    try {
      const attemptResult = await runGenerationAttempt(
        client,
        prompt,
        title,
        orderIndex,
        model,
        maxTokens,
        {
          templateId,
          templateTileId,
        }
      );
      let content = attemptResult.content?.trim();

      // Accept partial output if response is incomplete but has content
      if (
        !content &&
        attemptResult.raw?.status === "incomplete" &&
        attemptResult.raw?.output_text
      ) {
        content = attemptResult.raw.output_text.trim();
        if (content) {
          console.warn(
            "[api/generate] ⚠️ Partial response accepted for incomplete output",
            {
              orderIndex,
              title,
              model,
              attempt,
              contentPreview: content.substring(0, 100),
            }
          );
        }
      }

      if (!content) {
        console.warn("[api/generate] ⚠️ Empty response from OpenAI", {
          orderIndex,
          title,
          model,
          attempt,
          rawResponse: attemptResult.raw,
        });
        throw new Error("empty_response");
      }

      const timestamp = new Date().toISOString();
      const trimmedContent = clampTiles(content);
      const promptEntry = createHistoryEntry("user", prompt, timestamp);
      const assistantEntry = createHistoryEntry(
        "assistant",
        content,
        timestamp
      );
      const usageInfo = attemptResult.usage as {
        total_tokens?: number | null;
        total_token_count?: number | null;
      } | null;
      const totalTokens =
        usageInfo?.total_tokens ?? usageInfo?.total_token_count ?? null;

      console.log("[api/generate] ✅ Tile generated", {
        orderIndex,
        title,
        attempt,
        contentPreview: trimmedContent.substring(0, 160),
        totalTokens,
        templateId,
        templateTileId,
        maxTokens,
      });

      return {
        id: `tile_${orderIndex}_${Date.now().toString(36)}`,
        title,
        content: trimmedContent,
        prompt,
        templateId,
        templateTileId,
        category,
        model,
        orderIndex,
        createdAt: timestamp,
        updatedAt: timestamp,
        totalTokens,
        attempts: attempt,
        history: [promptEntry, assistantEntry],
      };
    } catch (error) {
      lastError = error;
      console.warn("[api/generate] ⚠️ Tile generation attempt failed", {
        orderIndex,
        title,
        model,
        attempt,
        maxTokens,
        templateId,
        templateTileId,
        error,
      });

      if (attempt >= MAX_GENERATION_ATTEMPTS) {
        break;
      }

      const backoff = Math.pow(2, attempt) * RETRY_BASE_DELAY_MS;
      await delay(backoff);
    }
  }

  console.error("[api/generate] ❌ All attempts failed", {
    orderIndex,
    title,
    model,
    lastError,
      maxTokens,
      templateId,
      templateTileId,
  });

  return buildFallbackTile({
    prompt,
    title,
    templateId,
    templateTileId,
    category,
    model,
    orderIndex,
  });
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  const parseResult = requestSchema.safeParse(payload);
  if (!parseResult.success) {
    console.warn(
      "[api/generate] ⚠️ Invalid payload",
      parseResult.error.flatten()
    );
    return NextResponse.json(
      { error: "Invalid payload", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const {
    salesRepCompany,
    salesRepWebsite,
    solution,
    targetCompany,
    targetWebsite,
    templateId = "template_1",
    model: requestedModel,
  } = parseResult.data;
  const model = resolveModel(requestedModel);

  if (!process.env.OPENAI_API_KEY) {
    console.error("[api/generate] ❌ OPENAI_API_KEY is not configured");
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    console.log("[api/generate] 📤 Payload:", {
      salesRepCompany,
      salesRepWebsite,
      solution,
      targetCompany,
      targetWebsite,
      templateId,
      model,
    });

    const template = getGuestTemplate(templateId);
    const normalizedContext = normalizeContext({
      salesRepCompany,
      salesRepWebsite,
      solution,
      targetCompany,
      targetWebsite,
    });

    const prompts = template.tiles.map((item) => ({
      ...item,
      prompt: processPromptVariables(item.prompt, normalizedContext),
      templateTileId: item.templateTileId ?? item.id,
      category: item.category,
    }));

    const tiles: Tile[] = new Array(prompts.length);

    for (let start = 0; start < prompts.length; start += TILE_BATCH_SIZE) {
      const end = Math.min(start + TILE_BATCH_SIZE, prompts.length);
      const batch = prompts.slice(start, end);

      const batchResults = await Promise.all(
        batch.map(async (item, offset) => {
          const orderIndex = start + offset;
          const maxTokens = getMaxTokensForTile(item.id);
          return generateTileWithRetry({
            client: openai,
            prompt: item.prompt,
            title: item.title,
            orderIndex,
            model,
            templateId,
            templateTileId: item.id,
            category: item.category,
            maxTokens,
          });
        })
      );

      batchResults.forEach((tile, idx) => {
        tiles[start + idx] = tile;
      });
    }

    console.log("[api/generate] ✅ Tiles gerados/com fallback", {
      total: tiles.length,
      fallbackCount: tiles.filter((tile) => tile.title.endsWith("(fallback)"))
        .length,
    });

    const workspace: WorkspaceSnapshot = {
      sessionId: `session_${randomUUID()}`,
      generatedAt: new Date().toISOString(),
      tilesToGenerate: tiles.length,
      company: {
        id: `company_${randomUUID()}`,
        name: targetCompany,
        website: targetWebsite,
        tiles,
        notes: [],
        contacts: [],
      },
    };

    await writeWorkspace(workspace);

    console.log("[api/generate] 💾 Workspace gravado em cookie", {
      tilesGenerated: tiles.length,
      generatedAt: workspace.generatedAt,
    });

    return NextResponse.json({
      success: true,
      tilesGenerated: tiles.length,
    });
  } catch (error) {
    console.error("[api/generate] ❌ Unexpected error", error);
    return NextResponse.json(
      { error: "Unexpected error while generating insights" },
      { status: 500 }
    );
  }
}
