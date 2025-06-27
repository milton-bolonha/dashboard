import { NextResponse } from "next/server";
import { db } from "@/lib/db.js";
import { SectionSchema, validateSchema } from "@/schemas/index.js";

/**
 * GET /api/sections/temp
 * API temporária SEM AUTENTICAÇÃO para desenvolvimento
 */
export async function GET() {
  try {
    console.log("🔍 TEMP: Tentando buscar sections no MongoDB...");

    const sections = await db.find("sections", {});

    console.log(
      `✅ TEMP: MongoDB conectado! Encontradas ${sections.length} sections`
    );
    return NextResponse.json({ sections });
  } catch (error) {
    console.warn(
      "⚠️ TEMP: Could not connect to DB, using fallback data.",
      error.message
    );

    // FALLBACK: Dados mock para teste
    const mockSections = [
      {
        _id: "temp_section1",
        name: "Blog Temporário",
        slug: "blog-temp",
        contentTypeId: "temp1",
        description: "Section temporária para desenvolvimento",
        settings: { defaultView: "list", itemsPerPage: 20 },
        isActive: true,
        createdAt: new Date(),
      },
      {
        _id: "temp_section2",
        name: "Páginas Temporárias",
        slug: "paginas-temp",
        contentTypeId: "temp2",
        description: "Section temporária para páginas",
        settings: { defaultView: "grid", itemsPerPage: 10 },
        isActive: true,
        createdAt: new Date(),
      },
    ];

    console.log(`🔄 TEMP: Retornando ${mockSections.length} sections mock`);
    return NextResponse.json({ sections: mockSections });
  }
}

/**
 * POST /api/sections/temp
 * API temporária SEM AUTENTICAÇÃO para desenvolvimento
 */
export async function POST(request) {
  try {
    const data = await request.json();

    // Usar userId temporário para desenvolvimento
    const tempUserId = "temp_user_dev";
    const dataWithUserId = { ...data, userId: tempUserId };

    const validation = validateSchema(dataWithUserId, SectionSchema);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    // Criar section (simulado)
    const newSection = {
      _id: "temp_" + Date.now(),
      ...data,
      slug,
      userId: tempUserId,
      settings: {
        defaultView: "list",
        itemsPerPage: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
        ...data.settings,
      },
      createdAt: new Date(),
    };

    console.log("✅ TEMP: Section criada (simulado):", newSection);

    return NextResponse.json({ section: newSection }, { status: 201 });
  } catch (error) {
    console.error("Error creating section:", error);
    return NextResponse.json(
      { error: "Failed to create section" },
      { status: 500 }
    );
  }
}
