import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ContentTypeSchema, validateSchema } from "@/schemas/index.js";
import { ObjectId } from "mongodb";

/**
 * GET /api/content-types/[id]
 * Pega um content type específico
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const contentType = await db.findOne("contentTypes", {
      _id: new ObjectId(id),
    });
    if (!contentType) {
      return NextResponse.json(
        { error: "Content type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ contentType });
  } catch (error) {
    console.error(`Error loading content type ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to load content type" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/content-types/[id]
 * Atualiza um content type
 */
export async function PUT(request, { params }) {
  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const data = await request.json();
    const validation = validateSchema(data, ContentTypeSchema);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const result = await db.updateOne(
      "contentTypes",
      { _id: new ObjectId(id) },
      data
    );
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Content type not found" },
        { status: 404 }
      );
    }

    const updatedContentType = await db.findOne("contentTypes", {
      _id: new ObjectId(id),
    });
    return NextResponse.json({ contentType: updatedContentType });
  } catch (error) {
    console.error(`Error updating content type ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to update content type" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/content-types/[id]
 * Deleta um content type
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const result = await db.deleteOne("contentTypes", {
      _id: new ObjectId(id),
    });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Content type not found" },
        { status: 404 }
      );
    }

    // TODO: O que fazer com as sections e items que usam este content type?
    // Por enquanto, apenas deletamos o content type.

    return NextResponse.json(
      { message: "Content type deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting content type ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to delete content type" },
      { status: 500 }
    );
  }
}
