import { NextResponse } from "next/server";
import { db } from "@/lib/db.js";
import { SectionSchema, validateSchema } from "@/schemas/index.js";

/**
 * GET /api/sections
 * Lista todas as sections
 */
export async function GET() {
  try {
    const sections = await db.find("sections", { isActive: true });
    return NextResponse.json({ sections });
  } catch (error) {
    console.warn(
      "Could not connect to DB for sections, returning empty array.",
      error.message
    );
    return NextResponse.json({ sections: [] });
  }
}

/**
 * POST /api/sections
 * Cria uma nova section
 */
export async function POST(request) {
  try {
    const data = await request.json();

    // Validar dados
    const validation = validateSchema(data, SectionSchema);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    // Gerar slug único
    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    // Verificar se slug já existe
    const existing = await db.findOne("sections", { slug });
    if (existing) {
      return NextResponse.json(
        { error: "Section with this slug already exists" },
        { status: 409 }
      );
    }

    // Criar section
    const sectionData = {
      ...data,
      slug,
      settings: {
        defaultView: "list",
        itemsPerPage: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
        ...data.settings,
      },
    };

    const result = await db.insertOne("sections", sectionData);

    // Buscar section criada
    const newSection = await db.findOne("sections", { _id: result.insertedId });

    return NextResponse.json({ section: newSection }, { status: 201 });
  } catch (error) {
    console.error("Error creating section:", error);
    return NextResponse.json(
      { error: "Failed to create section" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/sections
 * Atualiza uma section existente (usado quando o frontend envia PUT com _id)
 */
export async function PUT(request) {
  try {
    const data = await request.json();
    const { _id, ...updateData } = data;

    if (!_id) {
      return NextResponse.json(
        { error: "Section ID is required for update" },
        { status: 400 }
      );
    }

    // Validar dados
    const validation = validateSchema(updateData, SectionSchema);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    // Gerar slug se necessário
    const slug =
      updateData.slug ||
      updateData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    // Verificar se slug já existe (exceto na própria section)
    const existing = await db.find("sections", { slug });
    const duplicateSlug = existing.find(
      (section) => section._id.toString() !== _id
    );

    if (duplicateSlug) {
      return NextResponse.json(
        { error: "Section with this slug already exists" },
        { status: 409 }
      );
    }

    // Atualizar section
    const sectionData = {
      ...updateData,
      slug,
      settings: {
        defaultView: "list",
        itemsPerPage: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
        ...updateData.settings,
      },
      updatedAt: new Date(),
    };

    const result = await db.updateOne("sections", { _id: _id }, sectionData);

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Buscar section atualizada
    const updatedSection = await db.findOne("sections", { _id: _id });

    return NextResponse.json({ section: updatedSection });
  } catch (error) {
    console.error("Error updating section:", error);
    return NextResponse.json(
      { error: "Failed to update section" },
      { status: 500 }
    );
  }
}
