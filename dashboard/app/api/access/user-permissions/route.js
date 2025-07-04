import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth";
import { ObjectId } from "mongodb";
import { logError } from "@/lib/logger";

export async function GET(request) {
  try {
    const { userId, error, status } = await getAuthenticatedUser();

    if (error) {
      return NextResponse.json({ error }, { status });
    }

    const { searchParams } = new URL(request.url);
    const workspaceId = searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "Workspace ID required" },
        { status: 400 }
      );
    }

    const workspace = await db.findOne("workspaces", {
      _id: new ObjectId(workspaceId),
    });
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const member = workspace.members?.find((m) => m.userId === userId);
    if (!member && workspace.ownerId !== userId) {
      return NextResponse.json(
        { error: "Not a workspace member" },
        { status: 403 }
      );
    }

    // Simplificando a resposta para focar na autenticação
    return NextResponse.json({
      userId: userId,
      role: member?.role || (workspace.ownerId === userId ? "owner" : "viewer"),
      message: "Permissões obtidas com sucesso.",
    });
  } catch (error) {
    logError("User permissions error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
