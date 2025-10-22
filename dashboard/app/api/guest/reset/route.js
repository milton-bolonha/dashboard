/**
 * Reset Guest Session (apenas para DEBUG)
 * DELETE: Limpa cookie e workspace do MongoDB
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { cookies } from "next/headers";

export async function DELETE() {
  try {
    console.log("🗑️ RESET Guest Session - Iniciando...");

    const cookieStore = await cookies();
    const guestId = cookieStore.get("guest_id")?.value;

    if (guestId) {
      console.log("🗑️ Deletando workspace:", guestId);

      // Deletar do MongoDB
      await db.deleteOne("guest_workspaces", { guest_id: guestId });

      // Limpar cookie
      cookieStore.set("guest_id", "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 0,
        path: "/",
      });

      console.log("✅ Guest session resetada!");
    }

    return NextResponse.json({ success: true, message: "Session reset" });
  } catch (error) {
    console.error("❌ Erro ao resetar session:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
