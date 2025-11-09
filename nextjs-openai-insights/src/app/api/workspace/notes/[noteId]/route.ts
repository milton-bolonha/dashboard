import { NextResponse } from "next/server";

import { updateWorkspace } from "@/lib/cookies-store";

type RouteContext = { params: Promise<{ noteId: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { noteId } = await context.params;

  try {
    const updated = await updateWorkspace((workspace) => {
      return {
        ...workspace,
        company: {
          ...workspace.company,
          notes: workspace.company.notes.filter((note) => note.id !== noteId),
        },
      };
    });

    return NextResponse.json({ success: true, notes: updated.company.notes });
  } catch {
    return NextResponse.json(
      { error: "Workspace cache expired" },
      { status: 404 }
    );
  }
}

