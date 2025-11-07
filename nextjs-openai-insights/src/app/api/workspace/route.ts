import { NextResponse } from "next/server";

import { clearWorkspace, touchWorkspace } from "@/lib/cookies-store";

export async function GET() {
  const workspace = await touchWorkspace();
  return NextResponse.json(workspace, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

export async function DELETE() {
  await clearWorkspace();
  return NextResponse.json({ success: true });
}

