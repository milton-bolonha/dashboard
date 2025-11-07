import { NextResponse } from "next/server";

import { cookieModeEnabled } from "@/lib/config/features";
import {
  enforceTileLimit,
  writeWorkspaceToCookies,
} from "@/lib/cookie-workspace-store";
import { getGuestTemplate, processPromptVariables } from "@/lib/guest-templates";
import { generateCompletion } from "@/lib/ai/provider";

const DEFAULT_MODEL = "gpt-5-mini";
const DEFAULT_MAX_TOKENS = 600;
const MAX_TILES = 10;
const TILE_BATCH_SIZE = Math.max(
  1,
  parseInt(process.env.BROWSER_TILE_BATCH_SIZE || "2", 10)
);

function normalizeContext(raw = {}) {
  const safe = (value, fallback = "") => {
    if (!value) return fallback;
    if (typeof value === "string") return value;
    if (typeof value === "object") {
      return value?.name || value?.title || fallback;
    }
    return String(value);
  };

  const target = safe(raw.target, "Preview Company");
  const website = safe(raw.targetWebsite || raw.companyWebsite, "");
  const solution = safe(raw.solution, raw.sellingSolutionsFor || "");
  const salesRepAt = safe(raw.salesRepAt, raw.salesRepCompany || "");

  return {
    ...raw,
    company: {
      name: target,
      website,
    },
    companyWebsite: website,
    researchTarget: safe(raw.researchTarget, target),
    researchWebsite: safe(raw.researchWebsite, website),
    sellingSolutionsFor: solution,
    salesRepAt,
  };
}

async function generateTiles({ templateId, context, model = DEFAULT_MODEL }) {
  const template = getGuestTemplate(templateId);
  const normalizedContext = normalizeContext(context);
  const totalTiles = Math.min(template.tiles.length, MAX_TILES);
  const tiles = new Array(totalTiles);

  const processTile = async (index) => {
    const tileTemplate = template.tiles[index];
    const processedPrompt = processPromptVariables(
      tileTemplate.prompt,
      normalizedContext
    );

    try {
      const completion = await generateCompletion({
        model,
        prompt: processedPrompt,
        max_tokens: DEFAULT_MAX_TOKENS,
        reasoningEffort: "low",
        verbosity: "concise",
      });

      tiles[index] = {
        id: `tile_cookie_${tileTemplate.id}`,
        title: tileTemplate.title,
        prompt: processedPrompt,
        content: completion?.content || "",
        orderIndex: index,
        metrics: {
          model,
          originalId: tileTemplate.id,
          totalTokens: completion?.usage?.total_tokens ?? null,
        },
      };
    } catch (error) {
      console.error(
        `[prompt-lite] Failed to generate tile ${tileTemplate.id}:`,
        error
      );
      tiles[index] = {
        id: `tile_cookie_${tileTemplate.id}`,
        title: tileTemplate.title,
        prompt: processedPrompt,
        content:
          "⚠️ Não foi possível gerar este insight agora. Tente novamente em instantes.",
        orderIndex: index,
        metrics: {
          model,
          originalId: tileTemplate.id,
          error: error?.message || "unknown",
        },
      };
    }
  };

  for (let start = 0; start < totalTiles; start += TILE_BATCH_SIZE) {
    const end = Math.min(start + TILE_BATCH_SIZE, totalTiles);
    const batch = [];
    for (let index = start; index < end; index += 1) {
      batch.push(processTile(index));
    }
    await Promise.all(batch);
  }

  return { tiles, normalizedContext };
}

export async function POST(request) {
  if (!cookieModeEnabled) {
    return NextResponse.json(
      { error: "Cookie-based workspace mode is disabled." },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const { templateId = "template_1", model = DEFAULT_MODEL, context = {} } =
      body || {};

    if (!context || Object.keys(context).length === 0) {
      return NextResponse.json(
        { error: "Context data is required" },
        { status: 400 }
      );
    }

    const { tiles, normalizedContext } = await generateTiles({
      templateId,
      model,
      context,
    });

    const trimmedTiles = enforceTileLimit(tiles, MAX_TILES);
    await writeWorkspaceToCookies({
      companyName: normalizedContext.company?.name || normalizedContext.target,
      companyWebsite:
        normalizedContext.company?.website || normalizedContext.targetWebsite,
      tiles: trimmedTiles,
    });

    return NextResponse.json({
      ok: true,
      tilesGenerated: trimmedTiles.length,
      company: normalizedContext.company?.name || normalizedContext.target,
    });
  } catch (error) {
    console.error("[prompt-lite] Unexpected error", error);
    return NextResponse.json(
      { error: "Failed to generate tiles" },
      { status: 500 }
    );
  }
}

