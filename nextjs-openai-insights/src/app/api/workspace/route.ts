import { NextResponse } from "next/server";

import { clearWorkspace, ensureWorkspaceSession, touchWorkspace } from "@/lib/cookies-store";

export async function GET() {
  const workspace = await touchWorkspace();
  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace cache expired" },
      {
        status: 404,
        headers: { "Cache-Control": "no-store" },
      }
    );
  }
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

