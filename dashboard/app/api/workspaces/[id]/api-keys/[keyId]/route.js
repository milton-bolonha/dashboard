import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuth } from "@clerk/nextjs/server";

/**
 * DELETE /api/workspaces/{workspaceId}/api-keys/{keyId}
 * Deleta uma chave de API específica.
 */
export async function DELETE(request, { params }) {
  try {
    const { userId } = getAuth(request);
    const { id: workspaceId, keyId } = await params; // ✅ CORREÇÃO: Await params

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Adicionar verificação se o usuário tem permissão para deletar chaves neste workspace

    // Encontra e deleta a chave, garantindo que ela pertence ao usuário e ao workspace corretos
    const result = await db.deleteOne("apiKeys", {
      _id: keyId,
      userId,
      workspaceId,
    });

    if (result.deletedCount === 0) {
      return NextResponse.json(
        {
          error:
            "API Key not found or you do not have permission to delete it.",
        },
        { status: 404 }
      );
    }

    return new NextResponse(null, { status: 204 }); // No Content
  } catch (error) {
    console.error("[API_KEY_DELETE]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/workspaces/{id}/api-keys/{keyId}/stats
 * Obtém estatísticas de uso de uma API key
 */
export async function GET(request, { params }) {
  try {
    const authData = await getCurrentAuth();
    const userId = authData.userId;

    const { id: workspaceId, keyId } = params;

    // Verificar se usuário tem acesso ao workspace
    const workspace = await db.findOne("workspaces", {
      _id: new ObjectId(workspaceId),
      $or: [{ ownerId: userId }, { "members.userId": userId }],
    });

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found or access denied" },
        { status: 404 }
      );
    }

    // Verificar se a API key pertence ao workspace
    const apiKey = await db.findOne("api_keys", {
      _id: keyId,
      workspaceId,
    });

    if (!apiKey) {
      return NextResponse.json({ error: "API key not found" }, { status: 404 });
    }

    // Obter estatísticas
    const stats = await ApiKeyAuth.getKeyStats(keyId);

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Erro ao obter estatísticas da API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
