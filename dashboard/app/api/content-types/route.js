import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ContentTypeSchema, validateSchema } from "@/schemas/index.js";
import { ObjectId } from "mongodb";
import { getCurrentAuth } from "@/lib/auth";

/**
 * GET /api/content-types
 * Lista todos os content types do usuário (com triangulação por userId)
 */
export async function GET() {
  // ✅ CORRIGIDO: Usar await com getCurrentAuth
  const authData = await getCurrentAuth();
  const userId = authData.userId || "temp_user_dev";

  console.log(
    "🔐 Content-types GET: userId =",
    userId,
    authData.userId ? "(autenticado)" : "(modo dev)"
  );

  try {
    console.log(
      `🔍 Tentando buscar content-types do usuário ${userId} no MongoDB...`
    );

    const contentTypes = await db.find("contentTypes", {
      userId: userId, // ← TRIANGULAÇÃO: só content types do usuário
    });

    console.log(
      `✅ MongoDB conectado! Encontrados ${contentTypes.length} content-types do usuário`
    );
    return NextResponse.json({ contentTypes });
  } catch (error) {
    console.warn(
      "⚠️ Could not connect to DB for content-types, using fallback data.",
      error.message
    );

    // FALLBACK: Content Types mock para teste
    const mockContentTypes = [
      {
        _id: "temp1",
        name: "Página Temporária",
        slug: "pagina-temp",
        description: "Content type temporário para desenvolvimento",
        userId: userId, // ← TRIANGULAÇÃO: associar ao usuário atual
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
    ];

    console.log(
      `🔄 Retornando ${mockContentTypes.length} content-types mock para usuário ${userId}`
    );
    return NextResponse.json({ contentTypes: mockContentTypes });
  }
}

/**
 * POST /api/content-types
 * Cria um novo content type e, por padrão, uma section correspondente (com triangulação por userId)
 */
export async function POST(request) {
  try {
    const data = await request.json();
    const { createDefaultSection = true, ...contentTypeData } = data;

    // ✅ CORRIGIDO: Usar await com getCurrentAuth
    const authData = await getCurrentAuth();
    const userId = authData.userId || "temp_user_dev";

    console.log(
      "🔐 Content-types POST: userId =",
      userId,
      authData.userId ? "(autenticado)" : "(modo dev)"
    );

    // Adicionar userId aos dados para validação
    const dataWithUserId = { ...contentTypeData, userId };

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

    // Verificar se slug já existe NO ESCOPO DO USUÁRIO (triangulação)
    const existing = await db.findOne("contentTypes", {
      slug,
      userId: userId, // ← TRIANGULAÇÃO: só verificar no escopo do usuário
    });

    if (existing) {
      return NextResponse.json(
        { error: "Content type with this slug already exists" },
        { status: 409 }
      );
    }

    // 1. Criar o Content Type com userId (triangulação)
    const result = await db.insertOne("contentTypes", {
      ...contentTypeData,
      slug,
      userId: userId, // ← TRIANGULAÇÃO: associar ao usuário
    });

    const newContentType = await db.findOne("contentTypes", {
      _id: result.insertedId,
    });

    // 2. Se solicitado, criar uma Section padrão para este Content Type
    let newSection = null;
    if (createDefaultSection) {
      try {
        const sectionSlug =
          contentTypeData.slug ||
          contentTypeData.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");

        const sectionResult = await db.insertOne("sections", {
          name: contentTypeData.name,
          slug: sectionSlug,
          contentTypeId: result.insertedId.toString(),
          userId: userId, // ← TRIANGULAÇÃO: associar ao usuário
          description: `Section criada automaticamente para ${contentTypeData.name}`,
          settings: {
            defaultView: "list",
            itemsPerPage: 20,
            sortBy: "createdAt",
            sortOrder: "desc",
          },
        });

        newSection = await db.findOne("sections", {
          _id: sectionResult.insertedId,
        });

        console.log(
          `✅ Section padrão criada: "${contentTypeData.name}" → /${sectionSlug}`
        );
      } catch (sectionError) {
        console.warn("⚠️ Erro ao criar section padrão:", sectionError.message);
        // Não falhar a operação se a section não for criada
      }
    }

    return NextResponse.json({
      contentType: newContentType,
      section: newSection,
      message: createDefaultSection
        ? "Content Type e Section criados com sucesso"
        : "Content Type criado com sucesso",
    });
  } catch (error) {
    console.error("Error creating content type:", error);
    return NextResponse.json(
      { error: "Failed to create content type" },
      { status: 500 }
    );
  }
}
