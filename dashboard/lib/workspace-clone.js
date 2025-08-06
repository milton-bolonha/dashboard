import { db } from "./db.js";
import { ObjectId } from "mongodb";
import { serializeWorkspace } from "./serialization.js";

/**
 * Clona um workspace completo com todos os seus dados
 * Implementa rollback transacional e otimizações de performance
 */
export async function cloneWorkspaceComplete(
  originalWorkspace,
  newName,
  newSlug,
  userId
) {
  const stats = {
    contentTypes: 0,
    sections: 0,
    items: 0,
  };

  // Rollback tracking
  const createdIds = {
    workspaceId: null,
    contentTypes: [],
    sections: [],
    items: [],
  };

  try {
    console.log("🔄 Criando novo workspace...");

    // 1. Criar novo workspace
    const newWorkspaceData = {
      name: newName,
      slug: newSlug,
      ownerId: userId,
      description: originalWorkspace.description,
      planId: originalWorkspace.planId,
      planStatus: "active",
      limits: originalWorkspace.limits,
      members: [
        {
          userId: userId,
          role: "owner",
          permissions: {
            canExport: true,
            canInvite: true,
            canManageBilling: true,
          },
          joinedAt: new Date(),
        },
      ],
      // Resetar dados que não devem ser clonados
      usage: {
        sections: 0,
        items: 0,
        storage: 0,
        apiCalls: 0,
        customMetrics: {},
      },
      activeKeys: [], // Resetar chaves ativas
      customPermissions: [], // Resetar permissões customizadas
      security: {
        apiKeyEnabled: false,
        allowedIPs: [],
        defaultVisibility: "workspace_member",
        allowPublicSections: false,
      },
      isActive: true,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    const newWorkspaceResult = await db.insertOne(
      "workspaces",
      newWorkspaceData
    );
    const newWorkspaceId = newWorkspaceResult.insertedId;
    createdIds.workspaceId = newWorkspaceId;

    console.log("✅ Novo workspace criado:", newWorkspaceId.toString());

    // 2. Clonar Content Types (otimizado com batch)
    console.log("🔄 Clonando content types...");
    const originalContentTypes = await db.find("contentTypes", {
      workspaceId: originalWorkspace._id,
    });

    const contentTypeIdMap = new Map();
    const contentTypesToInsert = [];

    for (const contentType of originalContentTypes) {
      const newContentTypeData = {
        ...contentType,
        _id: undefined,
        workspaceId: newWorkspaceId,
        userId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      contentTypesToInsert.push(newContentTypeData);
    }

    // Batch insert para content types (mais eficiente)
    if (contentTypesToInsert.length > 0) {
      const contentTypeResults = await db.insertMany(
        "contentTypes",
        contentTypesToInsert
      );
      contentTypeResults.insertedIds.forEach((newId, index) => {
        const originalId = originalContentTypes[index]._id.toString();
        contentTypeIdMap.set(originalId, newId);
        createdIds.contentTypes.push(newId);
        stats.contentTypes++;
      });
      console.log("✅ Content types clonados:", stats.contentTypes);
    }

    // 3. Clonar Sections (otimizado com batch)
    console.log("🔄 Clonando sections...");
    const originalSections = await db.find("sections", {
      workspaceId: originalWorkspace._id,
    });

    const sectionIdMap = new Map();
    const sectionsToInsert = [];

    for (const section of originalSections) {
      const newSectionData = {
        ...section,
        _id: undefined,
        workspaceId: newWorkspaceId,
        userId: userId,
        contentTypeId: section.contentTypeId
          ? contentTypeIdMap.get(section.contentTypeId.toString())?.toString()
          : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      sectionsToInsert.push(newSectionData);
    }

    // Batch insert para sections
    if (sectionsToInsert.length > 0) {
      const sectionResults = await db.insertMany("sections", sectionsToInsert);
      sectionResults.insertedIds.forEach((newId, index) => {
        const originalId = originalSections[index]._id.toString();
        sectionIdMap.set(originalId, newId);
        createdIds.sections.push(newId);
        stats.sections++;
      });
      console.log("✅ Sections clonadas:", stats.sections);
    }

    // 4. Clonar Items (otimizado com batch)
    console.log("🔄 Clonando items...");
    const originalItems = await db.find("items", {
      workspaceId: originalWorkspace._id,
    });

    const itemsToInsert = [];

    for (const item of originalItems) {
      const newItemData = {
        ...item,
        _id: undefined,
        workspaceId: newWorkspaceId,
        userId: userId,
        sectionId: sectionIdMap.get(item.sectionId.toString()),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      itemsToInsert.push(newItemData);
    }

    // Batch insert para items (mais eficiente para grandes volumes)
    if (itemsToInsert.length > 0) {
      const itemResults = await db.insertMany("items", itemsToInsert);
      createdIds.items.push(...itemResults.insertedIds);
      stats.items = itemResults.insertedIds.length;
      console.log("✅ Items clonados:", stats.items);
    }

    // 5. Buscar workspace criado (com serialização)
    const newWorkspace = await db.findOne("workspaces", {
      _id: newWorkspaceId,
    });

    // Serializar resposta para evitar problemas de ObjectId
    const serializedWorkspace = serializeWorkspace(newWorkspace);

    console.log("🎉 Clonagem concluída com sucesso!");
    console.log("📊 Estatísticas finais:", stats);

    return {
      newWorkspace: serializedWorkspace,
      stats,
    };
  } catch (error) {
    // ROLLBACK: Se algo falhar, reverter todas as mudanças
    console.error("❌ Erro durante clonagem, iniciando rollback:", error);

    try {
      console.log("🔄 Iniciando rollback...");

      // Deletar items criados
      if (createdIds.items.length > 0) {
        await db.deleteMany("items", { _id: { $in: createdIds.items } });
        console.log("✅ Items deletados no rollback");
      }

      // Deletar sections criadas
      if (createdIds.sections.length > 0) {
        await db.deleteMany("sections", { _id: { $in: createdIds.sections } });
        console.log("✅ Sections deletadas no rollback");
      }

      // Deletar content types criados
      if (createdIds.contentTypes.length > 0) {
        await db.deleteMany("contentTypes", {
          _id: { $in: createdIds.contentTypes },
        });
        console.log("✅ Content types deletados no rollback");
      }

      // Deletar workspace criado
      if (createdIds.workspaceId) {
        await db.deleteOne("workspaces", { _id: createdIds.workspaceId });
        console.log("✅ Workspace deletado no rollback");
      }

      console.log("✅ Rollback concluído com sucesso");
    } catch (rollbackError) {
      console.error("❌ Erro durante rollback:", rollbackError);
      // Em caso de erro no rollback, registrar para intervenção manual
    }

    throw error; // Re-throw para tratamento no endpoint
  }
} 