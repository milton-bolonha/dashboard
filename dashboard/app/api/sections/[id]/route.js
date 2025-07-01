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
 * Pega uma section específica
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

    return NextResponse.json({ section });
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
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const data = await request.json();

    // ✅ CORREÇÃO: Obter autenticação e workspace (igual ao POST)
    const authData = await getCurrentAuth();
    const userId = authData.userId || "temp_user_dev";
    const workspaceId = request.headers.get("x-workspace-id");

    // Obter workspace atual
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
    console.log("🔍 ID:", id);
    console.log("🔍 userId:", userId);
    console.log("🔍 workspaceId:", workspace._id);
    console.log("🔍 Dados recebidos:", JSON.stringify(data, null, 2));
    console.log("🔍 slug gerado:", slug);

    // ✅ CORREÇÃO: Adicionar userId, workspaceId e slug aos dados antes da validação
    const dataWithAuth = {
      ...data,
      userId,
      workspaceId: workspace._id,
      slug,
    };

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

    const result = await db.updateOne(
      "sections",
      { _id: new ObjectId(id) },
      dataWithAuth // ✅ Usar dados com userId, workspaceId e slug incluídos
    );
    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Section not found" }, { status: 404 });
    }

    const updatedSection = await db.findOne("sections", {
      _id: new ObjectId(id),
    });
    return NextResponse.json({ section: updatedSection });
  } catch (error) {
    console.error(`Error updating section ${params.id}:`, error);
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
    const { id } = params;
    const { userId } = await getCurrentAuth();

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

    // 1. Verificar se a section existe e pertence ao usuário
    // (A verificação do workspace é uma camada extra de segurança)
    const section = await db.findOne("sections", {
      _id: sectionId,
      userId: userId,
    });

    if (!section) {
      return NextResponse.json(
        { error: "Section not found or you don't have permission" },
        { status: 404 }
      );
    }

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
