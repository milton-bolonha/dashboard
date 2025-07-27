import { NextResponse } from "next/server";
import { db } from "@/lib/db.js";
import { SectionSchema, validateSchema } from "@/schemas/index.js";
import { getCurrentAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { checkPlan } from "@/lib/plan-check";
import {
  validateSlug,
  generateSlug,
  isSlugUnique,
} from "@/lib/slug-validation.js";

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
  try {
    const { userId } = await getCurrentAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar se há um workspace específico no header
    const workspaceId = request.headers.get("x-workspace-id");

    const workspace = await getCurrentWorkspace(userId, workspaceId);
    if (!workspace) {
      return NextResponse.json({ sections: [] }); // Retorna array vazio se não houver workspace
    }

    const sections = await db.find("sections", {
      workspaceId: workspace._id.toString(),
    });

    console.log(
      `✅ Encontradas ${sections.length} sections para workspace ${workspace.name}`
    );
    return NextResponse.json({ sections });
  } catch (error) {
    console.error("Erro ao listar sections:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sections
 * Cria uma nova section no workspace atual
 */
export async function POST(request) {
  try {
    const data = await request.json();
    const { userId } = await getCurrentAuth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const workspace = await getCurrentWorkspace(userId); // ✅ CORREÇÃO: Definir workspace
    if (!workspace) {
      return NextResponse.json(
        { error: "No workspace found for this user." },
        { status: 403 }
      );
    }

    // --- Verificação de Plano ---
    const isPro = await checkPlan(userId, "pro");
    if (!isPro) {
      const sectionCount = await db.count("sections", {
        workspaceId: workspace._id.toString(),
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

    const slug = await validateSlug(data, "sections", workspace._id.toString());

    const dataWithAuth = {
      ...data,
      userId,
      workspaceId: workspace._id.toString(),
      slug,
    };

    // 🐛 DEBUG: Logs detalhados
    console.log("🔍 === DEBUG SECTION ===");
    console.log("🔍 Dados recebidos:", JSON.stringify(data, null, 2));
    console.log("🔍 userId:", userId);
    console.log("🔍 workspaceId:", workspace._id);
    console.log("🔍 slug gerado:", slug);

    // Adicionar userId, workspaceId e slug aos dados
    const dataWithWorkspace = {
      ...dataWithAuth, // slug já está incluído
      settings: {
        defaultView: "list",
        itemsPerPage: 20,
        sortBy: "createdAt",
        sortOrder: "desc",
        ...data.settings,
      },
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

    // ✅ MELHORIA: Verificar slug único usando função otimizada
    const isUnique = await isSlugUnique(slug, workspace._id, "sections");

    if (!isUnique) {
      return NextResponse.json(
        { error: "Section with this slug already exists in this workspace" },
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
