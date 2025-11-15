import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";

import { readWorkspace, updateWorkspace } from "@/lib/cookies-store";
import { resolveModel } from "@/lib/ai/settings";
import type { Tile } from "@/lib/types";
import { generateTileContent } from "@/lib/ai/tile-generation";

const createTileSchema = z.object({
  title: z.string().min(1, "Title is required"),
  prompt: z.string().min(1, "Prompt is required"),
  model: z.string().optional(),
  useMaxPrompt: z.boolean().optional(),
  requestSize: z.enum(["small", "medium", "large"]).optional(),
});

// Map request size to max tokens
function getMaxTokensForSize(size: "small" | "medium" | "large"): number {
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

export async function POST(request: Request) {
  console.log("[API] /api/workspace/tiles - Creating custom tile");

  const body = await request.json().catch(() => null);
  console.log("[API] /api/workspace/tiles - Received body:", body);
  
  // Check usage limits (simplified check - in production use proper middleware)
  // For now, we'll rely on client-side tracking and add server-side checks later

  const parseResult = createTileSchema.safeParse(body);
  if (!parseResult.success) {
    console.error("[API] /api/workspace/tiles - Invalid payload:", parseResult.error.flatten());
    return NextResponse.json(
      { error: "Invalid payload", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const workspace = await readWorkspace();
  if (!workspace) {
    console.error("[API] /api/workspace/tiles - No workspace found");
    return NextResponse.json(
      { error: "Workspace cache expired" },
      { status: 404 }
    );
  }

  console.log("[API] /api/workspace/tiles - Workspace found:", workspace.sessionId);

  const { title, prompt, model, useMaxPrompt, requestSize = "small" } = parseResult.data;
  
  // Determine model: useMaxPrompt = true -> gpt-5, false -> gpt-5-nano
  const selectedModel = model || (useMaxPrompt ? "gpt-5" : "gpt-5-nano");
  const resolvedModel = resolveModel(selectedModel);
  
  // Get max tokens based on request size
  const maxTokens = getMaxTokensForSize(requestSize);

  // Add company context to prompt (internal context, not visible to user)
  // This helps the AI understand which company is being researched
  const companyName = workspace.company.name || "the company";
  const companyWebsite = workspace.company.website;
  const companyContext = companyWebsite 
    ? `[Context: This research is about ${companyName} (${companyWebsite}). Use this information to provide accurate and relevant insights, but do not mention the company name or website in your response unless explicitly asked.]\n\n`
    : `[Context: This research is about ${companyName}. Use this information to provide accurate and relevant insights, but do not mention the company name in your response unless explicitly asked.]\n\n`;
  const enhancedPrompt = companyContext + prompt;

  console.log("[API] /api/workspace/tiles - Creating tile with model:", resolvedModel, "maxTokens:", maxTokens, "company:", companyName);

  try {
    // Generate tile content
    const existingTiles = workspace.company.tiles || [];
    const generationResult = await generateTileContent({
      prompt: enhancedPrompt,
      title,
      templateId: "custom",
      model: resolvedModel,
      orderIndex: existingTiles.length,
      maxTokens,
    });

    // Para tiles individuais criados pelo usuário, colocar no início (orderIndex negativo)
    // Isso faz com que apareçam primeiro, mas ainda podem ser reordenados via drag and drop
    // Usamos -1 para o mais recente, -2 para o anterior, etc.
    // Tiles de template têm orderIndex positivo (0, 1, 2...)
    const minOrderIndex = existingTiles.length > 0 
      ? Math.min(...existingTiles.map(t => t.orderIndex ?? 0))
      : 0;
    const newOrderIndex = minOrderIndex < 0 ? minOrderIndex - 1 : -1;
    
    const newTile: Tile = {
      id: `tile_${randomUUID()}`,
      title,
      content: generationResult.content,
      prompt, // Store original prompt (without company context) for display
      templateId: "custom",
      category: "custom",
      model: resolvedModel,
      orderIndex: newOrderIndex, // Negativo para aparecer primeiro
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalTokens: generationResult.totalTokens,
      attempts: generationResult.attempts,
      history: generationResult.history || [],
    };

    console.log("[API] /api/workspace/tiles - Tile created:", newTile.id);

    // Update workspace
    const updatedWorkspace = await updateWorkspace((ws) => ({
      ...ws,
      company: {
        ...ws.company,
        tiles: [...existingTiles, newTile],
      },
    }));

    console.log("[API] /api/workspace/tiles - Workspace updated successfully");

    return NextResponse.json({
      success: true,
      tile: newTile,
      workspace: updatedWorkspace,
    });
  } catch (error) {
    console.error("[API] /api/workspace/tiles - Error generating tile:", error);
    return NextResponse.json(
      {
        error: "Failed to generate tile content",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

