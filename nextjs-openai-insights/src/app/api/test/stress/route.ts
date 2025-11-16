import { NextResponse } from "next/server";

/**
 * POST /api/test/stress
 * Executa stress test no servidor
 * 
 * Body:
 * - endpoint: URL para testar
 * - requests: número de requisições
 * - interval: intervalo entre requisições (ms)
 * - method: método HTTP (padrão: GET)
 * - body: corpo da requisição (opcional)
 */
export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    
    if (!body) {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    const { endpoint, requests, interval, method = "GET", requestBody } = body;

    if (!endpoint || typeof requests !== "number" || typeof interval !== "number") {
      return NextResponse.json(
        { error: "endpoint, requests, and interval are required" },
        { status: 400 }
      );
    }

    // Validar que endpoint é relativo (segurança)
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      return NextResponse.json(
        { error: "Only relative endpoints are allowed" },
        { status: 400 }
      );
    }

    // Validar limites de segurança
    if (requests > 100) {
      return NextResponse.json(
        { error: "Maximum 100 requests allowed per test" },
        { status: 400 }
      );
    }

    if (interval < 100) {
      return NextResponse.json(
        { error: "Minimum interval is 100ms" },
        { status: 400 }
      );
    }

    // Executar stress test
    const startTime = Date.now();
    const results: Array<{
      index: number;
      success: boolean;
      status: number;
      latency: number;
      error?: string;
    }> = [];

    const makeRequest = async (index: number): Promise<void> => {
      const reqStart = performance.now();
      try {
        const response = await fetch(endpoint, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: requestBody ? JSON.stringify(requestBody) : undefined,
        });

        const reqEnd = performance.now();
        const latency = reqEnd - reqStart;

        results.push({
          index,
          success: response.ok,
          status: response.status,
          latency,
        });
      } catch (error) {
        const reqEnd = performance.now();
        const latency = reqEnd - reqStart;
        results.push({
          index,
          success: false,
          status: 0,
          latency,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };

    // Executar requisições com intervalo
    const promises: Promise<void>[] = [];
    for (let i = 0; i < requests; i++) {
      promises.push(
        new Promise((resolve) => {
          setTimeout(() => {
            makeRequest(i).then(resolve);
          }, i * interval);
        })
      );
    }

    await Promise.all(promises);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Calcular estatísticas
    const successCount = results.filter((r) => r.success).length;
    const errorCount = results.filter((r) => !r.success).length;
    const latencies = results.map((r) => r.latency).sort((a, b) => a - b);
    const avgLatency = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0;
    const p95Index = Math.floor(latencies.length * 0.95);
    const p95Latency = latencies[p95Index] || 0;

    return NextResponse.json({
      success: true,
      endpoint,
      requests,
      interval,
      startTime,
      endTime,
      duration,
      successCount,
      errorCount,
      successRate: (successCount / requests) * 100,
      avgLatency,
      p95Latency,
      minLatency: latencies[0] || 0,
      maxLatency: latencies[latencies.length - 1] || 0,
      results,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[API] /api/test/stress - Erro:", errorMessage);
    return NextResponse.json(
      { error: "Failed to execute stress test", details: errorMessage },
      { status: 500 }
    );
  }
}

