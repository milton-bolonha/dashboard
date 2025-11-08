import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import OpenAI from "openai";

import { clampTiles, writeWorkspace } from "@/lib/cookies-store";
import {
  getGuestTemplate,
  processPromptVariables,
} from "@/lib/guest-templates";
import type { Tile, WorkspaceSnapshot } from "@/lib/types";

const requestSchema = z.object({
  salesRepCompany: z.string().min(2),
  salesRepWebsite: z.string().url(),
  solution: z.string().min(2),
  targetCompany: z.string().min(2),
  targetWebsite: z.string().url(),
  templateId: z.string().min(2).optional(),
  model: z.string().min(2).optional(),
});

const MODEL = process.env.OPENAI_MODEL || "gpt-5-mini";
const MAX_TOKENS = (() => {
  const raw = Number(process.env.OPENAI_MAX_OUTPUT_TOKENS);
  return Number.isFinite(raw) && raw > 0 ? raw : 600;
})();
const TEMPERATURE = (() => {
  const raw = Number(process.env.OPENAI_TEMPERATURE);
  return Number.isFinite(raw) ? raw : 0.7;
})();

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

async function generateTile(
  client: OpenAI,
  prompt: string,
  title: string,
  orderIndex: number,
  model: string
) {
  console.log("[api/generate] 🧠 Chamando OpenAI para tile", {
    orderIndex,
    title,
    promptPreview: prompt.substring(0, 120),
    model,
    maxTokens: MAX_TOKENS,
    temperature: TEMPERATURE,
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
    max_output_tokens: MAX_TOKENS,
  });

  const content = extractResponseContent(completion);

  if (!content) {
    console.warn("[api/generate] ⚠️ Resposta vazia da OpenAI", {
      model: normalizedModel,
      orderIndex,
      title,
      hasOutputText: Boolean(
        (completion as { output_text?: unknown })?.output_text
      ),
      hasOutputItems: Array.isArray(
        (completion as { output?: unknown })?.output
      ),
      rawResponse: completion,
    });
    return {
      id: `tile_fallback_empty_${orderIndex}_${Date.now().toString(36)}`,
      title,
      content:
        "⚠️ This insight could not be generated right now. Try refreshing this tile in a few moments.",
      orderIndex,
      createdAt: new Date().toISOString(),
    } satisfies Tile;
  }

  console.log("[api/generate] ✅ Tile gerado", {
    orderIndex,
    title,
    contentPreview: content.substring(0, 160),
  });

  return {
    id: `tile_${orderIndex}_${Date.now().toString(36)}`,
    title,
    content,
    orderIndex,
    createdAt: new Date().toISOString(),
  } satisfies Tile;
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
    model = MODEL,
  } = parseResult.data;

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
    }));

    const tiles: Tile[] = new Array(prompts.length);

    for (let start = 0; start < prompts.length; start += TILE_BATCH_SIZE) {
      const end = Math.min(start + TILE_BATCH_SIZE, prompts.length);
      const batch = prompts.slice(start, end);

      const batchResults = await Promise.all(
        batch.map(async (item, offset) => {
          const orderIndex = start + offset;
          try {
            return await generateTile(
              openai,
              item.prompt,
              item.title,
              orderIndex,
              model
            );
          } catch (error) {
            console.error("[api/generate] ⚠️ Falha ao gerar tile", {
              orderIndex,
              title: item.title,
              error,
            });
            return {
              id: `tile_fallback_${orderIndex}_${Date.now().toString(36)}`,
              title: `${item.title} (fallback)`,
              content:
                "⚠️ This insight could not be generated right now. Try refreshing this tile in a few moments.",
              orderIndex,
              createdAt: new Date().toISOString(),
            } satisfies Tile;
          }
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

    const now = new Date().toISOString();
    const normalizedTiles: Tile[] = tiles.map((tile, index) => ({
      id: tile.id ?? `tile_${index}_${Date.now().toString(36)}`,
      title: tile.title ?? `Insight ${index + 1}`,
      content: clampTiles(
        tile.content ??
          "⚠️ This insight could not be generated right now. Try refreshing this tile in a few moments."
      ),
      orderIndex: tile.orderIndex ?? index,
      createdAt: tile.createdAt ?? now,
    }));

    const workspace: WorkspaceSnapshot = {
      sessionId: `session_${randomUUID()}`,
      generatedAt: now,
      tilesToGenerate: normalizedTiles.length,
      company: {
        id: `company_${randomUUID()}`,
        name: targetCompany,
        website: targetWebsite,
        tiles: normalizedTiles,
        notes: [],
        contacts: [],
      },
    };

    await writeWorkspace(workspace);

    console.log("[api/generate] 💾 Workspace gravado em cookie", {
      tilesGenerated: normalizedTiles.length,
      generatedAt: workspace.generatedAt,
    });

    return NextResponse.json({
      success: true,
      tilesGenerated: normalizedTiles.length,
    });
  } catch (error) {
    console.error("[api/generate] ❌ Unexpected error", error);
    return NextResponse.json(
      { error: "Unexpected error while generating insights" },
      { status: 500 }
    );
  }
}
