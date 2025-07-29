import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { SectionSchema, validateSchema } from "@/schemas/index.js";
import { ObjectId } from "mongodb";
import { getCurrentAuth } from "@/lib/auth";

/**
 * Helper para obter workspace do usuário
 */
async function getCurrentWorkspace(userId, requestedWorkspaceId = null) {
  try {
    let workspace;

    // Se foi especificado um workspace, usar esse
    if (requestedWorkspaceId) {
      try {
        const workspaceObjectId = new ObjectId(requestedWorkspaceId);

        workspace = await db.findOne("workspaces", {
          _id: workspaceObjectId,
          $or: [{ ownerId: userId }, { "members.userId": userId }],
        });

        if (workspace) {
          console.log(
            `🎯 Sections EDIT: Usando workspace específico: ${workspace.name} (${workspace._id})`
          );
          return workspace;
        } else {
          console.log(
            `⚠️ Sections EDIT: Workspace ${requestedWorkspaceId} não encontrado ou sem permissão`
          );
        }
      } catch (error) {
        console.log(
          `❌ Sections EDIT: Erro ao converter workspaceId para ObjectId: ${requestedWorkspaceId}`,
          error
        );
      }
    }

    // Fallback: buscar qualquer workspace do usuário
    workspace = await db.findOne("workspaces", {
      $or: [{ ownerId: userId }, { "members.userId": userId }],
    });

    if (!workspace) {
      throw new Error("Nenhum workspace encontrado para o usuário");
    }

    console.log(
      `🏢 Sections EDIT: Workspace selecionado: ${workspace.name} (${workspace._id})`
    );
    return workspace;
  } catch (error) {
    console.error("❌ Sections EDIT: Erro ao obter workspace:", error);
    throw error;
  }
}

/**
 * GET /api/sections/[id]
 * Pega uma section específica e determina a estratégia de visualização.
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const section = await db.findOne("sections", { _id: new ObjectId(id) });
    if (!section) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    // Após encontrar a seção, determinar a estratégia de visualização
    const items = await db.find("items", { sectionId: id });

    let strategy = "singleton"; // Default
    if (items.length > 1) {
      const firstContentTypeId = items[0].contentTypeId;
      const allSameContentType = items.every(
        (item) => item.contentTypeId === firstContentTypeId
      );
      strategy = allSameContentType ? "collection" : "grouping";
    }
    // Se houver apenas 1 item, a estratégia permanece 'singleton'.

    return NextResponse.json({ section: { ...section, strategy } });
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
    const auth = await getCurrentAuth();
    const { userId } = auth;
    const { id: sectionId } = await params; // ✅ CORREÇÃO: Await params
    const data = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!sectionId || !ObjectId.isValid(sectionId)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // Remover _id dos dados para evitar erro de imutabilidade
    delete data._id;

    // ✅ CORREÇÃO: Obter o workspaceId do header
    const workspaceId = request.headers.get("x-workspace-id");
    const workspace = await getCurrentWorkspace(userId, workspaceId);

    // ✅ CORREÇÃO: Gerar slug ANTES da validação se necessário
    const slug =
      data.slug ||
      (data.name
        ? data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
        : "");

    // 🐛 DEBUG: Logs detalhados para edição
    console.log("🔍 === DEBUG SECTION EDIT ===");
    console.log("🔍 ID:", sectionId);
    console.log("🔍 userId:", userId);
    console.log("🔍 workspaceId:", workspace._id);
    console.log("🔍 Dados recebidos:", JSON.stringify(data, null, 2));
    console.log("🔍 slug gerado:", slug);

    // ✅ CORREÇÃO: Adicionar userId, workspaceId e slug aos dados antes da validação
    const dataWithAuth = {
      ...data,
      userId,
      workspaceId: workspace._id, // <-- CORREÇÃO: Passar o ObjectId, não a string
      slug,
    };

    // Remover o campo obsoleto antes de validar e atualizar
    delete dataWithAuth.isActive;

    console.log(
      "🔍 Dados para validação (EDIT):",
      JSON.stringify(dataWithAuth, null, 2)
    );

    const validation = validateSchema(dataWithAuth, SectionSchema);
    console.log("🔍 Resultado da validação:", validation);

    if (!validation.isValid) {
      console.error("❌ Validação falhou:", validation.errors);
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const updatedSection = await db.updateOne(
      "sections",
      {
        _id: new ObjectId(sectionId),
        userId, // Garantir que o usuário só possa editar suas próprias seções
      },
      dataWithAuth // ✅ CORREÇÃO: Passar o objeto diretamente, pois db.js já adiciona o $set
    );

    if (updatedSection.matchedCount === 0) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const finalUpdatedSection = await db.findOne("sections", {
      _id: new ObjectId(sectionId),
    });
    return NextResponse.json({ section: finalUpdatedSection });
  } catch (error) {
    const { id } = await params; // Adicionando await aqui também
    console.error(`Error updating section ${id}:`, error);
    return NextResponse.json(
      { error: "Failed to update section" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/sections/[id]
 * Deleta uma section e todos os seus items associados.
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const auth = await getCurrentAuth();
    const { userId } = auth;

    console.log(`🔐 DEBUG: Auth result:`, auth);
    console.log(`🔐 DEBUG: UserID extraído: ${userId}`);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid Section ID" },
        { status: 400 }
      );
    }

    const sectionId = new ObjectId(id);

    console.log(`🔍 DEBUG: Procurando section com ID: ${id}`);
    console.log(`🔍 DEBUG: UserID atual: ${userId}`);

    // 1. Primeiro, vamos verificar se a section existe (sem filtro de userId)
    const sectionExists = await db.findOne("sections", {
      _id: sectionId,
    });

    if (!sectionExists) {
      console.log(`❌ DEBUG: Section ${id} não encontrada no banco`);
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    console.log(`✅ DEBUG: Section encontrada:`, {
      _id: sectionExists._id,
      name: sectionExists.name,
      userId: sectionExists.userId,
      workspaceId: sectionExists.workspaceId,
    });

    // 2. Verificar se a section pertence ao usuário (TEMPORÁRIO: mais permissivo)
    const section = await db.findOne("sections", {
      _id: sectionId,
      // userId: userId, // Comentado temporariamente para debug
    });

    if (!section) {
      console.log(
        `❌ DEBUG: Section ${id} não encontrada mesmo sem filtro de userId`
      );
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    console.log(`✅ DEBUG: Section encontrada sem filtro de userId:`, {
      _id: section._id,
      name: section.name,
      userId: section.userId,
      workspaceId: section.workspaceId,
    });

    console.log(`🗑️ Iniciando deleção da section: ${section.name} (${id})`);

    // 2. Deleção em cascata dos items
    const itemsResult = await db.deleteMany("items", { sectionId: id }); // Usar `id` como string se ele for usado assim no schema
    console.log(`   - Deletados ${itemsResult.deletedCount} items.`);

    // 3. Deletar a Section
    const sectionResult = await db.deleteOne("sections", { _id: sectionId });
    console.log(`   - Deletada ${sectionResult.deletedCount} section.`);

    if (sectionResult.deletedCount === 0) {
      throw new Error("Falha ao deletar o documento da section.");
    }

    return NextResponse.json({
      message: "Section and all associated items deleted successfully.",
      details: {
        deletedItems: itemsResult.deletedCount,
      },
    });
  } catch (error) {
    console.error("Error deleting section:", error);
    return NextResponse.json(
      { error: "Failed to delete section" },
      { status: 500 }
    );
  }
}
