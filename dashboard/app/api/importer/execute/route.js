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

  // 1. Criar ContentTypes primeiro
  const contentTypeMap = new Map(); // name -> ObjectId

  for (const contentType of importPlan.contentTypes) {
    try {
      // Verificar se já existe um ContentType com o mesmo nome
      const existing = await db.find("contentTypes", {
        workspaceId,
        name: contentType.name,
      });

      if (existing.length > 0) {
        contentTypeMap.set(contentType.name, existing[0]._id.toString());
        continue;
      }

      const newContentType = await db.insertOne("contentTypes", {
        ...contentType,
        workspaceId,
        userId, // Adicionar userId
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      contentTypeMap.set(
        contentType.name,
        newContentType.insertedId.toString()
      );
      results.contentTypesCreated++;
    } catch (error) {
      console.error(`Erro ao criar ContentType ${contentType.name}:`, error);
      results.errors.push(`ContentType ${contentType.name}: ${error.message}`);
    }
  }

  // 2. Criar Sections
  const sectionMap = new Map(); // slug -> ObjectId

  for (const section of importPlan.sections) {
    try {
      // Verificar se já existe uma Section com o mesmo slug
      const existing = await db.find("sections", {
        workspaceId,
        slug: section.slug,
      });

      if (existing.length > 0) {
        sectionMap.set(section.slug, existing[0]._id.toString());
        continue;
      }

      // Mapear o contentTypeId para o ID real
      const contentTypeId = contentTypeMap.get(section.contentTypeId);
      if (!contentTypeId) {
        console.error(`Section ${section.name}: ContentType não encontrado`);
        results.errors.push(
          `Section ${section.name}: ContentType não encontrado`
        );
        continue;
      }

      const newSection = await db.insertOne("sections", {
        ...section,
        workspaceId,
        userId, // Adicionar userId
        contentTypeId, // Usar o ID real do content type
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      sectionMap.set(section.slug, newSection.insertedId.toString());
      results.sectionsCreated++;
    } catch (error) {
      console.error(`Erro ao criar Section ${section.name}:`, error);
      results.errors.push(`Section ${section.name}: ${error.message}`);
    }
  }

  // 3. Criar Items
  for (const item of importPlan.items) {
    try {
      // Obter o ContentTypeId correto
      const contentTypeId = contentTypeMap.get(item.contentTypeId);
      if (!contentTypeId) {
        results.errors.push(`Item ${item.name}: ContentType não encontrado`);
        continue;
      }

      // Obter o SectionId correto (se aplicável)
      let sectionId = null;
      if (item.sectionId) {
        sectionId = sectionMap.get(item.sectionId);
        if (!sectionId) {
          results.errors.push(`Item ${item.name}: Section não encontrada`);
          continue;
        }
      }

      // Verificar se já existe um Item com o mesmo slug na mesma seção
      const existing = await db.find("items", {
        workspaceId,
        slug: item.slug,
        sectionId: sectionId,
      });

      if (existing.length > 0) {
        continue; // Item já existe
      }

      await db.insertOne("items", {
        ...item,
        workspaceId,
        userId, // Adicionar userId
        contentTypeId,
        sectionId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      results.itemsCreated++;
    } catch (error) {
      console.error(`Erro ao criar Item ${item.name}:`, error);
      results.errors.push(`Item ${item.name}: ${error.message}`);
    }
  }

  return results;
}
