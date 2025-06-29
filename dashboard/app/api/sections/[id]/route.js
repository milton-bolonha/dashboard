import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SectionSchema, validateSchema } from "@/schemas/index.js";
import { ObjectId } from "mongodb";
import { getCurrentAuth } from "@/lib/auth";

/**
 * GET /api/sections/[id]
 * Pega uma section específica
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const section = await db.findOne("sections", { _id: new ObjectId(id) });
    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json({ section });
  } catch (error) {
    console.error(`Error loading section ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to load section" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sections/[id]
 * Atualiza uma section
 */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const data = await request.json();
    console.log("🔍 Dados recebidos para validação:", data);

    const validation = validateSchema(data, SectionSchema);
    console.log("🔍 Resultado da validação:", validation);

    if (!validation.isValid) {
      console.error("❌ Validação falhou:", validation.errors);
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const result = await db.updateOne(
      "sections",
      { _id: new ObjectId(id) },
      data
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const updatedSection = await db.findOne("sections", {
      _id: new ObjectId(id),
    });
    return NextResponse.json({ section: updatedSection });
  } catch (error) {
    console.error(`Error updating section ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to update section" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sections/[id]
 * Deleta uma section e todos os seus items associados.
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    const { userId } = await getCurrentAuth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid Section ID" },
        { status: 400 }
      );
    }

    const sectionId = new ObjectId(id);

    // 1. Verificar se a section existe e pertence ao usuário
    // (A verificação do workspace é uma camada extra de segurança)
    const section = await db.findOne("sections", {
      _id: sectionId,
      userId: userId,
    });

    if (!section) {
      return NextResponse.json(
        { error: "Section not found or you don't have permission" },
        { status: 404 }
      );
    }

    console.log(`🗑️ Iniciando deleção da section: ${section.name} (${id})`);

    // 2. Deleção em cascata dos items
    const itemsResult = await db.deleteMany("items", { sectionId: id }); // Usar `id` como string se ele for usado assim no schema
    console.log(`   - Deletados ${itemsResult.deletedCount} items.`);

    // 3. Deletar a Section
    const sectionResult = await db.deleteOne("sections", { _id: sectionId });
    console.log(`   - Deletada ${sectionResult.deletedCount} section.`);

    if (sectionResult.deletedCount === 0) {
      throw new Error("Falha ao deletar o documento da section.");
    }

    return NextResponse.json({
      message: "Section and all associated items deleted successfully.",
      details: {
        deletedItems: itemsResult.deletedCount,
      },
    });
  } catch (error) {
    console.error("Error deleting section:", error);
    return NextResponse.json(
      { error: "Failed to delete section" },
      { status: 500 }
    );
  }
}
