import { NextResponse } from "next/server";

import { cookieModeEnabled } from "@/lib/config/features";
import {
  deleteTile,
  readWorkspaceFromCookies,
} from "@/lib/cookie-workspace-store";

export async function DELETE(request, { params }) {
  if (!cookieModeEnabled) {
    return NextResponse.json(
      { error: "Cookie-based workspace mode is disabled." },
      { status: 404 }
    );
  }

  const { tileId } = await params;

  await deleteTile(tileId);
  const workspace = await readWorkspaceFromCookies();
  return NextResponse.json({ success: true, workspace });
}

