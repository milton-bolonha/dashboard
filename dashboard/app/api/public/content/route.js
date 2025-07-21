import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApiKey } from "@/lib/api-key-auth";
import { serialize } from "@/lib/serialization";
import { ObjectId } from "mongodb";

/**
 * GET /api/public/content
 *
 * Rota genérica para exportar todo o conteúdo público de um workspace.
 * Requer uma API Key válida com permissão para acessar o workspace.
 *
 * @returns {Promise<NextResponse>} Uma resposta JSON com o conteúdo público
 *                                  ou um erro de autorização/servidor.
 */
export async function GET(request) {
  try {
    // 1. Autenticação e Autorização
    // A função requireApiKey valida o token, encontra a chave no DB
    // e nos retorna a chave com o workspaceId associado.
    const authResult = await requireApiKey(request);
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const { key } = authResult;
    const { workspaceId } = key;

    // TODO: 2. Verificação de Plano (Plano Free vs. Pro)
    // Conforme o plano, esta etapa será adicionada futuramente.

    // 3. Busca Agregada de Dados
    // Busca o workspace para obter o nome, convertendo o ID string para ObjectId
    const workspace = await db.findOne("workspaces", {
      _id: new ObjectId(workspaceId),
    });

    // Busca todas as seções públicas e ativas do workspace
    const sections = await db.find("sections", {
      workspaceId: workspaceId,
      "publicAccess.isPublic": true,
      isActive: true,
    });

    // Mapeia as seções para buscar seus itens correspondentes
    const content = await Promise.all(
      sections.map(async (section) => {
        const items = await db.find("items", {
          sectionId: section._id.toString(), // ✅ CORREÇÃO FINAL: Comparar String com String
          isActive: true, // ✅ SEGURANÇA: Item deve estar ativo
          status: "published", // ✅ SEGURANÇA: Item deve estar publicado
        });

        // Serializa os dados para remover campos internos e formatar o ID
        const serializedItems = serialize(items);

        return {
          slug: section.slug,
          title: section.name,
          items: serializedItems,
        };
      })
    );

    // 4. Estruturar a Resposta
    const responseData = {
      workspace: {
        id: workspaceId,
        name: workspace ? workspace.name : "Workspace not found",
      },
      content: content,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Erro ao processar /api/public/content:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
