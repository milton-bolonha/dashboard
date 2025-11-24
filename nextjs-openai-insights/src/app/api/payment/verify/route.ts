import { NextResponse } from "next/server";
import {
  verifyPaymentBySessionId,
  verifyPaymentByEmail,
  clearVerificationCache,
} from "@/lib/payment/stripe-verifier";

/**
 * Payment Verification Endpoint
 *
 * Verifica pagamento no Stripe por session_id ou email
 *
 * GET /api/payment/verify?session_id=cs_xxx
 * GET /api/payment/verify?email=user@example.com
 * GET /api/payment/verify?session_id=cs_xxx&force=true (força nova verificação)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    const email = searchParams.get("email");
    const force = searchParams.get("force") === "true";

    // Validar que temos pelo menos um parâmetro
    if (!sessionId && !email) {
      return NextResponse.json(
        { error: "session_id or email parameter is required" },
        { status: 400 }
      );
    }

    // Limpar cache se forçar
    if (force) {
      if (sessionId) clearVerificationCache(sessionId);
      if (email) clearVerificationCache(undefined, email);
    }

    let result;

    // Priorizar session_id se ambos estiverem presentes
    if (sessionId) {
      console.log("[Payment Verify] 🔍 Verifying by session_id:", sessionId);
      result = await verifyPaymentBySessionId(sessionId);
    } else if (email) {
      console.log("[Payment Verify] 🔍 Verifying by email:", email);
      result = await verifyPaymentByEmail(email);
    } else {
      return NextResponse.json(
        { error: "session_id or email parameter is required" },
        { status: 400 }
      );
    }

    // Log resultado
    if (result.paid) {
      console.log("[Payment Verify] ✅ Payment verified:", {
        email: result.email,
        plan: result.plan,
        sessionId: result.sessionId,
      });
    } else {
      console.log("[Payment Verify] ❌ Payment not verified:", result.error);
    }

    return NextResponse.json(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Payment Verify] ❌ Unexpected error:", errorMessage);

    return NextResponse.json(
      {
        paid: false,
        error: "Verification failed",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
