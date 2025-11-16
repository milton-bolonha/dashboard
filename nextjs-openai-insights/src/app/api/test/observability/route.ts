import { NextResponse } from "next/server";

/**
 * GET /api/test/observability
 * Retorna métricas de observabilidade do sistema
 * 
 * Nota: Em produção, isso poderia buscar de um sistema de métricas real
 * Por enquanto, retorna estrutura básica que será preenchida pelo cliente
 */
export async function GET() {
  try {
    // Em produção, isso buscaria métricas reais do servidor
    // Por enquanto, retornamos estrutura básica
    return NextResponse.json({
      health: 100,
      latencyP95: 0,
      errorRate: 0,
      activeUsers: 0,
      timestamp: Date.now(),
      requests: [],
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[API] /api/test/observability - Erro:", errorMessage);
    return NextResponse.json(
      { error: "Failed to fetch observability data", details: errorMessage },
      { status: 500 }
    );
  }
}

