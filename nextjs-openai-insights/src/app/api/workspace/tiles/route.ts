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
});

export async function POST(request: Request) {
  console.log("[API] /api/workspace/tiles - Creating custom tile");

  const body = await request.json().catch(() => null);
  console.log("[API] /api/workspace/tiles - Received body:", body);

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

  const { title, prompt, model, useMaxPrompt } = parseResult.data;
  const selectedModel = model || (useMaxPrompt ? "gpt-4" : "gpt-3.5-turbo");
  const resolvedModel = resolveModel(selectedModel);

  console.log("[API] /api/workspace/tiles - Creating tile with model:", resolvedModel);

  try {
    // Generate tile content
    const existingTiles = workspace.company.tiles || [];
    const generationResult = await generateTileContent({
      prompt,
      title,
      templateId: "custom",
      model: resolvedModel,
      orderIndex: existingTiles.length,
      maxTokens: 2000,
    });

    const newTile: Tile = {
      id: `tile_${randomUUID()}`,
      title,
      content: generationResult.content,
      prompt,
      templateId: "custom",
      category: "custom",
      model: resolvedModel,
      orderIndex: existingTiles.length,
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

