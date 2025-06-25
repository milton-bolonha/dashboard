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
    const { id } = params;
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
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const data = await request.json();
    const validation = validateSchema(data, SectionSchema);
    if (!validation.isValid) {
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
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // TODO: Deletar items associados a esta section
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
