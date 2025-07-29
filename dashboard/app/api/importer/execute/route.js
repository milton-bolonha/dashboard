import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";
import { createSectionAndInitialItem } from "@/lib/section-operations";
import {
  generateSlug,
  isSlugUnique,
  validateSlug,
} from "@/lib/slug-validation";

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
      message: `Importação concluída! ${results.contentTypesCreated} ContentTypes, ${results.sectionsCreated} Seções e ${results.itemsCreated} Items criados/atualizados.`,
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
    itemsUpdated: 0,
    errors: [],
  };
  const workspaceObjectId = new ObjectId(workspaceId);

  // Loop principal unificado
  for (const node of importPlan.plan) {
    try {
      // 1. Get-or-Create ContentType(s) para este nó
      const contentTypeIds = new Map();
      for (const file of node.files) {
        if (contentTypeIds.has(file.contentType.slug)) continue;

        const filter = {
          workspaceId: workspaceObjectId,
          slug: file.contentType.slug,
        };

        let ct = await db.findOne("contentTypes", filter);
        if (!ct) {
          const newCt = await db.insertOne("contentTypes", {
            ...file.contentType,
            workspaceId: workspaceObjectId,
            userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          results.contentTypesCreated++;
          ct = { _id: newCt.insertedId }; // Apenas o ID é necessário
        }
        contentTypeIds.set(file.contentType.slug, ct._id);
      }

      // 2. Get-or-Create a Seção
      let sectionId;
      const sectionFilter = {
        workspaceId: workspaceObjectId,
        slug: node.section.slug,
      };

      let section = await db.findOne("sections", sectionFilter);
      if (!section) {
        // O contentTypeId para seções singleton/collection é o primeiro que encontramos
        const mainContentTypeId = contentTypeIds.values().next().value;
        const newSectionResult = await createSectionAndInitialItem({
          ...node.section,
          contentTypeId: mainContentTypeId?.toString(),
          workspaceId: workspaceObjectId,
          userId,
        });
        results.sectionsCreated++;
        sectionId = newSectionResult._id;

        if (newSectionResult.strategy === "singleton") {
          results.itemsCreated++;
        }
      } else {
        sectionId = section._id;
      }

      // 3. Upsert Itens (apenas para coleções e agrupamentos)
      if (node.section.strategy !== "singleton") {
        for (const file of node.files) {
          const contentTypeId = contentTypeIds.get(file.contentType.slug);
          for (const item of file.itemsData) {
            const itemFilter = {
              workspaceId: workspaceObjectId,
              sectionId,
              slug: item.slug,
            };

            const existingItem = await db.findOne("items", itemFilter);
            if (existingItem) {
              // Atualizar
              await db.updateOne(itemFilter, {
                $set: { ...item, updatedAt: new Date() },
              });
              results.itemsUpdated++;
            } else {
              // Criar
              await db.insertOne("items", {
                ...item,
                sectionId,
                contentTypeId,
                workspaceId: workspaceObjectId,
                userId,
                createdAt: new Date(),
                updatedAt: new Date(),
              });
              results.itemsCreated++;
            }
          }
        }
      }
    } catch (error) {
      console.error(`ERRO AO PROCESSAR NÓ ${node.section.slug}:`, error);
      results.errors.push(`Seção ${node.section.slug}: ${error.message}`);
    }
  }

  return results;
}
