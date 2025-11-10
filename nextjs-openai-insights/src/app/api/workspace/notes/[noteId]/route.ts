import { NextResponse } from "next/server";
import { z } from "zod";

import { updateWorkspace } from "@/lib/cookies-store";

type RouteContext = { params: Promise<{ noteId: string }> };

const updateSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
});

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
      { status: 404 },
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const { noteId } = await context.params;
  const payload = await request.json().catch(() => null);
  const parse = updateSchema.safeParse(payload);

  if (!parse.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parse.error.flatten() },
      { status: 400 },
    );
  }

  const { title, content } = parse.data;
  if (
    (typeof title === "undefined" || title === null) &&
    (typeof content === "undefined" || content === null)
  ) {
    return NextResponse.json(
      { error: "Nothing to update" },
      { status: 400 },
    );
  }

  try {
    const updated = await updateWorkspace((workspace) => {
      const notes = workspace.company.notes ?? [];
      const index = notes.findIndex((note) => note.id === noteId);
      if (index === -1) {
        return workspace;
      }
      const existing = notes[index];
      const nextNotes = [...notes];
      nextNotes[index] = {
        ...existing,
        title: typeof title === "string" ? title : existing.title,
        content: typeof content === "string" ? content : existing.content,
        updatedAt: new Date().toISOString(),
      };

      return {
        ...workspace,
        company: {
          ...workspace.company,
          notes: nextNotes,
        },
      };
    });

    return NextResponse.json({
      success: true,
      notes: updated.company.notes,
    });
  } catch {
    return NextResponse.json(
      { error: "Workspace cache expired" },
      { status: 404 },
    );
  }
}