import { NextResponse } from "next/server";
import { getJob } from "@/lib/db/prompt-jobs";
import { getCurrentAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const { jobId } = await params;
  const { searchParams } = new URL(request.url);
  const guestId = searchParams.get("guest_id");

  const job = await getJob(jobId);
  if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });

  // ⭐ DEBUG: Verificar se initialItems está presente
  console.debug("[Get Job Route] 📋 Job recuperado:", {
    jobId: job.jobId,
    status: job.status,
    hasInitialItems: !!job.initialItems,
    initialItemsCount: Array.isArray(job.initialItems)
      ? job.initialItems.length
      : 0,
    firstItemKeys: job.initialItems?.[0]
      ? Object.keys(job.initialItems[0])
      : [],
    firstItemResearchTarget: job.initialItems?.[0]?.researchTarget || "N/A",
  });

  // ⭐ NOVO: Se há guest_id, permitir acesso (fluxo guest)
  if (guestId && job.guestId === guestId) {
    console.debug("[Get Job Route] ✅ Acesso via guest_id:", guestId);
    return NextResponse.json(job);
  }

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
  return NextResponse.json(job);
}
