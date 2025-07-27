import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentAuth } from "@/lib/auth";
import { nanoid } from "nanoid";
import crypto from "crypto";

// Função para gerar um hash seguro de uma chave de API
function hashApiKey(apiKey) {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

/**
 * GET /api/workspaces/{workspaceId}/api-keys
 * Lista todas as chaves de API para um workspace.
 */
export async function GET(request, { params }) {
  try {
    const auth = await getCurrentAuth();
    const { userId } = auth;
    const { id: workspaceId } = await params; // ✅ CORREÇÃO: Await params

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // TODO: Adicionar verificação se o usuário tem permissão para ver este workspace

    const apiKeys = await db.find("apiKeys", { workspaceId });

    // Nunca retorne a chave completa, apenas metadados seguros
    const safeApiKeys = apiKeys.map((key) => ({
      id: key._id,
      name: key.name,
      last4: key.keyPrefix, // Supondo que salvaremos os últimos 4 ou um prefixo
      createdAt: key.createdAt,
    }));

    return NextResponse.json(safeApiKeys);
  } catch (error) {
    console.error("[API_KEYS_GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workspaces/{workspaceId}/api-keys
 * Cria uma nova chave de API para um workspace.
 */
export async function POST(request, { params }) {
  try {
    const auth = await getCurrentAuth();
    const { userId } = auth;
    const { id: workspaceId } = await params; // ✅ CORREÇÃO: Await params
    const { name } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // TODO: Adicionar verificação se o usuário tem permissão para criar chaves neste workspace

    // Gera uma nova chave de API
    const apiKey = `dsmp_${nanoid(32)}`;
    const hashedKey = hashApiKey(apiKey);

    const result = await db.insertOne("apiKeys", {
      // ✅ CORREÇÃO: Usar insertOne
      userId,
      workspaceId,
      name,
      hashedKey,
      keyPrefix: apiKey.substring(0, 7), // "dsmp_xx..."
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Retorna a chave completa APENAS uma vez.
    return NextResponse.json({
      id: result.insertedId, // Retornar o ID do novo documento
      name,
      apiKey, // Envia a chave real para o usuário copiar
    });
  } catch (error) {
    console.error("[API_KEYS_POST]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
