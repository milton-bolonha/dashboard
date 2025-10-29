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

    console.log("📦 Guest ID:", guestId);

    if (!guestId) {
      return NextResponse.json({ error: "No guest session" }, { status: 401 });
    }

    const body = await req.json();
    console.log("📦 Body:", JSON.stringify(body, null, 2));

    // ⭐ CORREÇÃO: Filtrar IDs gerados automaticamente antes de validar
    if (body.tilesOrder && Array.isArray(body.tilesOrder)) {
      body.tilesOrder = body.tilesOrder.filter(
        (id) => id && !id.toString().startsWith("tile_generated_")
      );
      console.log("📦 TilesOrder filtrado:", body.tilesOrder);
    }

    // Validar input
    const { error, value } = reorderTilesSchema.validate(body);
    if (error) {
      console.error("❌ Erro de validação:", error);
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

    console.log("📊 Workspace encontrado:");
    console.log("- themeSnapshot:", guestWorkspace.themeSnapshot?.id);
    console.log(
      "- workspace_data keys:",
      Object.keys(guestWorkspace.workspace_data || {})
    );
    console.log(
      "- dynamicData keys:",
      Object.keys(guestWorkspace.dynamicData || {})
    );
    console.log(
      "- workspace_data.companies:",
      guestWorkspace.workspace_data?.companies
    );

    // ⭐ NOVO: Determinar a chave correta baseada no tema
    let entityKey = "companies";
    let company = null;

    if (guestWorkspace.themeSnapshot) {
      const primaryEntity = guestWorkspace.themeSnapshot.entities.find(
        (e) => e.isPrimary
      );
      entityKey = `${primaryEntity.id}s`;

      // Corrigir companys -> companies
      if (entityKey === "companys") {
        entityKey = "companies";
      }

      // ⭐ FIX: Buscar no workspace_data ao invés de guestWorkspace raiz
      // As entidades estão em workspace_data[entityKey] após o POST
      const entities = guestWorkspace.workspace_data?.[entityKey] || [];
      company = entities.find((c) => {
        // Procurar por name ou title (Book Creator usa title)
        return (
          c.name === sanitized.companyName || c.title === sanitized.companyName
        );
      });

      console.log(
        `🔍 Buscando entidade "${sanitized.companyName}" em ${entityKey}:`,
        {
          totalEntities: entities.length,
          entityNames: entities.map((e) => e.name || e.title),
          found: !!company,
        }
      );
    } else {
      // Fallback para companies antigas
      const entities = guestWorkspace.workspace_data?.companies || [];
      company = entities.find((c) => c.name === sanitized.companyName);
    }

    if (!company) {
      console.error(`❌ Entidade não encontrada:`, {
        searchedName: sanitized.companyName,
        entityKey,
        workspaceKeys: Object.keys(guestWorkspace.workspace_data || {}),
      });
      return NextResponse.json(
        { error: `Entity "${sanitized.companyName}" not found` },
        { status: 404 }
      );
    }

    // Reordenar tiles baseado na nova ordem
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

    // ⭐ NOVO: Atualizar no lugar correto baseado no tema
    if (guestWorkspace.themeSnapshot) {
      // Usar a chave dinâmica com workspace_data
      const queryName = company.name || company.title;

      await db.updateOne(
        "guest_workspaces",
        {
          guest_id: guestId,
          [`workspace_data.${entityKey}.name`]: queryName,
        },
        {
          $set: { [`workspace_data.${entityKey}.$.tiles`]: reorderedTiles },
        }
      );
    } else {
      // Fallback para estrutura antiga
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
    }

    console.log(`✅ Tiles reordered for ${sanitized.companyName}`);

    return NextResponse.json({
      success: true,
      message: "Tiles order saved successfully",
      tilesOrder: sanitized.tilesOrder,
    });
  } catch (error) {
    console.error("❌ Erro ao reordenar tiles:", error);
    console.error("❌ Stack:", error.stack);
    return NextResponse.json(
      {
        error: "Failed to reorder tiles",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
