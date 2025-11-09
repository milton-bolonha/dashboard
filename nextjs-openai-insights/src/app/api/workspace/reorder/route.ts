import { NextResponse } from "next/server";
import { z } from "zod";

import { readWorkspace, updateWorkspace } from "@/lib/cookies-store";

const reorderSchema = z.object({
  order: z.array(z.string().min(1)).min(1),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parseResult = reorderSchema.safeParse(body);

  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const {
    order: desiredOrder,
  } = parseResult.data;

  const currentWorkspace = await readWorkspace();
  const existingTiles = currentWorkspace.company.tiles || [];
  const tileMap = new Map(existingTiles.map((tile) => [tile.id, tile]));

  const reorderedTiles = desiredOrder
    .map((tileId, index) => {
      const tile = tileMap.get(tileId);
      if (!tile) return null;
      return {
        ...tile,
        orderIndex: index,
      };
    })
    .filter(Boolean) as typeof existingTiles;

  const missingTiles = existingTiles
    .filter((tile) => !desiredOrder.includes(tile.id))
    .map((tile, offset) => ({
      ...tile,
      orderIndex: reorderedTiles.length + offset,
    }));

  const nextTiles = [...reorderedTiles, ...missingTiles];

  const updatedWorkspace = await updateWorkspace((workspace) => ({
    ...workspace,
    company: {
      ...workspace.company,
      tiles: nextTiles,
    },
  }));

  return NextResponse.json({
    success: true,
    tiles: updatedWorkspace.company.tiles,
  });
}

