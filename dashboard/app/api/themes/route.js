import { NextResponse } from "next/server";
import { BASE_THEMES } from "@/lib/base-themes";

export const runtime = "edge";

export async function GET() {
  try {
    const items = Object.values(BASE_THEMES);
    return NextResponse.json({ success: true, items, themes: items });
  } catch (error) {
    const items = Object.values(BASE_THEMES);
    return NextResponse.json({
      success: false,
      items,
      themes: items,
      error: error?.message || null,
    });
  }
}
