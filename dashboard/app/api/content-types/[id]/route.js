import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ContentTypeSchema, validateSchema } from "@/schemas/index.js";
import { ObjectId } from "mongodb";
import { getCurrentAuth } from "@/lib/auth";
import { logDebug, logError } from "@/lib/logger";

/**
 * Helper para obter workspace do usuário (cria se não existir)
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
          logDebug(
            `Usando workspace específico: ${workspace.name} (${workspace._id})`
          );
          return workspace;
        } else {
          logError(
            `Workspace ${requestedWorkspaceId} não encontrado ou usuário ${userId} sem permissão.`
          );
        }
      } catch (error) {
        logError(
          `Erro ao converter workspaceId para ObjectId: ${requestedWorkspaceId}`,
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

    logDebug(
      `Workspace selecionado (fallback): ${workspace.name} (${workspace._id})`
    );
    return workspace;
  } catch (error) {
    logError("Erro ao obter workspace:", error);
    throw error;
  }
}

/**
 * GET /api/content-types/[id]
 * Pega um content type específico
 */
export async function GET(request, { params }) {
  try {
    const { userId } = await getCurrentAuth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

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

    // TODO: Adicionar verificação se o usuário tem acesso a este content type (via workspace)
    return NextResponse.json({ contentType });
  } catch (error) {
    logError(`Error loading content type ${params.id}:`, error);
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
    const { userId } = await getCurrentAuth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    const data = await request.json();
    const workspaceId = request.headers.get("x-workspace-id");
    const workspace = await getCurrentWorkspace(userId, workspaceId);

    const slug =
      data.slug ||
      (data.name
        ? data.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "")
        : "");

    logDebug("Iniciando edição de Content Type", {
      id,
      userId,
      workspaceId: workspace._id,
    });

    const dataWithAuth = {
      ...data,
      userId,
      workspaceId: workspace._id,
      slug,
    };

    const validation = validateSchema(dataWithAuth, ContentTypeSchema);
    if (!validation.isValid) {
      logError("Falha na validação ao editar Content Type:", validation.errors);
      return NextResponse.json(
        { error: "Validation failed", details: validation.errors },
        { status: 400 }
      );
    }

    const { userId: _, ...updateData } = dataWithAuth; // Não atualizar o criador original

    const result = await db.updateOne(
      "contentTypes",
      { _id: new ObjectId(id) },
      updateData
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
    logError(`Error updating content type ${params.id}:`, error);
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
    const { userId } = await getCurrentAuth();
    if (!userId) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { id } = await params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
    }

    // BUG CRÍTICO: Esta checagem está errada. Se contentTypeId for string, `new ObjectId(id)` não vai funcionar
    // A query correta depende de como o `contentTypeId` está salvo na collection `sections`
    // Assumindo que foi salvo como string, a query deveria ser: { contentTypeId: id }
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

    const result = await db.deleteOne("contentTypes", {
      _id: new ObjectId(id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "Content type not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { message: "Content type deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    logError(`Error deleting content type ${params.id}:`, error);
    return NextResponse.json(
      { error: "Failed to delete content type" },
      { status: 500 }
    );
  }
}
