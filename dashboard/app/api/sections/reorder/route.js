import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/lib/db";

/**
 * PUT /api/sections/reorder
 * Atualiza a ordem das sections
 */
export async function PUT(request) {
  try {
    // Verificar autenticação
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const { sections, workspaceId } = body;

    if (!sections || !Array.isArray(sections)) {
      return NextResponse.json(
        { error: "Lista de sections é obrigatória" },
        { status: 400 }
      );
    }

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID é obrigatório" },
        { status: 400 }
      );
    }

    console.log(
      `🔄 Reordenando ${sections.length} sections para workspace ${workspaceId}`
    );

    // Atualizar ordem de cada section
    const updatePromises = sections.map((section, index) => {
      return db.update(
        "sections",
        { _id: section._id },
        {
          order: index,
          updatedAt: new Date(),
        }
      );
    });

    await Promise.all(updatePromises);

    console.log("✅ Sections reordenadas com sucesso");

    return NextResponse.json({
      success: true,
      message: "Ordem das sections atualizada",
      count: sections.length,
    });
  } catch (error) {
    console.error("❌ Erro ao reordenar sections:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
