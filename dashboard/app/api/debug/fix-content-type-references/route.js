import { NextResponse } from "next/server";
import { getCurrentAuth } from "@/lib/auth";
import { db } from "@/lib/db";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const { userId } = await getCurrentAuth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { workspaceId, sectionId } = body;

    if (!workspaceId || !sectionId) {
      return NextResponse.json(
        { error: "workspaceId e sectionId são obrigatórios" },
        { status: 400 }
      );
    }

    // ✅ VALIDAÇÃO PREVENTIVA: Verificar se são ObjectIds válidos
    let workspaceObjectId, sectionObjectId;
    try {
      workspaceObjectId = new ObjectId(workspaceId);
      sectionObjectId = new ObjectId(sectionId);
    } catch (error) {
      return NextResponse.json(
        { error: "workspaceId ou sectionId inválidos" },
        { status: 400 }
      );
    }

    // Buscar todos os content types do workspace
    const contentTypes = await db.find("contentTypes", {
      workspaceId: workspaceObjectId,
    });

    // Buscar todos os itens da seção
    const items = await db.find("items", {
      sectionId: sectionObjectId,
    });

    console.log("🔍 DEBUG: Verificando referências quebradas");
    console.log("Content Types encontrados:", contentTypes.length);
    console.log("Items encontrados:", items.length);

    const fixes = [];
    const contentTypeMap = contentTypes.reduce((acc, ct) => {
      acc[ct._id.toString()] = ct;
      acc[ct.name.toLowerCase()] = ct; // Mapear por nome também
      return acc;
    }, {});

    for (const item of items) {
      // ✅ NORMALIZAÇÃO PREVENTIVA: Converter para string sempre
      const currentContentTypeId = item.contentTypeId?.toString();
      let newContentTypeId = null;
      let fixReason = "";

      // ✅ COMPARAÇÃO SEGURA: Usar string normalizada
      if (currentContentTypeId && contentTypeMap[currentContentTypeId]) {
        // ✅ Content Type existe, não precisa corrigir
        continue;
      }

      // Tentar encontrar por nome
      if (item.title && contentTypeMap[item.title.toLowerCase()]) {
        newContentTypeId =
          contentTypeMap[item.title.toLowerCase()]._id.toString();
        fixReason = `Content Type encontrado por nome: ${item.title}`;
      } else {
        // Se não encontrar, usar o primeiro content type disponível
        const firstContentType = contentTypes[0];
        if (firstContentType) {
          newContentTypeId = firstContentType._id.toString();
          fixReason = `Usando primeiro Content Type disponível: ${firstContentType.name}`;
        }
      }

      // ✅ COMPARAÇÃO SEGURA: Ambos são strings agora
      if (newContentTypeId && newContentTypeId !== currentContentTypeId) {
        // ✅ CORREÇÃO DEFINITIVA: Seguindo o guia de debugging
        try {
          await db.updateOne(
            "items",
            {
              _id: new ObjectId(item._id),
            },
            {
              contentTypeId: newContentTypeId,
            }
          );
        } catch (updateError) {
          console.error(
            `❌ Erro ao atualizar item "${item.title}":`,
            updateError
          );
          continue; // Pular este item e continuar com os próximos
        }

        fixes.push({
          itemId: item._id.toString(),
          itemTitle: item.title,
          oldContentTypeId: currentContentTypeId,
          newContentTypeId: newContentTypeId,
          reason: fixReason,
        });

        console.log(
          `🔧 Corrigido item "${item.title}": ${currentContentTypeId} → ${newContentTypeId}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `${fixes.length} referências corrigidas`,
      fixes,
      summary: {
        contentTypesCount: contentTypes.length,
        itemsCount: items.length,
        fixesCount: fixes.length,
      },
    });
  } catch (error) {
    console.error("Erro ao corrigir referências:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
