import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getCurrentAuth } from "@/lib/auth";

/**
 * GET /api/auth/debug
 * Debug do status de autenticação - SEM MIDDLEWARE
 */
export async function GET(request) {
  try {
    console.log("🔐 DEBUG: Verificando status de autenticação...");

    // Comparar ambos os métodos para debug
    const authDataDirect = auth();
    const authDataCentralized = await getCurrentAuth();

    console.log("🔐 DEBUG: Auth data direto:", authDataDirect);
    console.log("🔐 DEBUG: Auth data centralizado:", authDataCentralized);

    const debug = {
      timestamp: new Date().toISOString(),
      authDirect: {
        userId: authDataDirect.userId,
        sessionId: authDataDirect.sessionId,
        orgId: authDataDirect.orgId,
        orgRole: authDataDirect.orgRole,
        orgSlug: authDataDirect.orgSlug,
      },
      authCentralized: {
        userId: authDataCentralized.userId,
        method: authDataCentralized.method || "unknown",
      },
      isAuthenticated: !!authDataCentralized.userId,
      userAgent: request.headers.get("user-agent") || "N/A",
    };

    console.log("🔐 DEBUG: Resultado:", debug);

    return NextResponse.json({
      success: true,
      debug,
      message: debug.isAuthenticated
        ? "✅ Usuário autenticado com sucesso"
        : "❌ Usuário NÃO autenticado",
    });
  } catch (error) {
    console.error("🔐 DEBUG: Erro na verificação:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
        message: "❌ Erro ao verificar autenticação",
      },
      { status: 500 }
    );
  }
}
