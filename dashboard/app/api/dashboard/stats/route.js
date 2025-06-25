import { NextResponse } from "next/server";
import { db } from "@/lib/db.js";

/**
 * GET /api/dashboard/stats
 * Retorna estatísticas gerais do dashboard
 */
export async function GET() {
  try {
    // Contar documentos em paralelo
    const [sections, items, users, plans] = await Promise.all([
      db.find("sections", {}, { projection: { _id: 1 } }),
      db.find("items", {}, { projection: { _id: 1 } }),
      db.find("users", {}, { projection: { _id: 1 } }),
      db.find("plans", {}, { projection: { _id: 1 } }),
    ]);

    const stats = {
      sections: sections.length,
      items: items.length,
      users: users.length,
      plans: plans.length,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.warn(
      "Could not connect to DB for stats, returning 0.",
      error.message
    );
    // Se o DB não estiver conectado, retorne 0 em vez de erro.
    const stats = {
      sections: 0,
      items: 0,
      users: 0,
      plans: 0,
    };
    return NextResponse.json(stats);
  }
}
