/**
 * Guest Tiles API
 * DELETE: Remove tile do banco de dados
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

/**
 * DELETE /api/guest/tiles/[id]
 * Remove tile do banco de dados
 */
export async function DELETE(req, { params }) {
  try {
    console.log("📥 DELETE /api/guest/tiles/[id] - Iniciando...");

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (!guestId) {
      return NextResponse.json(
        { success: false, error: "Guest session not found" },
        { status: 401 }
      );
    }

    const { id: tileId } = await params;
    console.log("🗑️ Deletando tile:", tileId);

    // Buscar guest workspace
    const guestWorkspace = await db.findOne("guest_workspaces", {
      guest_id: guestId,
    });

    if (!guestWorkspace) {
      return NextResponse.json(
        { success: false, error: "Guest workspace not found" },
        { status: 404 }
      );
    }

    // Encontrar e remover o tile de todas as companies
    const result = await db.updateOne(
      "guest_workspaces",
      { guest_id: guestId },
      {
        $pull: { "workspace_data.companies.$[].tiles": { id: tileId } },
        $set: { updatedAt: new Date() },
      }
    );

    if (result.modifiedCount > 0) {
      console.log("✅ Tile deletado do banco:", tileId);
      return NextResponse.json({
        success: true,
        message: "Tile deleted successfully",
      });
    } else {
      console.log("⚠️ Tile não encontrado:", tileId);
      return NextResponse.json(
        { success: false, error: "Tile not found" },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error("❌ Erro ao deletar tile:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete tile" },
      { status: 500 }
    );
  }
}
