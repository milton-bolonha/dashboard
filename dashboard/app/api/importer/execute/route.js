import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";

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
      console.log(`🔧 Nenhum workspace encontrado para usuário: ${userId}`);
      return null;
    }

    console.log(
      `🏢 Workspace selecionado: ${workspace.name} (${workspace._id})`
    );
    return workspace;
  } catch (error) {
    console.error("❌ Erro ao obter workspace:", error);
    return null;
  }
}

export async function POST(request) {
  try {
    const { userId } = await getCurrentAuth(request);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { importPlan, workspaceId } = body;

    if (!importPlan) {
      return NextResponse.json(
        { error: "Plano de importação é obrigatório" },
        { status: 400 }
      );
    }

    const workspace = await getCurrentWorkspace(userId, workspaceId);
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace não encontrado" },
        { status: 404 }
      );
    }

    const results = await executeImportPlan(
      importPlan,
      workspace._id.toString(),
      userId
    );

    return NextResponse.json({
      success: true,
      message: `Importação concluída! ${results.contentTypesCreated} ContentTypes, ${results.sectionsCreated} Sections e ${results.itemsCreated} Items criados.`,
      results,
    });
  } catch (error) {
    console.error("Erro na execução:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

async function executeImportPlan(importPlan, workspaceId, userId) {
  const results = {
    contentTypesCreated: 0,
    sectionsCreated: 0,
    itemsCreated: 0,
    errors: [],
  };
  const contentTypeCache = new Map();
  const sectionCache = new Map();

  for (const filePlan of importPlan.files) {
    try {
      // 1. Garantir que o ContentType existe
      let contentTypeId = contentTypeCache.get(filePlan.contentType.slug);
      if (!contentTypeId) {
        const existingCt = await db.findOne("contentTypes", {
          workspaceId,
          slug: filePlan.contentType.slug,
        });

        if (existingCt) {
          contentTypeId = existingCt._id.toString();
        } else {
          const newContentType = await db.insertOne("contentTypes", {
            ...filePlan.contentType,
            workspaceId,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          contentTypeId = newContentType.insertedId.toString();
          results.contentTypesCreated++;
        }
        contentTypeCache.set(filePlan.contentType.slug, contentTypeId);
      }

      // 2. Garantir que a Seção existe
      let sectionId = sectionCache.get(filePlan.section.slug);
      if (!sectionId) {
        const existingSection = await db.findOne("sections", {
          workspaceId,
          slug: filePlan.section.slug,
        });

        if (existingSection) {
          sectionId = existingSection._id.toString();
        } else {
          const newSection = await db.insertOne("sections", {
            ...filePlan.section,
            contentTypeId,
            workspaceId,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          sectionId = newSection.insertedId.toString();
          results.sectionsCreated++;
        }
        sectionCache.set(filePlan.section.slug, sectionId);
      }

      // 3. Criar Itens com base na estratégia
      for (const itemData of filePlan.itemsData) {
        // Usar o nome do arquivo como slug para singletons, ou um campo 'slug'/'name'/'title' para coleções
        const itemSlug =
          filePlan.importStrategy === "singleton"
            ? filePlan.fileName
            : itemData.slug || itemData.name || filePlan.fileName;

        const itemTitle =
          itemData.name ||
          itemData.title ||
          capitalize(itemSlug.replace(/-/g, " "));

        const existingItem = await db.findOne("items", {
          workspaceId,
          sectionId,
          slug: itemSlug,
        });

        if (existingItem) {
          continue; // Pular se o item já existe
        }

        await db.insertOne("items", {
          title: itemTitle,
          slug: itemSlug,
          data: itemData,
          sectionId,
          contentTypeId,
          workspaceId,
          userId,
          status: "published",
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        results.itemsCreated++;
      }
    } catch (error) {
      console.error(
        `Erro ao processar o arquivo ${filePlan.relativePath}:`,
        error
      );
      results.errors.push(`Arquivo ${filePlan.relativePath}: ${error.message}`);
    }
  }

  return results;
}
