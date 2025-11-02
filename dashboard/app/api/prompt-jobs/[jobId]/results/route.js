import { NextResponse } from "next/server";
import { listResults } from "@/lib/db/prompt-results";
import { getCurrentAuth } from "@/lib/auth";
import { getJob } from "@/lib/db/prompt-jobs";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const { searchParams } = new URL(request.url);
  const { jobId } = await params;
  const guestId = searchParams.get("guest_id");
  const job = await getJob(jobId);

  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });

  // ⭐ NOVO: Se há guest_id, permitir acesso (fluxo guest)
  if (guestId && job.guestId === guestId) {
    console.debug("[Get Results Route] ✅ Acesso via guest_id:", guestId);
  } else {
    // Exigir autenticação e ownership para rotas não-guest
    try {
      const { userId } = await getCurrentAuth();
      if (!userId)
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      if (job.ownerId && job.ownerId !== userId)
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    } catch {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const cursor = searchParams.get("cursor");
  const limit = Number(searchParams.get("limit") || 50);
  const items = await listResults(jobId, { cursor, limit });
  return NextResponse.json({ items, nextCursor: null });
}

export async function DELETE(request, { params }) {
  // Implementar exclusão por itemId se necessário
  return NextResponse.json(
    { ok: false, message: "Not implemented" },
    { status: 501 }
  );
}
