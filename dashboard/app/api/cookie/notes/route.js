import { NextResponse } from "next/server";

import { cookieModeEnabled } from "@/lib/config/features";
import {
  createNote,
  listNotes,
} from "@/lib/cookie-workspace-store";

export async function GET() {
  if (!cookieModeEnabled) {
    return NextResponse.json(
      { error: "Cookie-based workspace mode is disabled." },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, notes: await listNotes() });
}

export async function POST(request) {
  if (!cookieModeEnabled) {
    return NextResponse.json(
      { error: "Cookie-based workspace mode is disabled." },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const title = body?.title?.trim();
    const content = body?.content?.trim() || "";

    if (!title) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    const note = await createNote({ title, content });
    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error("[cookie/notes] POST error", error);
    return NextResponse.json(
      { success: false, error: "Failed to create note" },
      { status: 500 }
    );
  }
}

