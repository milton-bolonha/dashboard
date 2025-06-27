import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ContentTypeSchema, validateSchema } from "@/schemas/index.js";
import { ObjectId } from "mongodb";

/**
 * GET /api/content-types/temp
 * API temporária SEM AUTENTICAÇÃO para desenvolvimento
 */
export async function GET() {
  try {
    console.log("🔍 TEMP: Tentando buscar content-types no MongoDB...");

    const contentTypes = await db.find("contentTypes", {});

    console.log(
      `✅ TEMP: MongoDB conectado! Encontrados ${contentTypes.length} content-types`
    );
    return NextResponse.json({ contentTypes });
  } catch (error) {
    console.warn(
      "⚠️ TEMP: Could not connect to DB, using fallback data.",
      error.message
    );

    // FALLBACK: Content Types mock para teste
    const mockContentTypes = [
      {
        _id: "temp1",
        name: "Página Temporária",
        slug: "pagina-temp",
        description: "Content type temporário para desenvolvimento",
        addons: [
          {
            id: "subtitulo",
            name: "Subtítulo",
            type: "textInput",
            required: false,
          },
          {
            id: "conteudo",
            name: "Conteúdo Principal",
            type: "textarea",
            required: true,
          },
        ],
        isActive: true,
        createdAt: new Date(),
      },
      {
        _id: "temp2",
        name: "Artigo Temporário",
        slug: "artigo-temp",
        description: "Content type temporário para blog",
        addons: [
          {
            id: "resumo",
            name: "Resumo",
            type: "textarea",
            required: false,
          },
          {
            id: "imagem",
            name: "Imagem de Capa",
            type: "imageUpload",
            required: false,
          },
        ],
        isActive: true,
        createdAt: new Date(),
      },
    ];

    console.log(
      `🔄 TEMP: Retornando ${mockContentTypes.length} content-types mock`
    );
    return NextResponse.json({ contentTypes: mockContentTypes });
  }
}

/**
 * POST /api/content-types/temp
 * API temporária SEM AUTENTICAÇÃO para desenvolvimento
 */
export async function POST(request) {
  try {
    const data = await request.json();
    const { createDefaultSection = true, ...contentTypeData } = data;

    // Usar userId temporário para desenvolvimento
    const tempUserId = "temp_user_dev";
    const dataWithUserId = { ...contentTypeData, userId: tempUserId };

    const validation = validateSchema(dataWithUserId, ContentTypeSchema);
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

    // 1. Criar o Content Type (temporário)
    const newContentType = {
      _id: new ObjectId().toString(),
      ...contentTypeData,
      slug,
      userId: tempUserId,
      createdAt: new Date(),
    };

    console.log("✅ TEMP: Content type criado (simulado):", newContentType);

    // 2. Se aplicável, simular criação da Section correspondente
    if (createDefaultSection) {
      console.log("✅ TEMP: Section correspondente criada (simulado)");
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
