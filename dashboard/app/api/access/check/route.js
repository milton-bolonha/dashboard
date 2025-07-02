import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { createAccessEngine } from "@/lib/access-engine";

export async function POST(request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
      resource = await db.findOne(resourceType, { _id: resourceId });
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
    console.error("Access check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
