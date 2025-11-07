import { NextResponse } from "next/server";

import { cookieModeEnabled } from "@/lib/config/features";
import {
  readWorkspaceFromCookies,
  reorderTilesOrder,
} from "@/lib/cookie-workspace-store";

export async function POST(request) {
  if (!cookieModeEnabled) {
    return NextResponse.json(
      { error: "Cookie-based workspace mode is disabled." },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const order = Array.isArray(body?.tilesOrder) ? body.tilesOrder : [];
    await reorderTilesOrder(order);
    const workspace = await readWorkspaceFromCookies();
    return NextResponse.json({ success: true, workspace });
  } catch (error) {
    console.error("[cookie/reorder-tiles] error", error);
    return NextResponse.json(
      { success: false, error: "Failed to reorder tiles" },
      { status: 500 }
    );
  }
}

