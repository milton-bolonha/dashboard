import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SectionSchema, validateSchema } from "@/schemas/index.js";
import { ObjectId } from "mongodb";

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
 * Deleta uma section
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Verificação de deleção em cascata
    // Não permitir deletar section se tiver items
    const itemsCount = await db.count("items", {
      sectionId: id,
    });

    if (itemsCount > 0) {
      return NextResponse.json(
        {
          error: `Não é possível deletar esta Section. Existem ${itemsCount} item(s) nela.`,
          details: {
            itemsCount,
            action: "delete_items_first",
            message: "Primeiro delete ou mova os items para outra section",
          },
        },
        { status: 400 }
      );
    }

    const result = await db.deleteOne("sections", { _id: new ObjectId(id) });
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Section deleted successfully" });
  } catch (error) {
    console.error(`Error deleting section ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to delete section" },
      { status: 500 }
    );
  }
}
