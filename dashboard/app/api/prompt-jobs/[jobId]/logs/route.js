import { NextResponse } from "next/server";
import { listLogs } from "@/lib/db/prompt-logs";
import { getCurrentAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  // AuthZ: exigir user logado para acessar logs
  try {
    const { userId } = await getCurrentAuth();
    if (!userId)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level");
  const cursor = searchParams.get("cursor");
  const limit = Number(searchParams.get("limit") || 100);
  const items = await listLogs(params.jobId, { level, cursor, limit });
  return NextResponse.json({ items, nextCursor: null });
}
