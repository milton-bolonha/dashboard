import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ContentTypeSchema, validateSchema } from "@/schemas/index.js";
import { ObjectId } from "mongodb";

/**
 * GET /api/content-types
 * Lista todos os content types
 */
export async function GET() {
  try {
    const contentTypes = await db.find("contentTypes");
    return NextResponse.json({ contentTypes });
  } catch (error) {
    console.error("Error loading content types:", error);
    return NextResponse.json(
      { error: "Failed to load content types" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/content-types
 * Cria um novo content type e, por padrão, uma section correspondente.
 */
export async function POST(request) {
  try {
    const data = await request.json();
    const { createDefaultSection = true, ...contentTypeData } = data;

    const validation = validateSchema(contentTypeData, ContentTypeSchema);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const slug =
      contentTypeData.slug ||
      contentTypeData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    const existing = await db.findOne("contentTypes", { slug });
    if (existing) {
      return NextResponse.json(
        { error: "Content type with this slug already exists" },
        { status: 409 }
      );
    }

    // 1. Criar o Content Type
    const result = await db.insertOne("contentTypes", {
      ...contentTypeData,
      slug,
    });
    const newContentType = await db.findOne("contentTypes", {
      _id: result.insertedId,
    });

    // 2. Se aplicável, criar a Section correspondente
    if (createDefaultSection) {
      const sectionData = {
        name: newContentType.name,
        slug: newContentType.slug,
        contentTypeId: newContentType._id.toString(),
        description: `Section para o Content Type ${newContentType.name}`,
        settings: {
          defaultView: "list",
          itemsPerPage: 20,
          sortBy: "createdAt",
          sortOrder: "desc",
        },
        isActive: true,
      };
      await db.insertOne("sections", sectionData);
    }

    return NextResponse.json({ contentType: newContentType }, { status: 201 });
  } catch (error) {
    console.error("Error creating content type:", error);
    return NextResponse.json(
      { error: "Failed to create content type" },
      { status: 500 }
    );
  }
}
