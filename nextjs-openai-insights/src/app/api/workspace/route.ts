import { NextResponse } from "next/server";

import { clearWorkspace, ensureWorkspaceSession, touchWorkspace } from "@/lib/cookies-store";
import { db } from "@/lib/db/mongodb";
import { workspaceDocumentToSnapshot, type WorkspaceDocument } from "@/lib/db/models/Workspace";
import { getCurrentSession } from "@/lib/cookies-store";
import { getAuth } from "@/lib/auth/get-auth";

/**
 * GET /api/workspace
 * Load workspace
 * Security: Members load from MongoDB (scoped by userId), Guests load from localStorage only
 */
export async function GET() {
  const { userId } = await getAuth();
  const { sessionId } = await getCurrentSession();

  // Members: Try MongoDB first (scoped by userId for security)
  if (userId && sessionId) {
    try {
      const workspaceDoc = await db.findOne<WorkspaceDocument>("workspaces", {
        sessionId,
        userId, // Security: Filter by userId
      });

      if (workspaceDoc) {
        const workspace = workspaceDocumentToSnapshot(workspaceDoc);
        console.log("[api/workspace] ✅ Workspace carregado do MongoDB (member)");
        return NextResponse.json(workspace, {
          headers: {
            "Cache-Control": "no-store",
          },
        });
      }
    } catch (error) {
      // MongoDB unavailable or error - fallback to localStorage
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorCode = (error as Error & { code?: string }).code;
      
      if (errorCode === "MONGODB_CIRCUIT_OPEN") {
        console.log("[api/workspace] ⚠️ MongoDB circuit breaker aberto, usando fallback localStorage");
      } else {
        console.warn("[api/workspace] ⚠️ Erro ao ler do MongoDB, usando fallback localStorage:", errorMessage);
      }
    }
  }

  // Guests: Load from localStorage only (never MongoDB)
  // Use ensureWorkspaceSession to create a default workspace if none exists
  // This prevents "cache expired" error on first load
  const workspace = await ensureWorkspaceSession();
  
  console.log("[api/workspace] ✅ Workspace carregado/criado do localStorage", userId ? "(fallback member)" : "(guest)");
  return NextResponse.json(workspace, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function DELETE() {
  await clearWorkspace();
  const freshWorkspace = await ensureWorkspaceSession();
  return NextResponse.json({ success: true, workspace: freshWorkspace });
}

