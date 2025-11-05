import { NextResponse } from "next/server";
// SSE Manager agora é um singleton com uma interface mais simples
import { sseManager } from "@/lib/sse-manager";
import { getJob } from "@/lib/db/prompt-jobs";
import { withMongoConnection } from "@/lib/db";
import crypto from "crypto";

export const runtime = "nodejs";

export async function GET(request, { params }) {
  const { jobId } = await params;
  const { searchParams } = new URL(request.url);
  const guestId = searchParams.get("guest_id");
  const token = searchParams.get("token");
  let job;

  try {
    // 1. Validação de Segurança
    if (!jobId || !guestId || !token) {
      return NextResponse.json(
        { error: "jobId, guest_id, and token are required" },
        { status: 401 }
      );
    }

    job = await withMongoConnection(async () => await getJob(jobId), {
      label: "sse:get-job",
      stage: "sse",
      retries: 2,
      metadata: { jobId, guestId },
    });
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.guestId !== guestId) {
      return NextResponse.json({ error: "Guest ID mismatch" }, { status: 403 });
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    if (job.accessTokenHash !== tokenHash) {
      return NextResponse.json(
        { error: "Invalid access token" },
        { status: 403 }
      );
    }
    console.log(`[SSE Route] ✅ Acesso autorizado para job ${jobId}`);
  } catch (authError) {
    console.error(
      `[SSE Route] ❌ Erro de autenticação para job ${jobId}:`,
      authError
    );
    const statusCode = authError?.code === "MONGODB_CIRCUIT_OPEN" ? 503 : 500;
    const body = {
      error:
        statusCode === 503 ? "MongoDB unavailable" : "Authentication failed",
      retry: statusCode === 503 ? "retry-later" : undefined,
    };
    return NextResponse.json(body, { status: statusCode });
  }

  const key = `guest:${guestId}:job:${jobId}`;
  console.log(`[SSE Route] 🔌 Nova conexão para a chave: ${key}`);

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      const sendEvent = (type, payload) => {
        controller.enqueue(
          encoder.encode(`event: ${type}\ndata: ${JSON.stringify(payload)}\n\n`)
        );
      };

      // O handler que será chamado pelo sseManager para enviar dados
      const onEvent = (event) => {
        try {
          // ⭐ CORREÇÃO CRÍTICA: Enviar eventos nomeados
          // O frontend usa addEventListener("job:status", ...) e precisa do nome do evento.
          sendEvent(event.type, event.payload);
        } catch (e) {
          console.error("[SSE Route] ❌ Erro ao enfileirar evento:", e);
        }
      };

      console.log(
        `[SSE Route] ➕ Adicionando handler ao SSE Manager para: ${key}`
      );
      sseManager.add(key, onEvent);
      console.log(`[SSE Route] ✅ Handler adicionado. Verificando buffer...`);

      // Forçar flush imediato com comentário keep-alive e snapshot de status atual
      controller.enqueue(encoder.encode(`: connected ${Date.now()}\n\n`));
      console.log(`[SSE Route] ✅ Comentário de conexão enviado`);
      if (job) {
        const initialStatus = {
          jobId,
          status: job.status || "QUEUED",
          progress: job.totals
            ? {
                current: job.progress?.current || 0,
                total: job.totals.items || job.progress?.total || 0,
                remaining:
                  job.progress?.remaining ??
                  Math.max(
                    (job.totals.items || 0) - (job.progress?.current || 0),
                    0
                  ),
              }
            : job.progress || { current: 0, total: 0, remaining: 0 },
        };
        try {
          sendEvent("job:status", initialStatus);
        } catch (err) {
          console.error("[SSE Route] ❌ Erro ao enviar status inicial:", err);
        }
      }

      // Lógica de keep-alive e cleanup
      // IMPORTANTE: Netlify Functions têm timeout de 60s, então precisamos manter conexão viva
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(": keep-alive\n\n"));
        } catch (err) {
          console.error("[SSE Route] ❌ Erro ao enviar keep-alive:", err);
          clearInterval(keepAlive);
        }
      }, 20000); // 20 segundos (mais frequente para evitar timeout)

      request.signal.addEventListener("abort", () => {
        // Log removido (muito repetitivo)
        clearInterval(keepAlive);
        sseManager.remove(key, onEvent);
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Essencial para NGINX/Vercel
    },
  });
}
