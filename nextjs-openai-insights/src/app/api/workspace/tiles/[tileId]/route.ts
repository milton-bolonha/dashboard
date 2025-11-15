import { NextResponse } from "next/server";

import { updateWorkspace, getCurrentSession } from "@/lib/cookies-store";
import { syncWorkspaceTilesToMongo } from "@/lib/storage/mongodb-store";

type RouteContext = { params: Promise<{ tileId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { tileId } = await context.params;

  try {
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

    // Dual-write: Sync tiles to MongoDB if available (non-blocking)
    try {
      const { sessionId } = await getCurrentSession();
      if (sessionId) {
        await syncWorkspaceTilesToMongo(sessionId, updated.company.tiles);
        console.log("[API] /api/workspace/tiles/[tileId] - ✅ Tiles também sincronizados no MongoDB");
      }
    } catch (mongoError) {
      const errorMessage = mongoError instanceof Error ? mongoError.message : String(mongoError);
      console.warn("[API] /api/workspace/tiles/[tileId] - ⚠️ Falha ao sincronizar no MongoDB (não crítico):", errorMessage);
    }

    return NextResponse.json({ success: true, tiles: updated.company.tiles });
  } catch {
    return NextResponse.json(
      { error: "Workspace cache expired" },
      { status: 404 }
    );
  }
}

