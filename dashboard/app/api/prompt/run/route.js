import { NextResponse } from "next/server";
import { createJob } from "@/lib/db/prompt-jobs";
import { queueJob } from "@/lib/jobs/deck-engine-adapter";
import { getCurrentAuth } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const {
    templateId,
    variables = {},
    model = "o4-mini",
    guestId,
    token,
  } = body;
  if (!templateId)
    return NextResponse.json({ error: "templateId required" }, { status: 400 });

  // Se não for fluxo guest, exigir usuário logado
  if (!guestId) {
    try {
      const { userId } = await getCurrentAuth();
      if (!userId)
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    } catch {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const jobId = `job_${Date.now().toString(36)}`;
  await createJob({
    jobId,
    templateId,
    model,
    status: "QUEUED",
    totals: { items: 1, completed: 0, failed: 0 },
  });
  await queueJob({
    guestId,
    jobId,
    templateId,
    model,
    items: [variables],
    scope: "home",
    token,
  });
  return NextResponse.json({ jobId }, { status: 201 });
}
