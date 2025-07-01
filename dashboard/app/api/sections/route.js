import { NextResponse } from "next/server";
import { db } from "@/lib/db.js";
import { SectionSchema, validateSchema } from "@/schemas/index.js";
import { getCurrentAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { checkPlan } from "#lib/plan-check.js";

/**
 * Helper para obter workspace atual do usuário
 */
async function getCurrentWorkspace(userId, requestedWorkspaceId = null) {
  try {
    let workspace;

    // Se foi especificado um workspace, usar esse
    if (requestedWorkspaceId) {
      // ✅ CORREÇÃO: Converter string para ObjectId
      const workspaceObjectId = new ObjectId(requestedWorkspaceId);

      workspace = await db.findOne("workspaces", {
        _id: workspaceObjectId, // ← FIX: Usar ObjectId ao invés de string
        $or: [{ ownerId: userId }, { "members.userId": userId }],
      });

      if (workspace) {
        console.log(
          `🎯 Usando workspace específico: ${workspace.name} (${workspace._id})`
        );
        return workspace;
      } else {
        console.log(
          `⚠️ Workspace ${requestedWorkspaceId} não encontrado ou sem permissão`
        );
      }
    }

    // Fallback: buscar qualquer workspace do usuário
    workspace = await db.findOne("workspaces", {
      $or: [{ ownerId: userId }, { "members.userId": userId }],
    });

    if (!workspace) {
      console.log(`🔧 Criando workspace automático para usuário: ${userId}`);

      const result = await db.insertOne("workspaces", {
        name: "Meu Workspace",
        slug: `ws-${userId.slice(-8)}-${Date.now()}`,
        ownerId: userId,
        plan: "free",
        members: [{ userId, role: "owner", permissions: { canExport: true } }],
        limits: {
          maxUsers: 1,
          maxContentTypes: 3,
          maxSections: 5,
          maxItems: 100,
        },
        isActive: true,
        createdAt: new Date(),
      });

      workspace = await db.findOne("workspaces", { _id: result.insertedId });
    }

    console.log(
      `🏢 Workspace selecionado: ${workspace.name} (${workspace._id})`
    );
    return workspace;
  } catch (error) {
    console.error("❌ Erro ao obter workspace:", error);
    throw error;
  }
}

/**
 * GET /api/sections
 * Lista todas as sections do workspace atual
 */
export async function GET(request) {
  const authData = await getCurrentAuth();
  const userId = authData.userId || "temp_user_dev";

  // Obter workspace ID do header (enviado pelo frontend)
  const workspaceId = request.headers.get("x-workspace-id");

  console.log("🔐 Sections GET: userId =", userId);
  console.log("🏢 Workspace solicitado:", workspaceId);
  console.log(
    "📋 Headers recebidos:",
    Object.fromEntries(request.headers.entries())
  );

  try {
    // Obter workspace atual (específico ou fallback)
    const workspace = await getCurrentWorkspace(userId, workspaceId);
    console.log(`🎯 Workspace em uso: ${workspace.name} (${workspace._id})`);

    const sections = await db.find("sections", {
      userId: userId,
      workspaceId: workspace._id, // ← WORKSPACE: filtrar por workspace específico
    });

    console.log(
      `✅ Query executada: { userId: "${userId}", workspaceId: "${workspace._id}" }`
    );
    console.log(
      `✅ Encontradas ${sections.length} sections para workspace ${workspace.name}`
    );

    // Debug: Mostrar workspaceId de cada section
    sections.forEach((section, index) => {
      console.log(
        `  ${index + 1}. ${section.name} - workspaceId: ${section.workspaceId}`
      );
    });

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
 * Cria uma nova section no workspace atual
 */
export async function POST(request) {
  try {
    const data = await request.json();

    const authData = await getCurrentAuth();
    const userId = authData.userId || "temp_user_dev";

    const workspaceId = request.headers.get("x-workspace-id");
    const workspace = await getCurrentWorkspace(userId, workspaceId);

    // --- Verificação de Plano ---
    const isPro = await checkPlan("pro"); // Verifica se o plano é 'pro' ou superior
    if (!isPro) {
      // Lógica para plano 'free'
      const sectionCount = await db.count("sections", {
        workspaceId: workspace._id,
      });
      const FREE_PLAN_LIMIT = 3;

      if (sectionCount >= FREE_PLAN_LIMIT) {
        return NextResponse.json(
          {
            error: "Limite de seções atingido para o plano gratuito.",
            code: "PLAN_LIMIT_REACHED",
          },
          { status: 403 }
        );
      }
    }
    // --- Fim da Verificação de Plano ---

    // ✅ CORREÇÃO: Gerar slug ANTES da validação
    const slug =
      data.slug ||
      data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    // 🐛 DEBUG: Logs detalhados
    console.log("🔍 === DEBUG SECTION ===");
    console.log("🔍 Dados recebidos:", JSON.stringify(data, null, 2));
    console.log("🔍 userId:", userId);
    console.log("🔍 workspaceId:", workspace._id);
    console.log("🔍 slug gerado:", slug);

    // Adicionar userId, workspaceId e slug aos dados
    const dataWithWorkspace = {
      ...data,
      userId,
      workspaceId: workspace._id,
      slug,
    };

    console.log(
      "🔍 Dados para validação:",
      JSON.stringify(dataWithWorkspace, null, 2)
    );

    const validation = validateSchema(dataWithWorkspace, SectionSchema);
    if (!validation.isValid) {
      console.error("❌ Falha na validação:", validation.errors);
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    // Verificar se slug já existe no workspace
    const existing = await db.find("sections", {
      slug,
      userId: userId,
      workspaceId: workspace._id, // ← WORKSPACE: verificar no escopo do workspace
    });

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "Section with this slug already exists" },
        { status: 409 }
      );
    }

    // Usar o objeto já validado que contém o workspaceId e slug
    const sectionData = {
      ...dataWithWorkspace, // slug já está incluído
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

    return NextResponse.json({ section: newSection });
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
