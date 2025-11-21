import { NextRequest } from "next/server";
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

// Processamento concorrente individual (não em lotes)
const CONCURRENT_TILES = Math.max(
  1,
  parseInt(process.env.CONCURRENT_TILE_GENERATION ?? "3", 10)
);

export async function POST(request: NextRequest) {
  const payload = await request.json().catch(() => null);

  const parseResult = requestSchema.safeParse(payload);
  if (!parseResult.success) {
    console.warn(
      "[api/generate/stream] ⚠️ Invalid payload",
      parseResult.error.flatten()
    );
    return new Response(
      JSON.stringify({ error: "Invalid payload", details: parseResult.error.flatten() }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
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
    return new Response(
      JSON.stringify({ error: "Usage limit exceeded", code: "USAGE_LIMIT_EXCEEDED" }),
      {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    console.log("[api/generate/stream] 📤 Payload:", {
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

    // Setup Server-Sent Events
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send initial connection event
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'connected',
              totalTiles: prompts.length,
              timestamp: new Date().toISOString()
            })}\n\n`)
          );

          let completedTiles = 0;
          const generatedTiles: Tile[] = new Array(prompts.length);

          if (USE_MOCK_OPENAI) {
            console.log("[api/generate/stream] 🤖 Using mock OpenAI responses");

            // Process mock tiles sequentially with delays for demo
            for (let i = 0; i < prompts.length; i++) {
              const item = prompts[i];
              const generation = generateMockTileContent({
                prompt: item.prompt,
                title: item.title,
                templateId,
                templateTileId: item.templateTileId,
                category: item.category,
                model,
                orderIndex: i,
              });

              const tile = composeTileFromGeneration(generation, {
                title: item.title,
                prompt: item.prompt,
                templateId,
                templateTileId: item.templateTileId,
                category: item.category,
                model,
                orderIndex: i,
                agentId: item.agentId,
                responseLength: item.preferredLength,
                promptVariables: item.runtimeVariables,
              });

              generatedTiles[i] = tile;
              completedTiles++;

              // Send tile event
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'tile_generated',
                  tile,
                  tileIndex: i,
                  completedTiles,
                  totalTiles: prompts.length,
                  timestamp: new Date().toISOString()
                })}\n\n`)
              );

              // Small delay between mock tiles
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          } else {
            if (!process.env.OPENAI_API_KEY) {
              console.error("[api/generate/stream] ❌ OPENAI_API_KEY is not configured");
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({
                  type: 'error',
                  error: 'OPENAI_API_KEY is not configured',
                  timestamp: new Date().toISOString()
                })}\n\n`)
              );
              controller.close();
              return;
            }

            const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

            // Process tiles concurrently with semaphore pattern
            const semaphore = new Semaphore(CONCURRENT_TILES);

            const tilePromises = prompts.map(async (item, orderIndex) => {
              await semaphore.acquire();

              try {
                // Use requestSize from template tile if available
                const requestSize = item.requestSize ?? "small";
                const maxTokens = item.requestSize
                  ? getMaxTokensForRequestSize(requestSize)
                  : getMaxTokensForTile(item.templateTileId ?? item.id);

                // Determine model: use template's useMaxMode if available
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

                const tile = composeTileFromGeneration(generation, {
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

                generatedTiles[orderIndex] = tile;

                // Send tile event immediately when ready
                try {
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({
                      type: 'tile_generated',
                      tile,
                      tileIndex: orderIndex,
                      completedTiles: ++completedTiles,
                      totalTiles: prompts.length,
                      timestamp: new Date().toISOString()
                    })}\n\n`)
                  );
                } catch (enqueueError) {
                  // Controller may be closed if client disconnected
                  console.warn('[api/generate/stream] ⚠️ Failed to enqueue tile event (controller may be closed):', enqueueError);
                }

                return tile;
              } finally {
                semaphore.release();
              }
            });

            // Wait for all tiles to complete
            await Promise.all(tilePromises);
          }

          // Send completion event
          const workspace: WorkspaceSnapshot = {
            sessionId: `session_${randomUUID()}`,
            generatedAt: new Date().toISOString(),
            tilesToGenerate: generatedTiles.length,
            company: {
              id: `company_${randomUUID()}`,
              name: targetCompany,
              website: targetWebsite,
              tiles: generatedTiles,
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
              target: targetCompany,
              sellingSolutionsFor: solution,
              targetWebsite: targetWebsite.trim(),
            },
          };

          // Save workspace
          const sessionId = await writeWorkspace(workspace);

          console.log("[api/generate/stream] ✅ All tiles completed", {
            sessionId,
            totalTiles: generatedTiles.length,
          });

          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'completed',
              sessionId,
              workspace,
              timestamp: new Date().toISOString()
            })}\n\n`)
          );

          controller.close();

        } catch (error) {
          console.error("[api/generate/stream] ❌ Stream error", error);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : String(error),
              timestamp: new Date().toISOString()
            })}\n\n`)
          );
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error("[api/generate/stream] ❌ Unexpected error", error);
    return new Response(
      JSON.stringify({ error: "Unexpected error while generating insights" }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Simple semaphore for controlling concurrency
class Semaphore {
  private permits: number;
  private waitQueue: (() => void)[] = [];

  constructor(permits: number) {
    this.permits = permits;
  }

  async acquire(): Promise<void> {
    if (this.permits > 0) {
      this.permits--;
      return;
    }

    return new Promise((resolve) => {
      this.waitQueue.push(resolve);
    });
  }

  release(): void {
    this.permits++;
    if (this.waitQueue.length > 0) {
      const resolve = this.waitQueue.shift()!;
      this.permits--;
      resolve();
    }
  }
}

