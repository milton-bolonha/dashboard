import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import OpenAI from "openai";

import { writeWorkspace } from "@/lib/cookies-store";
import {
  getGuestTemplate,
  processPromptVariables,
} from "@/lib/guest-templates";
import type { Tile, WorkspaceSnapshot } from "@/lib/types";
import { DEFAULT_MAX_OUTPUT_TOKENS, resolveModel } from "@/lib/ai/settings";
import {
  generateMockTileContent,
  generateTileContent,
  type TileGenerationResult,
} from "@/lib/ai/tile-generation";

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

function composeTileFromGeneration(
  generation: TileGenerationResult,
  params: {
    title: string;
    prompt: string;
    templateId: string;
    templateTileId?: string;
    category?: string;
    model: string;
    orderIndex: number;
  },
): Tile {
  return {
    id: `tile_${randomUUID()}`,
    title: params.title,
    content: generation.content,
    prompt: params.prompt,
    templateId: params.templateId,
    templateTileId: params.templateTileId,
    category: params.category,
    model: generation.model,
    orderIndex: params.orderIndex,
    createdAt: generation.createdAt,
    updatedAt: generation.updatedAt,
    totalTokens: generation.totalTokens,
    attempts: generation.attempts,
    history: generation.history,
  };
}

const USE_MOCK_OPENAI = process.env.MOCK_OPENAI_RESPONSES === "true";
const globalStore = globalThis as typeof globalThis & {
  __USE_MOCK_WORKSPACE__?: boolean;
};

globalStore.__USE_MOCK_WORKSPACE__ = USE_MOCK_OPENAI;

const TILE_BATCH_SIZE = Math.max(
  1,
  parseInt(process.env.BROWSER_TILE_BATCH_SIZE ?? "2", 10)
);
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

    let tiles: Tile[];

    if (USE_MOCK_OPENAI) {
      console.log("[api/generate] 🤖 Using mock OpenAI responses");
      tiles = prompts.map((item, orderIndex) => {
        const generation = generateMockTileContent({
          prompt: item.prompt,
          title: item.title,
          templateId,
          templateTileId: item.templateTileId,
          category: item.category,
          model,
          orderIndex,
        });
        return composeTileFromGeneration(generation, {
          title: item.title,
          prompt: item.prompt,
          templateId,
          templateTileId: item.templateTileId,
          category: item.category,
          model,
          orderIndex,
        });
      });
    } else {
      if (!process.env.OPENAI_API_KEY) {
        console.error("[api/generate] ❌ OPENAI_API_KEY is not configured");
        return NextResponse.json(
          { error: "OPENAI_API_KEY is not configured" },
          { status: 500 },
        );
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const generatedTiles: Tile[] = new Array(prompts.length);

      for (let start = 0; start < prompts.length; start += TILE_BATCH_SIZE) {
        const end = Math.min(start + TILE_BATCH_SIZE, prompts.length);
        const batch = prompts.slice(start, end);

        const batchResults = await Promise.all(
          batch.map(async (item, offset) => {
            const orderIndex = start + offset;
            const maxTokens = getMaxTokensForTile(item.templateTileId ?? item.id);
            const generation = await generateTileContent({
              client: openai,
              prompt: item.prompt,
              title: item.title,
              orderIndex,
              model,
              templateId,
              templateTileId: item.templateTileId ?? item.id,
              category: item.category,
              maxTokens,
            });
            return composeTileFromGeneration(generation, {
              title: item.title,
              prompt: item.prompt,
              templateId,
              templateTileId: item.templateTileId ?? item.id,
              category: item.category,
              model,
              orderIndex,
            });
          }),
        );

        batchResults.forEach((tile, idx) => {
          generatedTiles[start + idx] = tile;
        });
      }

      tiles = generatedTiles;
    }

    console.log("[api/generate] ✅ Tiles gerados/com fallback", {
      total: tiles.length,
      fallbackCount: tiles.filter(
        (tile) =>
          tile.attempts >= 3 &&
          tile.content.startsWith("⚠️ This insight could not be generated"),
      ).length,
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

    const sessionId = await writeWorkspace(workspace);

    console.log("[api/generate] 💾 Workspace gravado em cache", {
      sessionId,
      tilesGenerated: tiles.length,
      generatedAt: workspace.generatedAt,
    });

    return NextResponse.json({
      success: true,
      tilesGenerated: tiles.length,
      sessionId,
      workspace,
    });
  } catch (error) {
    console.error("[api/generate] ❌ Unexpected error", error);
    return NextResponse.json(
      { error: "Unexpected error while generating insights" },
      { status: 500 }
    );
  }
}
