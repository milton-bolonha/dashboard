import { NextResponse } from "next/server";
import { createAccessEngine } from "@/lib/access-engine";
import { getAuthenticatedUser } from "@/lib/auth";
import { logError } from "@/lib/logger";
import { ObjectId } from "mongodb";

export async function POST(request) {
  try {
    const authResult = await getAuthenticatedUser();
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      );
    }
    const { userId } = authResult;

    const workspaceId = request.headers.get("x-workspace-id");
    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID required" },
        { status: 400 }
      );
    }

    const { action, resourceType, resourceId } = await request.json();

    if (!action || !resourceType) {
      return NextResponse.json(
        {
          error: "Action and resourceType are required",
        },
        { status: 400 }
      );
    }

    // Criar Access Engine
    const engine = await createAccessEngine(workspaceId, userId);

    // Se houver resourceId, buscar o recurso
    let resource = null;
    if (resourceId) {
      const { db } = await import("@/lib/db");
      try {
        const objectId = new ObjectId(resourceId);
        resource = await db.findOne(resourceType, { _id: objectId });
      } catch (e) {
        // Ignorar erro de ObjectId inválido, recurso não será encontrado
      }
    }

    // Verificar permissão
    const allowed = await engine.can(action, resourceType, resource);

    if (!allowed) {
      // Obter motivo da negação e opções de upgrade
      const deniedMessage = await engine.getAccessDeniedMessage(
        action,
        resourceType,
        resource
      );
      const upgradeOptions = await engine.getUpgradeOptions(
        `${resourceType}.${action}`
      );

      return NextResponse.json({
        allowed: false,
        reason: deniedMessage,
        upgradeOptions,
      });
    }

    return NextResponse.json({
      allowed: true,
    });
  } catch (error) {
    logError("Access check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
