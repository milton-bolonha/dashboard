import { NextResponse } from "next/server";
import { controlJob } from "@/lib/jobs/deck-engine-adapter";
import { getCurrentAuth } from "@/lib/auth";
import { getJob } from "@/lib/db/prompt-jobs";

export const runtime = "nodejs";

export async function POST(request, { params }) {
  const body = await request.json().catch(() => ({}));
  const { guestId } = body;
  if (!guestId) {
    try {
      const { userId } = await getCurrentAuth();
      if (!userId)
        return NextResponse.json({ error: "unauthorized" }, { status: 401 });
      const job = await getJob(params.jobId);
      if (!job)
        return NextResponse.json({ error: "not found" }, { status: 404 });
      if (job.ownerId && job.ownerId !== userId)
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
    } catch {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }
  await controlJob({ guestId, jobId: params.jobId, action: "resume" });
  return NextResponse.json({ ok: true, status: "RUNNING" });
}
