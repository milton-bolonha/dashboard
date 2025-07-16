import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ApiKeyAuth } from "@/lib/api-key-auth";
import { getCurrentAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";

/**
 * DELETE /api/workspaces/{id}/api-keys/{keyId}
 * Revoga uma API key
 */
export async function DELETE(request, { params }) {
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

    // Revogar API key
    await ApiKeyAuth.revokeKey(keyId, "Revoked by user");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao revogar API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
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
