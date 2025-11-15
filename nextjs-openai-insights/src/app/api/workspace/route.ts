import { NextResponse } from "next/server";

import { clearWorkspace, ensureWorkspaceSession, touchWorkspace } from "@/lib/cookies-store";
import { db } from "@/lib/db/mongodb";
import { workspaceDocumentToSnapshot, type WorkspaceDocument } from "@/lib/db/models/Workspace";
import { getCurrentSession } from "@/lib/cookies-store";

export async function GET() {
  // Try MongoDB first
  try {
    const { sessionId } = await getCurrentSession();
    if (sessionId) {
      const workspaceDoc = await db.findOne<WorkspaceDocument>("workspaces", {
        sessionId,
      });

      if (workspaceDoc) {
        const workspace = workspaceDocumentToSnapshot(workspaceDoc);
        console.log("[api/workspace] ✅ Workspace carregado do MongoDB");
        return NextResponse.json(workspace, {
          headers: {
            "Cache-Control": "no-store",
          },
        });
      }
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

  // Fallback to localStorage
  // Use ensureWorkspaceSession to create a default workspace if none exists
  // This prevents "cache expired" error on first load
  const workspace = await ensureWorkspaceSession();
  
  console.log("[api/workspace] ✅ Workspace carregado/criado do localStorage (fallback)");
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

