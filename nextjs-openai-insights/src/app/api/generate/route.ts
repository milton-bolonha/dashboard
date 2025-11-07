import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { z } from "zod";

import { clampTiles, writeWorkspace } from "@/lib/cookies-store";
import { getNetlifyFunctionUrl } from "@/lib/env";
import type { Tile, WorkspaceSnapshot } from "@/lib/types";

const requestSchema = z.object({
  companyName: z.string().min(2),
  companyWebsite: z.string().url(),
  solution: z.string().min(2),
});

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  const parseResult = requestSchema.safeParse(payload);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: "Dados inválidos", details: parseResult.error.flatten() },
      { status: 400 }
    );
  }

  const { companyName, companyWebsite, solution } = parseResult.data;

  try {
    const functionUrl = getNetlifyFunctionUrl("ai-generate");
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ companyName, companyWebsite, solution }),
    });

    if (!response.ok) {
      const info = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: info.error ?? "Falha ao gerar insights" },
        { status: response.status }
      );
    }

    const data = (await response.json()) as { tiles: Tile[] };

    const now = new Date().toISOString();
    const normalizedTiles: Tile[] = (data.tiles || []).map((tile, index) => ({
      id: tile.id ?? `tile_${index}_${Date.now().toString(36)}`,
      title: tile.title ?? `Insight ${index + 1}`,
      content: clampTiles(tile.content ?? "Sem conteúdo gerado"),
      orderIndex: tile.orderIndex ?? index,
      createdAt: tile.createdAt ?? now,
    }));

    const workspace: WorkspaceSnapshot = {
      sessionId: `session_${randomUUID()}`,
      generatedAt: now,
      tilesToGenerate: normalizedTiles.length,
      company: {
        id: `company_${randomUUID()}`,
        name: companyName,
        website: companyWebsite,
        tiles: normalizedTiles,
        notes: [],
        contacts: [],
      },
    };

    await writeWorkspace(workspace);

    return NextResponse.json({
      success: true,
      tilesGenerated: normalizedTiles.length,
    });
  } catch (error) {
    console.error("[api/generate]", error);
    return NextResponse.json(
      { error: "Erro inesperado ao gerar insights" },
      { status: 500 }
    );
  }
}
