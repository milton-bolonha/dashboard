import { NextResponse } from "next/server";
import { listResults } from "@/lib/db/prompt-results";
import { getCurrentAuth } from "@/lib/auth";
import { getJob } from "@/lib/db/prompt-jobs";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  // AuthZ: exigir user logado para export
  try {
    const { userId } = await getCurrentAuth();
    if (!userId)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const job = await getJob(params.jobId);
    if (!job) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (job.ownerId && job.ownerId !== userId)
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const format = (searchParams.get("format") || "json").toLowerCase();
  const fields = (searchParams.get("fields") || "").split(",").filter(Boolean);
  const sse = searchParams.get("sse") === "1";

  const items = await listResults(params.jobId, { limit: 1000 });

  if (sse) {
    const stream = new ReadableStream({
      start(controller) {
        const enc = new TextEncoder();
        const send = (event, data) => {
          const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(enc.encode(msg));
        };
        try {
          const total = items.length;
          send("export:status", { status: "STARTED", total });

          if (format === "csv") {
            const pick = (obj) =>
              fields.length
                ? Object.fromEntries(fields.map((f) => [f, obj[f]]))
                : obj;
            const rows = items.map(pick);
            const header = Object.keys(rows[0] || {});
            send("export:chunk", { type: "header", data: header });
            for (let i = 0; i < rows.length; i++) {
              const row = rows[i];
              const line = header.map((h) => JSON.stringify(row[h] ?? ""));
              send("export:chunk", { type: "row", index: i, data: line });
              if ((i + 1) % 10 === 0 || i + 1 === rows.length) {
                send("export:progress", { current: i + 1, total });
              }
            }
          } else {
            // JSON streaming em blocos
            for (let i = 0; i < items.length; i++) {
              const obj = items[i];
              const out = fields.length
                ? Object.fromEntries(fields.map((f) => [f, obj[f]]))
                : obj;
              send("export:chunk", { type: "item", index: i, data: out });
              if ((i + 1) % 10 === 0 || i + 1 === items.length) {
                send("export:progress", { current: i + 1, total });
              }
            }
          }
          send("export:status", { status: "COMPLETED", total });
        } catch (e) {
          const message = e?.message || "export error";
          controller.enqueue(
            new TextEncoder().encode(
              `event: export:error\ndata: ${JSON.stringify({ message })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  }

  if (format === "csv") {
    const pick = (obj) =>
      fields.length ? Object.fromEntries(fields.map((f) => [f, obj[f]])) : obj;
    const rows = items.map(pick);
    const header = Object.keys(rows[0] || {});
    const csv = [header.join(",")]
      .concat(
        rows.map((r) => header.map((h) => JSON.stringify(r[h] ?? "")).join(","))
      )
      .join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Cache-Control": "no-cache",
        "Content-Disposition": `attachment; filename=job_${params.jobId}.csv`,
      },
    });
  }

  return NextResponse.json({ items });
}
