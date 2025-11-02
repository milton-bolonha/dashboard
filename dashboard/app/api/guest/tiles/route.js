/**
 * Guest Tiles API
 * POST: Salva tile no workspace (chamado quando tile é gerado via job)
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

/**
 * POST /api/guest/tiles
 * Salva tile no workspace quando gerado via job
 * Body: { companyName, tile, tiles_to_generate?, entityKey? }
 */
export async function POST(req) {
  try {
    console.log("📥 POST /api/guest/tiles - Iniciando...");

    const cookieStore = await cookies();
    let guestId = cookieStore.get("guest_id")?.value;

    // ⭐ FALLBACK: Se não há cookie, tentar da query string (fluxo job_id)
    if (!guestId) {
      const { searchParams } = new URL(req.url);
      guestId = searchParams.get("guest_id");
    }

    if (!guestId) {
      return NextResponse.json(
        { success: false, error: "Guest session not found" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      companyName,
      tile,
      tiles_to_generate,
      entityKey: providedEntityKey,
    } = body;

    if (!companyName || !tile) {
      return NextResponse.json(
        { success: false, error: "companyName and tile are required" },
        { status: 400 }
      );
    }

    // Buscar workspace para determinar entityKey
    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!guestWorkspace) {
      return NextResponse.json(
        { success: false, error: "Guest workspace not found" },
        { status: 404 }
      );
    }

    // ⭐ Determinar entityKey dinamicamente
    let entityKey = providedEntityKey || "companies";
    if (guestWorkspace.themeSnapshot) {
      const primaryEntity = guestWorkspace.themeSnapshot.entities?.find(
        (e) => e.isPrimary
      );
      if (primaryEntity) {
        entityKey = `${primaryEntity.id}s`;
        if (entityKey === "companys") entityKey = "companies";
      }
    }

    console.log(`💾 Salvando tile no workspace:`, {
      guestId,
      companyName,
      entityKey,
      tileId: tile.id,
      tileTitle: tile.title,
    });

    // ⭐ Preparar tile para salvar
    // ⭐ BUG FIX: Não salvar se não tem conteúdo
    if (!tile.result && !tile.content && !tile.answer && !tile.excerpt) {
      console.warn(`⚠️ Tile sem conteúdo, não salvando:`, tile);
      return NextResponse.json(
        { success: false, error: "Tile has no content" },
        { status: 400 }
      );
    }

    const tileToSave = {
      id:
        tile.id ||
        `tile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: tile.title,
      content: tile.result || tile.content || tile.answer || "",
      answer: tile.result || tile.answer || "",
      excerpt: tile.excerpt || tile.result?.substring(0, 200) || "",
      orderIndex: tile.orderIndex ?? 0,
      metrics: tile.metrics,
      createdAt: tile.createdAt || new Date().toISOString(),
    };

    // ⭐ BUG FIX: Verificar se já existe tile com mesmo orderIndex antes de salvar
    // Evitar duplicação no banco de dados
    if (guestWorkspace?.workspace_data?.[entityKey]) {
      const existingEntity = guestWorkspace.workspace_data[entityKey].find(
        (e) => e.name === companyName
      );

      if (existingEntity?.tiles) {
        const existingTileIndex = existingEntity.tiles.findIndex(
          (t) =>
            t.orderIndex === tileToSave.orderIndex &&
            t.title === tileToSave.title
        );

        if (existingTileIndex >= 0) {
          const existingTile = existingEntity.tiles[existingTileIndex];
          // Se já existe e tem conteúdo, substituir ao invés de duplicar
          if (
            existingTile.content ||
            existingTile.answer ||
            existingTile.excerpt
          ) {
            console.log(
              `🔄 Tile com orderIndex ${tileToSave.orderIndex} já existe, substituindo...`
            );
            // Usar $set para substituir o tile existente
            const updateQuery = {
              guest_id: guestId,
              [`workspace_data.${entityKey}.name`]: companyName,
            };
            const updateData = {
              $set: {
                [`workspace_data.${entityKey}.$.tiles.${existingTileIndex}`]:
                  tileToSave,
                updatedAt: new Date(),
              },
            };
            const result = await db.updateOne(
              "guest_workspaces",
              updateQuery,
              updateData
            );
            if (result.modifiedCount > 0) {
              console.log(
                `✅ Tile "${tileToSave.title}" substituído no workspace`
              );
              return NextResponse.json({
                success: true,
                message: "Tile replaced successfully",
                tile: tileToSave,
              });
            }
          }
        }
      }
    }

    // Salvar tile no workspace (novo tile)
    const updateQuery = {
      guest_id: guestId,
      [`workspace_data.${entityKey}.name`]: companyName,
    };

    const updateData = {
      $push: {
        [`workspace_data.${entityKey}.$.tiles`]: tileToSave,
      },
      $inc: { "usage.total_tiles_generated": 1 },
      $set: { updatedAt: new Date() },
    };

    // ⭐ BUG FIX: Atualizar tiles_to_generate se fornecido
    if (typeof tiles_to_generate === "number" && tiles_to_generate > 0) {
      updateData.$set[`workspace_data.${entityKey}.$.tiles_to_generate`] =
        tiles_to_generate;
      updateData.$set[`dynamicData.${entityKey}.$.tiles_to_generate`] =
        tiles_to_generate;
    }

    const result = await db.updateOne(
      "guest_workspaces",
      updateQuery,
      updateData
    );

    if (result.modifiedCount > 0) {
      console.log(`✅ Tile "${tileToSave.title}" salvo no workspace`);
      return NextResponse.json({
        success: true,
        message: "Tile saved successfully",
        tile: tileToSave,
      });
    } else {
      console.warn(`⚠️ Company não encontrada no workspace: ${companyName}`);
      return NextResponse.json(
        { success: false, error: "Company not found in workspace" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("❌ Erro ao salvar tile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save tile" },
      { status: 500 }
    );
  }
}
