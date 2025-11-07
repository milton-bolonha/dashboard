import { NextResponse } from "next/server";

import { clearWorkspaceCookies, readWorkspaceFromCookies } from "@/lib/cookie-workspace-store";

export async function GET() {
  const workspace = await readWorkspaceFromCookies();
  return NextResponse.json({ success: true, ...workspace });
}

export async function DELETE() {
  await clearWorkspaceCookies();
  return NextResponse.json({ ok: true });
}

