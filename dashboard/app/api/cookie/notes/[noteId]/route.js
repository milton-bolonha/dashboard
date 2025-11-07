import { NextResponse } from "next/server";

import { cookieModeEnabled } from "@/lib/config/features";
import {
  deleteNote,
  listNotes,
  updateNote,
} from "@/lib/cookie-workspace-store";

export async function PUT(request, { params }) {
  if (!cookieModeEnabled) {
    return NextResponse.json(
      { error: "Cookie-based workspace mode is disabled." },
      { status: 404 }
    );
  }

  const { noteId } = await params;

  try {
    const body = await request.json();
    const updated = await updateNote(noteId, {
      title: body?.title,
      content: body?.content,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Note not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, note: updated });
  } catch (error) {
    console.error("[cookie/notes] PUT error", error);
    return NextResponse.json(
      { success: false, error: "Failed to update note" },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  if (!cookieModeEnabled) {
    return NextResponse.json(
      { error: "Cookie-based workspace mode is disabled." },
      { status: 404 }
    );
  }

  const { noteId } = await params;

  try {
    await deleteNote(noteId);
    return NextResponse.json({ success: true, notes: await listNotes() });
  } catch (error) {
    console.error("[cookie/notes] DELETE error", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete note" },
      { status: 500 }
    );
  }
}

