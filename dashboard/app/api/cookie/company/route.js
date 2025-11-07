import { NextResponse } from "next/server";

import { cookieModeEnabled } from "@/lib/config/features";
import {
  readWorkspaceFromCookies,
  updateCompanyInfo,
} from "@/lib/cookie-workspace-store";

export async function GET() {
  if (!cookieModeEnabled) {
    return NextResponse.json(
      { error: "Cookie-based workspace mode is disabled." },
      { status: 404 }
    );
  }

  const workspace = await readWorkspaceFromCookies();
  const company = workspace?.companies?.[0] || null;
  return NextResponse.json({ success: true, company });
}

export async function PATCH(request) {
  if (!cookieModeEnabled) {
    return NextResponse.json(
      { error: "Cookie-based workspace mode is disabled." },
      { status: 404 }
    );
  }

  try {
    const body = await request.json();
    const updated = await updateCompanyInfo({
      name: body?.name,
      website: body?.website,
    });

    return NextResponse.json({ success: true, company: updated });
  } catch (error) {
    console.error("[cookie/company] PATCH error", error);
    return NextResponse.json(
      { success: false, error: "Failed to update company" },
      { status: 500 }
    );
  }
}

