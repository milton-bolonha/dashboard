/**
 * Guest Reorder Tiles API
 * POST: Salva a nova ordem dos tiles de uma company
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import Joi from "joi";
import sanitizeHtml from "sanitize-html";

const reorderTilesSchema = Joi.object({
  companyName: Joi.string().max(100).trim().required(),
  tilesOrder: Joi.array().items(Joi.string()).min(1).required(),
}).strict();

export async function POST(req) {
  try {
    console.log("📥 POST /api/guest/reorder-tiles - Iniciando...");

    // ⭐ Next.js 15: await cookies()
    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json({ error: "No guest session" }, { status: 401 });
    }

    const body = await req.json();
    console.log("📦 Body:", JSON.stringify(body, null, 2));

    // Validar input
    const { error, value } = reorderTilesSchema.validate(body);
    if (error) {
      return NextResponse.json(
        { error: error.details[0].message },
        { status: 400 }
      );
    }

    // Sanitizar inputs
    const sanitized = {
      companyName: sanitizeHtml(value.companyName, { allowedTags: [] }),
      tilesOrder: value.tilesOrder.map((id) =>
        sanitizeHtml(id, { allowedTags: [] })
      ),
    };

    // Buscar guest workspace
    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!guestWorkspace) {
      return NextResponse.json(
        { error: "Guest workspace not found" },
        { status: 404 }
      );
    }

    // Encontrar a company
    const companyIndex = guestWorkspace.workspace_data.companies.findIndex(
      (c) => c.name === sanitized.companyName
    );

    if (companyIndex === -1) {
      return NextResponse.json(
        { error: `Company "${sanitized.companyName}" not found` },
        { status: 404 }
      );
    }

    // Reordenar tiles baseado na nova ordem
    const company = guestWorkspace.workspace_data.companies[companyIndex];
    const reorderedTiles = [];

    // Adicionar tiles na nova ordem
    for (const tileId of sanitized.tilesOrder) {
      const tile = company.tiles.find((t) => t.id === tileId);
      if (tile) {
        reorderedTiles.push(tile);
      }
    }

    // Adicionar tiles que não estão na ordem (caso de tiles novos)
    for (const tile of company.tiles) {
      if (!sanitized.tilesOrder.includes(tile.id)) {
        reorderedTiles.push(tile);
      }
    }

    // Salvar nova ordem no banco
    await db.updateOne(
      "guest_workspaces",
      {
        guest_id: guestId,
        "workspace_data.companies.name": sanitized.companyName,
      },
      {
        $set: { "workspace_data.companies.$.tiles": reorderedTiles },
      }
    );

    console.log(`✅ Tiles reordered for ${sanitized.companyName}`);

    return NextResponse.json({
      success: true,
      message: "Tiles order saved successfully",
      tilesOrder: sanitized.tilesOrder,
    });
  } catch (error) {
    console.error("❌ Erro ao reordenar tiles:", error);
    return NextResponse.json(
      { error: "Failed to reorder tiles", details: error.message },
      { status: 500 }
    );
  }
}
