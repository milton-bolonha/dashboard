import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";
import OpenAI from "openai";

import { writeWorkspace } from "@/lib/cookies-store";
import { checkUsageMiddleware } from "@/lib/server/usage-middleware";
import {
  getGuestTemplate,
  getPromptAgent,
  processPromptVariables,
  resolveTemplateTiles,
  GUEST_DASHBOARD_TEMPLATES,
  PROMPT_VARIABLE_DEFINITIONS,
  type PromptAgentId,
  type PromptVariableId,
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
  promptAgent: z.string().min(2).optional(),
  responseLength: z.enum(["short", "medium", "long"]).optional(),
  promptVariables: z.array(z.string().min(1)).max(16).optional(),
  bulkPrompts: z.array(z.string().min(2)).max(200).optional(),
});

const MAX_TOKENS = DEFAULT_MAX_OUTPUT_TOKENS;

// Map request size to max tokens
function getMaxTokensForRequestSize(size: "small" | "medium" | "large"): number {
  switch (size) {
    case "small":
      return 400; // ~200-400 tokens
    case "medium":
      return 800; // ~600-800 tokens
    case "large":
      return 1600; // ~1200-1600 tokens
    default:
      return 400;
  }
}

// Reduce tokens for tiles that often hit limits (legacy function, kept for backward compatibility)
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
  promptAgent?: string;
  responseLength?: "short" | "medium" | "long";
  promptVariables?: string[];
  bulkPrompts?: string[];
  model?: string;
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
    promptAgent: raw.promptAgent,
    responseLength: raw.responseLength ?? "medium",
    promptVariables:
      raw.promptVariables && raw.promptVariables.length > 0
        ? raw.promptVariables.join(", ")
        : undefined,
    bulkPrompts:
      raw.bulkPrompts && raw.bulkPrompts.length > 0
        ? raw.bulkPrompts.join(" || ")
        : undefined,
    model: raw.model,
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
    agentId?: string;
    responseLength?: "short" | "medium" | "long";
    promptVariables?: string[];
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
    agentId: params.agentId,
    responseLength: params.responseLength,
    promptVariables: params.promptVariables,
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
    promptAgent: requestedPromptAgent,
    responseLength,
    promptVariables: rawPromptVariables = [],
    bulkPrompts = [],
  } = parseResult.data;
  const agentDefinition = getPromptAgent(
    requestedPromptAgent as PromptAgentId | undefined,
  );
  const agentId = agentDefinition.id as PromptAgentId;
  const normalizedPromptVariables = rawPromptVariables.filter(
    (value): value is PromptVariableId =>
      PROMPT_VARIABLE_DEFINITIONS.some(
        (definition) => definition.id === value,
      ),
  );
  const model = resolveModel(requestedModel ?? agentDefinition.defaultModel);

  // Check usage limits before processing
  const template = GUEST_DASHBOARD_TEMPLATES[templateId];
  const estimatedTiles = template?.tiles.length || 8;
  
  const usageCheck = await checkUsageMiddleware(payload, request.headers, estimatedTiles);
  if (!usageCheck.allowed) {
    return usageCheck.response || NextResponse.json(
      { error: "Usage limit exceeded", code: "USAGE_LIMIT_EXCEEDED" },
      { status: 429 }
    );
  }
  
  try {
    console.log("[api/generate] 📤 Payload:", {
      salesRepCompany,
      salesRepWebsite,
      solution,
      targetCompany,
      targetWebsite,
      templateId,
      model,
      agentId,
      responseLength,
      promptVariablesCount: normalizedPromptVariables.length,
      bulkPromptsCount: bulkPrompts.length,
    });

    const template = getGuestTemplate(templateId);
    const normalizedContext = normalizeContext({
      salesRepCompany,
      salesRepWebsite,
      solution,
      targetCompany,
      targetWebsite,
      promptAgent: agentId,
      responseLength,
      promptVariables: normalizedPromptVariables,
      bulkPrompts,
      model,
    });

    const resolvedTiles = resolveTemplateTiles(template, {
      templateId,
      agentId,
      responseLength,
      promptVariables: normalizedPromptVariables,
      bulkPrompts,
    });

    const prompts = resolvedTiles.map((item) => {
      const runtimeContext = {
        ...normalizedContext,
        tile: {
          id: item.id,
          title: item.title,
          category: item.category,
          agentId: item.agentId,
          responseLength: item.preferredLength,
          variables: item.runtimeVariables,
        },
      };

      return {
        ...item,
        prompt: processPromptVariables(item.prompt, runtimeContext),
        templateTileId: item.templateTileId ?? item.id,
      };
    });

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
          agentId: item.agentId,
          responseLength: item.preferredLength,
          promptVariables: item.runtimeVariables,
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
            
            // Use requestSize from template tile if available, otherwise fallback to getMaxTokensForTile
            const requestSize = item.requestSize ?? "small";
            const maxTokens = item.requestSize 
              ? getMaxTokensForRequestSize(requestSize)
              : getMaxTokensForTile(item.templateTileId ?? item.id);
            
            // Determine model: use template's useMaxMode if available, otherwise use provided model
            const tileModel = item.useMaxMode ? "gpt-5" : (model || "gpt-5-nano");
            
            const generation = await generateTileContent({
              client: openai,
              prompt: item.prompt,
              title: item.title,
              orderIndex,
              model: tileModel,
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
              agentId: item.agentId,
              responseLength: item.preferredLength,
              promptVariables: item.runtimeVariables,
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
      appearance: {
        baseColor: process.env.NEXT_PUBLIC_ADE_BASE_COLOR ?? "#f5f5f0",
      },
      promptSettings: {
        templateId,
        model,
        promptAgent: agentId,
        responseLength,
        promptVariables: normalizedPromptVariables,
        bulkPrompts,
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
