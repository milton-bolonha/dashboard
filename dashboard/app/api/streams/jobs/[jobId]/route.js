import { NextResponse } from "next/server";
import { sseManager } from "@/lib/sse-manager";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const { jobId } = await params;
  const { searchParams } = new URL(request.url);
  const guestId = searchParams.get("guest_id");
  const token = searchParams.get("token");
  if (!jobId)
    return NextResponse.json({ error: "jobId required" }, { status: 400 });

  const base = guestId ? `guest:${guestId}:job:${jobId}` : `job:${jobId}`;
  const key = token ? `${base}:token:${token}` : base;
  console.log("[SSE Route] 🔌 ========== NOVA CONEXÃO SSE ==========");
  console.log("[SSE Route] 🔌 Parâmetros:", {
    jobId,
    guestId: guestId || "N/A",
    token: token ? "***" : "N/A",
    key,
  });
  console.log("[SSE Route] 🔌 ======================================");

  // Rate limit por IP (máx. 10 conexões simultâneas por IP)
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("cf-connecting-ip") ||
    "unknown";
  if (!globalThis.__sseIpCounts) globalThis.__sseIpCounts = new Map();
  const counts = globalThis.__sseIpCounts;
  const current = counts.get(ip) || 0;
  if (current >= 10) {
    return NextResponse.json(
      { error: "Too many SSE connections" },
      { status: 429 }
    );
  }
  counts.set(ip, current + 1);

  const stream = new ReadableStream({
    start(controller) {
      console.log(
        "[SSE Route] ✅ Stream iniciado, adicionando ao SSE Manager..."
      );
      sseManager.add(key, controller);

      // Emite um evento inicial para confirmar conexão do cliente
      try {
        const connectEvent = `event: sse:connected\ndata: ${JSON.stringify({
          ok: true,
          key,
          jobId,
          timestamp: Date.now(),
        })}\n\n`;
        controller.enqueue(new TextEncoder().encode(connectEvent));
        console.log("[SSE Route] ✅ Evento sse:connected enviado");
      } catch (err) {
        console.error("[SSE Route] ❌ Erro ao enviar evento inicial:", err);
      }
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": keep-alive\n\n"));
        } catch (err) {
          console.debug(
            "[SSE Route] ⚠️ Erro no keep-alive (fechando conexão):",
            err
          );
          clearInterval(keepAlive);
        }
      }, 30000);

      const timeoutId = setTimeout(() => {
        console.log(
          "[SSE Route] ⏱️ Timeout de 120s atingido, fechando conexão"
        );
        try {
          controller.close();
        } catch (err) {
          console.debug("[SSE Route] ⚠️ Erro ao fechar controller:", err);
        }
        clearInterval(keepAlive);
        sseManager.remove(key);
        const c = counts.get(ip) || 1;
        counts.set(ip, Math.max(c - 1, 0));
      }, 120000);

      request.signal.addEventListener("abort", () => {
        console.log("[SSE Route] 🔌 Cliente desconectou (abort signal)");
        clearInterval(keepAlive);
        clearTimeout(timeoutId);
        sseManager.remove(key);
        const c = counts.get(ip) || 1;
        counts.set(ip, Math.max(c - 1, 0));
      });
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
