import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ApiKeyAuth } from "@/lib/api-key-auth";
import { getCurrentAuth } from "@/lib/auth";
import { ObjectId } from "mongodb";

/**
 * GET /api/workspaces/{id}/api-keys
 * Lista API keys de um workspace
 */
export async function GET(request, { params }) {
  try {
    const authData = await getCurrentAuth();
    const userId = authData.userId;

    const { id: workspaceId } = params;

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

    // Listar API keys do workspace
    const keys = await ApiKeyAuth.listKeys(workspaceId);

    return NextResponse.json({ keys });
  } catch (error) {
    console.error("Erro ao listar API keys:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/{id}/api-keys
 * Cria uma nova API key para o workspace
 */
export async function POST(request, { params }) {
  try {
    const authData = await getCurrentAuth();
    const userId = authData.userId;

    const { id: workspaceId } = params;
    const data = await request.json();

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

    // Validar dados
    if (!data.name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Criar API key
    const apiKey = await ApiKeyAuth.generateApiKey({
      name: data.name,
      workspaceId,
      permissions: data.permissions || ["read"],
      rateLimit: data.rateLimit || 100,
      expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
    });

    return NextResponse.json(apiKey, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar API key:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
