import { NextResponse } from "next/server";
import { randomUUID } from "crypto";

import { readWorkspace, updateWorkspace } from "@/lib/cookies-store";

export async function GET() {
  const workspace = await readWorkspace();
  return NextResponse.json({ notes: workspace.company.notes });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const content = typeof body?.content === "string" ? body.content.trim() : "";

  const now = new Date().toISOString();

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

  return NextResponse.json({ success: true, notes: updated.company.notes });
}

