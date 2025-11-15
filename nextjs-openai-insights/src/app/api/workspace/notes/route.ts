import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { readWorkspace, updateWorkspace, getCurrentSession } from "@/lib/cookies-store";
import { syncWorkspaceNotesToMongo } from "@/lib/storage/mongodb-store";

export async function GET() {
  const workspace = await readWorkspace();
  if (!workspace) {
    return NextResponse.json({ error: "Workspace cache expired" }, { status: 404 });
  }
  return NextResponse.json({ notes: workspace.company.notes });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  const now = new Date().toISOString();

  try {
    const updated = await updateWorkspace((workspace) => {
      const nextNotes = [
        {
          id: `note_${randomUUID()}`,
          title,
          content,
          createdAt: now,
          updatedAt: now,
        },
        ...workspace.company.notes,
      ].slice(0, 20);

      return {
        ...workspace,
        company: {
          ...workspace.company,
          notes: nextNotes,
        },
      };
    });

    // Dual-write: Sync notes to MongoDB if available (non-blocking)
    try {
      const { sessionId } = await getCurrentSession();
      if (sessionId) {
        await syncWorkspaceNotesToMongo(sessionId, updated.company.notes);
        console.log("[API] /api/workspace/notes - ✅ Notes também sincronizados no MongoDB");
      }
    } catch (mongoError) {
      const errorMessage = mongoError instanceof Error ? mongoError.message : String(mongoError);
      console.warn("[API] /api/workspace/notes - ⚠️ Falha ao sincronizar no MongoDB (não crítico):", errorMessage);
    }

    return NextResponse.json({ success: true, notes: updated.company.notes });
  } catch {
    return NextResponse.json({ error: "Workspace cache expired" }, { status: 404 });
  }
}

