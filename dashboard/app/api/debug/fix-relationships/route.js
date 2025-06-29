import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAuth } from "@/lib/auth";

/**
 * POST /api/debug/fix-relationships
 * Corrige relacionamentos quebrados entre content types e sections
 */
export async function POST(request) {
  try {
    const authData = await getCurrentAuth();
    const userId = authData.userId || "temp_user_dev";

    console.log(`🔧 CORRIGINDO RELACIONAMENTOS para usuário: ${userId}`);

    // Buscar todos os dados
    const [allWorkspaces, allContentTypes, allSections] = await Promise.all([
      db.find("workspaces", { ownerId: userId }),
      db.find("contentTypes", { userId: userId }),
      db.find("sections", { userId: userId }),
    ]);

    let fixes = {
      contentTypesCreated: 0,
      sectionsFixed: 0,
      sectionsDeleted: 0,
      details: [],
    };

    // Para cada workspace, garantir que tenha seus próprios content types
    for (const workspace of allWorkspaces) {
      console.log(`🏢 Processando workspace: ${workspace.name}`);

      // Buscar sections deste workspace
      const workspaceSections = allSections.filter(
        (s) => s.workspaceId?.toString() === workspace._id.toString()
      );

      if (workspaceSections.length === 0) continue;

      // Content types únicos usados pelas sections deste workspace
      const usedContentTypeIds = [
        ...new Set(workspaceSections.map((s) => s.contentTypeId)),
      ];

      for (const contentTypeId of usedContentTypeIds) {
        const contentType = allContentTypes.find(
          (ct) => ct._id.toString() === contentTypeId
        );

        if (!contentType) {
          // Deletar sections órfãs
          const orphanSections = workspaceSections.filter(
            (s) => s.contentTypeId === contentTypeId
          );
          for (const section of orphanSections) {
            await db.deleteOne("sections", { _id: section._id });
            fixes.sectionsDeleted++;
            fixes.details.push(`Deletou section órfã: ${section.name}`);
          }
          continue;
        }

        // Se content type está em workspace errado, criar cópia
        if (contentType.workspaceId?.toString() !== workspace._id.toString()) {
          console.log(
            `🔄 Criando content type "${contentType.name}" para workspace "${workspace.name}"`
          );

          // Criar novo content type para este workspace
          const newContentType = {
            name: contentType.name,
            slug: `${contentType.slug}-${workspace.slug}`,
            description: contentType.description || `Para ${workspace.name}`,
            icon: contentType.icon || "folder",
            addons: contentType.addons || [],
            userId: userId,
            workspaceId: workspace._id,
          };

          const ctResult = await db.insertOne("contentTypes", newContentType);
          const newContentTypeId = ctResult.insertedId.toString();

          fixes.contentTypesCreated++;
          fixes.details.push(
            `Criou "${contentType.name}" para "${workspace.name}"`
          );

          // Atualizar sections para usar novo content type
          const sectionsToUpdate = workspaceSections.filter(
            (s) => s.contentTypeId === contentTypeId
          );

          for (const section of sectionsToUpdate) {
            await db.updateOne(
              "sections",
              { _id: section._id },
              { contentTypeId: newContentTypeId }
            );

            fixes.sectionsFixed++;
            fixes.details.push(`Atualizou section "${section.name}"`);
          }
        }
      }
    }

    return NextResponse.json({
      status: "SUCCESS",
      message: "Relacionamentos corrigidos",
      workspacesProcessed: allWorkspaces.length,
      ...fixes,
    });
  } catch (error) {
    console.error("❌ Erro ao corrigir relacionamentos:", error);
    return NextResponse.json(
      { error: "Falha na correção", details: error.message },
      { status: 500 }
    );
  }
}
