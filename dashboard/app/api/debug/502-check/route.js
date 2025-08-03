import { NextResponse } from "next/server";

/**
 * GET /api/debug/502-check
 * Endpoint de debug para identificar a causa do erro 502
 */
export async function GET(request) {
  try {
    console.log("🚨 502 DEBUG: Starting debug check...");

    const checks = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      checks: {},
    };

    // Check 1: Variáveis de ambiente críticas
    checks.checks.envVars = {
      CLERK_SECRET_KEY: !!process.env.CLERK_SECRET_KEY,
      MONGODB_URI: !!process.env.MONGODB_URI,
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
        !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
      APP_PUBLIC_URL: process.env.APP_PUBLIC_URL || "NOT_SET",
    };

    // Check 2: Importações críticas
    try {
      await import("@/lib/auth");
      checks.checks.authImport = "✅ OK";
    } catch (error) {
      checks.checks.authImport = `❌ ERROR: ${error.message}`;
    }

    try {
      await import("@/lib/db");
      checks.checks.dbImport = "✅ OK";
    } catch (error) {
      checks.checks.dbImport = `❌ ERROR: ${error.message}`;
    }

    try {
      await import("@clerk/nextjs");
      checks.checks.clerkImport = "✅ OK";
    } catch (error) {
      checks.checks.clerkImport = `❌ ERROR: ${error.message}`;
    }

    // Check 3: Verificar se consegue conectar ao MongoDB
    try {
      const { db } = await import("@/lib/db");
      const testResult = await db.findOne("workspaces", {}, { limit: 1 });
      checks.checks.mongoConnection = testResult ? "✅ OK" : "⚠️ NO DATA";
    } catch (error) {
      checks.checks.mongoConnection = `❌ ERROR: ${error.message}`;
    }

    // Check 4: Verificar autenticação
    try {
      const { getCurrentAuth } = await import("@/lib/auth");
      const authResult = await getCurrentAuth();
      checks.checks.authCheck = authResult.userId
        ? "✅ AUTHENTICATED"
        : "❌ NOT_AUTHENTICATED";
    } catch (error) {
      checks.checks.authCheck = `❌ ERROR: ${error.message}`;
    }

    console.log("🚨 502 DEBUG: Results:", checks);

    return NextResponse.json({
      success: true,
      message: "Debug check completed",
      ...checks,
    });
  } catch (error) {
    console.error("🚨 502 DEBUG: Fatal error:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
        message: "Fatal error during debug check",
      },
      { status: 500 }
    );
  }
}
