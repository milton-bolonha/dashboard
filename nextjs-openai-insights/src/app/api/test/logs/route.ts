import { NextResponse } from "next/server";

/**
 * GET /api/test/logs
 * Retorna logs do servidor
 * 
 * Query params:
 * - limit: número máximo de logs (padrão: 100)
 * - level: filtrar por nível (log, error, warn, info)
 * - since: timestamp para filtrar logs mais recentes que este valor
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "100", 10);
    const level = searchParams.get("level");
    const since = searchParams.get("since");

    // Em produção, isso buscaria logs reais do servidor
    // Por enquanto, retornamos estrutura básica
    // Nota: Logs reais seriam coletados via sistema de logging (ex: Winston, Pino)
    
    const logs: Array<{
      timestamp: string;
      message: string;
      type: string;
      context?: string;
      level?: string;
    }> = [];

    // Exemplo de log do sistema
    logs.push({
      timestamp: new Date().toISOString(),
      message: "Logs endpoint accessed",
      type: "system",
      context: "server",
      level: "info",
    });

    // Filtrar por nível se especificado
    let filteredLogs = logs;
    if (level) {
      filteredLogs = filteredLogs.filter((log) => log.level === level);
    }

    // Filtrar por timestamp se especificado
    if (since) {
      const sinceTimestamp = parseInt(since, 10);
      filteredLogs = filteredLogs.filter((log) => {
        const logTime = new Date(log.timestamp).getTime();
        return logTime > sinceTimestamp;
      });
    }

    // Limitar quantidade
    const limitedLogs = filteredLogs.slice(-limit);

    return NextResponse.json({
      logs: limitedLogs,
      total: limitedLogs.length,
      limit,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[API] /api/test/logs - Erro:", errorMessage);
    return NextResponse.json(
      { error: "Failed to fetch logs", details: errorMessage },
      { status: 500 }
    );
  }
}

