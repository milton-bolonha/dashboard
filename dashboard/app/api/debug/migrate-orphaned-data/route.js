import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";

/**
 * POST /api/debug/migrate-orphaned-data
 * Migra dados sem workspaceId para o workspace especificado
 */
export async function POST(request) {
  try {
    const authData = await getCurrentAuth();
    const userId = authData.userId || "temp_user_dev";

    const { targetWorkspaceId } = await request.json();

    if (!targetWorkspaceId) {
      return NextResponse.json(
        { error: "targetWorkspaceId é obrigatório" },
        { status: 400 }
      );
    }

    console.log(
      `🚑 MIGRAÇÃO DE DADOS ÓRFÃOS para workspace: ${targetWorkspaceId}`
    );

    // Verificar se o workspace existe e o usuário tem acesso
    const workspace = await db.findOne("workspaces", {
      _id: new ObjectId(targetWorkspaceId),
      $or: [{ ownerId: userId }, { "members.userId": userId }],
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace não encontrado ou sem permissão" },
        { status: 404 }
      );
    }

    // 1. Migrar Content Types órfãos (sem workspaceId)
    const contentTypesResult = await db.updateMany(
      "contentTypes",
      {
        workspaceId: { $exists: false }, // Sem workspaceId
      },
      {
        workspaceId: new ObjectId(targetWorkspaceId),
      }
    );

    console.log(
      `✅ Content Types migrados: ${contentTypesResult.modifiedCount}`
    );

    // 2. Migrar Sections órfãs (sem workspaceId)
    const sectionsResult = await db.updateMany(
      "sections",
      {
        workspaceId: { $exists: false }, // Sem workspaceId
      },
      {
        workspaceId: new ObjectId(targetWorkspaceId),
      }
    );

    console.log(`✅ Sections migradas: ${sectionsResult.modifiedCount}`);

    // 3. Migrar Items órfãos (sem workspaceId)
    const itemsResult = await db.updateMany(
      "items",
      {
        workspaceId: { $exists: false }, // Sem workspaceId
      },
      {
        workspaceId: new ObjectId(targetWorkspaceId),
      }
    );

    console.log(`✅ Items migrados: ${itemsResult.modifiedCount}`);

    // 4. Limpar relacionamentos quebrados
    // Deletar sections que referenciam content types inexistentes
    const allContentTypes = await db.find("contentTypes", {
      workspaceId: new ObjectId(targetWorkspaceId),
    });
    const validContentTypeIds = allContentTypes.map((ct) => ct._id.toString());

    const sectionsToDelete = await db.find("sections", {
      workspaceId: new ObjectId(targetWorkspaceId),
      contentTypeId: { $nin: validContentTypeIds },
    });

    let deletedSections = 0;
    for (const section of sectionsToDelete) {
      await db.deleteOne("sections", { _id: section._id });
      deletedSections++;
    }

    console.log(
      `🗑️ Sections com relacionamentos quebrados deletadas: ${deletedSections}`
    );

    const migrationSummary = {
      migratedContentTypes: contentTypesResult.modifiedCount,
      migratedSections: sectionsResult.modifiedCount,
      migratedItems: itemsResult.modifiedCount,
      deletedBrokenSections: deletedSections,
      targetWorkspace: {
        id: workspace._id,
        name: workspace.name,
      },
    };

    console.log("🎉 MIGRAÇÃO CONCLUÍDA:", migrationSummary);

    return NextResponse.json({
      status: "success",
      message: "Migração de dados órfãos concluída com sucesso",
      ...migrationSummary,
    });
  } catch (error) {
    console.error("❌ Erro na migração:", error);
    return NextResponse.json(
      { error: "Falha na migração", details: error.message },
      { status: 500 }
    );
  }
}
