import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

/**
 * GET /api/auth/debug
 * Debug do status de autenticação - SEM MIDDLEWARE
 */
export async function GET(request) {
  try {
    console.log("🔐 DEBUG: Verificando status de autenticação...");

    const authData = auth();
    console.log("🔐 DEBUG: Auth data completo:", authData);

    const debug = {
      timestamp: new Date().toISOString(),
      auth: {
        userId: authData.userId,
        sessionId: authData.sessionId,
        orgId: authData.orgId,
        orgRole: authData.orgRole,
        orgSlug: authData.orgSlug,
      },
      isAuthenticated: !!authData.userId,
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
