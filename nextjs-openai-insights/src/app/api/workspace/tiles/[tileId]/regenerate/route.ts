import { NextResponse } from "next/server";
import OpenAI from "openai";

import { readWorkspace, updateWorkspace } from "@/lib/cookies-store";
import { resolveModel } from "@/lib/ai/settings";
import {
  generateMockTileContent,
  generateTileContent,
} from "@/lib/ai/tile-generation";
import type { Tile } from "@/lib/types";

const USE_MOCK_OPENAI = process.env.MOCK_OPENAI_RESPONSES === "true";
const MAX_HISTORY_LENGTH = 20;

type RouteContext = { params: Promise<{ tileId: string }> };

function isProblemTile(templateTileId: string | undefined) {
  const problemTiles = new Set([
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
  ]);
  return templateTileId ? problemTiles.has(templateTileId) : false;
}

function clampHistory(history: Tile["history"]) {
  if (history.length <= MAX_HISTORY_LENGTH) {
    return history;
  }
  return history.slice(-MAX_HISTORY_LENGTH);
}

export async function POST(_request: Request, context: RouteContext) {
  const { tileId } = await context.params;

  const workspace = await readWorkspace();
  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace cache expired" },
      { status: 404 },
    );
  }

  const currentTile =
    workspace.company.tiles.find((tile) => tile.id === tileId) ?? null;
  if (!currentTile) {
    return NextResponse.json({ error: "Tile not found" }, { status: 404 });
  }

  const templateTileId = currentTile.templateTileId ?? currentTile.id;
  const model = resolveModel(currentTile.model);
  const maxTokens = isProblemTile(templateTileId) ? 400 : undefined;

  let generation =
    USE_MOCK_OPENAI
      ? generateMockTileContent({
          prompt: currentTile.prompt,
          title: currentTile.title,
          templateId: currentTile.templateId ?? "legacy_template",
          templateTileId,
          category: currentTile.category,
          model,
          orderIndex: currentTile.orderIndex,
        })
      : null;

  if (!USE_MOCK_OPENAI) {
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY is not configured" },
        { status: 500 },
      );
    }
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    generation = await generateTileContent({
      client: openai,
      prompt: currentTile.prompt,
      title: currentTile.title,
      templateId: currentTile.templateId ?? "legacy_template",
      templateTileId,
      category: currentTile.category,
      model,
      orderIndex: currentTile.orderIndex,
      maxTokens,
    });
  }

  if (!generation) {
    return NextResponse.json(
      { error: "Failed to generate tile content" },
      { status: 500 },
    );
  }

  const generationResult = generation;

  try {
    const updatedWorkspace = await updateWorkspace((snapshot) => {
      const tiles = snapshot.company.tiles;
      const index = tiles.findIndex((tile) => tile.id === tileId);
      if (index === -1) {
        return snapshot;
      }

      const snapshotTile = tiles[index];
      const combinedHistory = clampHistory([
        ...snapshotTile.history,
        ...generationResult.history,
      ]);

      const updatedTile: Tile = {
        ...snapshotTile,
        content: generationResult.content,
        prompt: generationResult.prompt,
        model: generationResult.model,
        updatedAt: generationResult.updatedAt,
        totalTokens:
          generationResult.totalTokens ?? snapshotTile.totalTokens ?? null,
        attempts: generationResult.attempts,
        history: combinedHistory,
      };

      const nextTiles = [...tiles];
      nextTiles[index] = updatedTile;

      return {
        ...snapshot,
        company: {
          ...snapshot.company,
          tiles: nextTiles,
        },
      };
    });

    const refreshedTile =
      updatedWorkspace.company.tiles.find((tile) => tile.id === tileId) ??
      currentTile;

    return NextResponse.json({ success: true, tile: refreshedTile });
  } catch (error) {
    console.error("[api/workspace/tiles/regenerate] Failed to update workspace", {
      tileId,
      error,
    });
    return NextResponse.json(
      { error: "Workspace cache expired" },
      { status: 404 },
    );
  }
}


