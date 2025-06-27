import { NextResponse } from "next/server";
import { db } from "@/lib/db.js";
import { SectionSchema, validateSchema } from "@/schemas/index.js";
import { getCurrentAuth } from "@/lib/auth";

/**
 * GET /api/sections
 * Lista todas as sections do usuário (com triangulação por userId)
 */
export async function GET() {
  // TEMPORÁRIO: Tentar autenticação, mas não falhar se não conseguir
  const authData = getCurrentAuth();
  const userId = authData.userId || "temp_user_dev";

  console.log(
    "🔐 Sections GET: userId =",
    userId,
    authData.userId ? "(autenticado)" : "(modo dev)"
  );

  try {
    console.log(
      `🔍 Tentando buscar sections do usuário ${userId} no MongoDB...`
    );

    const sections = await db.find("sections", {
      userId: userId, // ← TRIANGULAÇÃO: só sections do usuário
    });

    console.log(
      `✅ MongoDB conectado! Encontradas ${sections.length} sections do usuário`
    );
    return NextResponse.json({ sections });
  } catch (error) {
    console.warn(
      "⚠️ Could not connect to DB for sections, using fallback data.",
      error.message
    );

    // FALLBACK: Dados mock para teste (com userId já obtido)
    const mockSections = [
      {
        _id: "mock1",
        name: "Seção Teste 1",
        slug: "secao-teste-1",
        contentTypeId: "ct1",
        userId: userId, // ← TRIANGULAÇÃO: associar ao usuário atual
        description: "Seção criada para teste",
        settings: { defaultView: "list", itemsPerPage: 20 },
        isActive: true,
        createdAt: new Date(),
      },
      {
        _id: "mock2",
        name: "Seção Teste 2",
        slug: "secao-teste-2",
        contentTypeId: "ct1",
        userId: userId, // ← TRIANGULAÇÃO: associar ao usuário atual
        description: "Segunda seção de teste",
        settings: { defaultView: "grid", itemsPerPage: 10 },
        isActive: true,
        createdAt: new Date(),
      },
    ];

    console.log(
      `🔄 Retornando ${mockSections.length} sections mock para usuário ${userId}`
    );
    return NextResponse.json({ sections: mockSections });
  }
}

/**
 * POST /api/sections
 * Cria uma nova section (com triangulação por userId)
 */
export async function POST(request) {
  try {
    const data = await request.json();

    // TEMPORÁRIO: Tentar autenticação, mas não falhar se não conseguir
    const authData = getCurrentAuth();
    const userId = authData.userId || "temp_user_dev";

    console.log(
      "🔐 Sections POST: userId =",
      userId,
      authData.userId ? "(autenticado)" : "(modo dev)"
    );

    // Adicionar userId aos dados para validação
    const dataWithUserId = { ...data, userId };

    // Validar dados
    const validation = validateSchema(dataWithUserId, SectionSchema);
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

    // Verificar se slug já existe NO ESCOPO DO USUÁRIO (triangulação)
    const existing = await db.findOne("sections", {
      slug,
      userId: userId, // ← TRIANGULAÇÃO: só verificar no escopo do usuário
    });

    if (existing) {
      return NextResponse.json(
        { error: "Section with this slug already exists" },
        { status: 409 }
      );
    }

    // Criar section com userId (triangulação)
    const sectionData = {
      ...data,
      slug,
      userId: userId, // ← TRIANGULAÇÃO: associar ao usuário
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
