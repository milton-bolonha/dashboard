import { NextResponse } from "next/server";

import { updateWorkspace } from "@/lib/cookies-store";

type RouteContext = { params: Promise<{ tileId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { tileId } = await context.params;

  const updated = await updateWorkspace((workspace) => {
    return {
      ...workspace,
      company: {
        ...workspace.company,
        tiles: workspace.company.tiles
          .filter((tile) => tile.id !== tileId)
          .map((tile, index) => ({ ...tile, orderIndex: index })),
      },
    };
  });

  return NextResponse.json({ success: true, tiles: updated.company.tiles });
}

