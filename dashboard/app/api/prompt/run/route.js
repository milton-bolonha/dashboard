import { NextResponse } from "next/server";
import { createJob } from "@/lib/db/prompt-jobs";
import { queueJob } from "@/lib/jobs/deck-engine-adapter";
import { getCurrentAuth } from "@/lib/auth";
import {
  getDeckGenerationConfig,
  resolveGenerationMode,
  getDeckModelConfig,
} from "@/config/deck-engine";

export const runtime = "nodejs";

const { model: deckDefaultModel } = getDeckModelConfig();

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const {
    templateId,
    variables = {},
    model = deckDefaultModel,
    guestId,
    token,
    generationMode: bodyGenerationMode,
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

  const { defaultMode } = getDeckGenerationConfig();
  const generationMode =
    resolveGenerationMode(bodyGenerationMode) || defaultMode;

  const jobId = `job_${Date.now().toString(36)}`;
  const selectedModel = model || deckDefaultModel;

  await createJob({
    jobId,
    templateId,
    model: selectedModel,
    status: "QUEUED",
    totals: { items: 1, completed: 0, failed: 0 },
    generationMode,
  });
  await queueJob({
    guestId,
    jobId,
    templateId,
    model: selectedModel,
    items: [variables],
    scope: "home",
    token,
    generationMode,
  });
  return NextResponse.json({ jobId }, { status: 201 });
}
