import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ContentTypeSchema, validateSchema } from "@/schemas/index.js";
import { ObjectId } from "mongodb";
import { getCurrentAuth } from "@/lib/auth"; // ✅ CORREÇÃO: Importar auth

/**
 * Helper para obter workspace do usuário (cria se não existir)
 */
async function getCurrentWorkspace(userId, requestedWorkspaceId = null) {
  try {
    let workspace;

    // Se foi especificado um workspace, usar esse
    if (requestedWorkspaceId) {
      try {
        // ✅ CORREÇÃO: Converter string para ObjectId
        const workspaceObjectId = new ObjectId(requestedWorkspaceId);

        workspace = await db.findOne("workspaces", {
          _id: workspaceObjectId, // ← FIX: Usar ObjectId ao invés de string
          $or: [{ ownerId: userId }, { "members.userId": userId }],
        });

        if (workspace) {
          console.log(
            `🎯 Content-types EDIT: Usando workspace específico: ${workspace.name} (${workspace._id})`
          );
          return workspace;
        } else {
          console.log(
            `⚠️ Content-types EDIT: Workspace ${requestedWorkspaceId} não encontrado ou sem permissão`
          );
        }
      } catch (error) {
        console.log(
          `❌ Content-types EDIT: Erro ao converter workspaceId para ObjectId: ${requestedWorkspaceId}`,
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
      `🏢 Content-types EDIT: Workspace selecionado: ${workspace.name} (${workspace._id})`
    );
    return workspace;
  } catch (error) {
    console.error("❌ Content-types EDIT: Erro ao obter workspace:", error);
    throw error;
  }
}

/**
 * GET /api/content-types/[id]
 * Pega um content type específico
 */
export async function GET(request, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const contentType = await db.findOne("contentTypes", {
      _id: new ObjectId(id),
    });
    if (!contentType) {
      return NextResponse.json(
        { error: "Content type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ contentType });
  } catch (error) {
    console.error(`Error loading content type ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to load content type" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/content-types/[id]
 * Atualiza um content type
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

    // ✅ CORREÇÃO: Gerar slug ANTES da validação (igual ao POST)
    const slug =
      data.slug ||
      (data.name
        ? data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
        : "");

    // 🐛 DEBUG: Logs detalhados para edição
    console.log("🔍 === DEBUG CONTENT TYPE EDIT ===");
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

    const validation = validateSchema(dataWithAuth, ContentTypeSchema);
    if (!validation.isValid) {
      console.error("❌ Falha na validação (EDIT):", validation.errors);
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const result = await db.updateOne(
      "contentTypes",
      { _id: new ObjectId(id) },
      dataWithAuth // ✅ Usar dados com userId, workspaceId e slug incluídos
    );
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Content type not found" },
        { status: 404 }
      );
    }

    const updatedContentType = await db.findOne("contentTypes", {
      _id: new ObjectId(id),
    });
    return NextResponse.json({ contentType: updatedContentType });
  } catch (error) {
    console.error(`Error updating content type ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to update content type" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/content-types/[id]
 * Deleta um content type
 */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const result = await db.deleteOne("contentTypes", {
      _id: new ObjectId(id),
    });
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Content type not found" },
        { status: 404 }
      );
    }

    // Verificação de deleção em cascata
    // Não permitir deletar content type se tiver sections usando ele
    const sectionsCount = await db.count("sections", {
      contentTypeId: id,
    });

    if (sectionsCount > 0) {
      return NextResponse.json(
        {
          error: `Não é possível deletar este Content Type. Existem ${sectionsCount} section(s) usando ele.`,
          details: {
            sectionsCount,
            action: "delete_sections_first",
            message:
              "Primeiro delete ou transfira as sections para outro Content Type",
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Content type deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error deleting content type ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to delete content type" },
      { status: 500 }
    );
  }
}
