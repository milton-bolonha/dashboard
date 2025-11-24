/**
 * Stripe Payment Verifier
 *
 * Funções para verificar pagamento no Stripe por session_id ou email
 * Com cache de resultados para evitar chamadas excessivas à API
 */

import Stripe from "stripe";
import { getPlanFromPriceId } from "@/lib/saas/plans";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-11-17.clover",
});

// Cache simples em memória (em produção, usar Redis)
const verificationCache = new Map<
  string,
  { result: PaymentVerificationResult; timestamp: number }
>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export interface PaymentVerificationResult {
  paid: boolean;
  email?: string;
  plan?: "FREE" | "PRO" | "PRO_PLUS";
  customerId?: string;
  sessionId?: string;
  amount?: number;
  currency?: string;
  error?: string;
}

/**
 * Verifica pagamento por session_id do Stripe Checkout
 */
export async function verifyPaymentBySessionId(
  sessionId: string
): Promise<PaymentVerificationResult> {
  // Verificar cache
  const cacheKey = `session_${sessionId}`;
  const cached = verificationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("[Stripe Verifier] ✅ Cache hit for session:", sessionId);
    return cached.result;
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        paid: false,
        error: "STRIPE_SECRET_KEY not configured",
      };
    }

    console.log(
      "[Stripe Verifier] 🔍 Verifying payment by session_id:",
      sessionId
    );

    // Buscar sessão no Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer"],
    });

    // Verificar se pagamento foi completado
    const isPaid =
      session.payment_status === "paid" && session.status === "complete";

    if (!isPaid) {
      const result: PaymentVerificationResult = {
        paid: false,
        email: session.customer_email || undefined,
        error: `Payment status: ${session.payment_status}, Session status: ${session.status}`,
      };
      verificationCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }

    // Extrair informações da sessão
    const email = session.customer_email || undefined;
    const customerId =
      typeof session.customer === "string"
        ? session.customer
        : session.customer?.id;

    // Determinar plano baseado no price_id
    let plan: "FREE" | "PRO" | "PRO_PLUS" = "FREE";
    if (session.line_items?.data && session.line_items.data.length > 0) {
      const priceId = session.line_items.data[0]?.price?.id;
      plan = getPlanFromPriceId(priceId);
    }

    const result: PaymentVerificationResult = {
      paid: true,
      email,
      plan,
      customerId,
      sessionId: session.id,
      amount: session.amount_total ? session.amount_total / 100 : undefined,
      currency: session.currency || undefined,
    };

    // Salvar no cache
    verificationCache.set(cacheKey, { result, timestamp: Date.now() });
    console.log("[Stripe Verifier] ✅ Payment verified:", {
      email,
      plan,
      sessionId,
    });

    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      "[Stripe Verifier] ❌ Error verifying payment:",
      errorMessage
    );

    const result: PaymentVerificationResult = {
      paid: false,
      error: errorMessage,
    };

    // Cache erro por menos tempo (1 minuto)
    verificationCache.set(cacheKey, {
      result,
      timestamp: Date.now() - (CACHE_TTL - 60000),
    });
    return result;
  }
}

/**
 * Verifica pagamento por email do cliente
 * Busca customers no Stripe e verifica se tem pagamentos completos recentes
 */
export async function verifyPaymentByEmail(
  email: string
): Promise<PaymentVerificationResult> {
  // Verificar cache
  const cacheKey = `email_${email}`;
  const cached = verificationCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log("[Stripe Verifier] ✅ Cache hit for email:", email);
    return cached.result;
  }

  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return {
        paid: false,
        error: "STRIPE_SECRET_KEY not configured",
      };
    }

    console.log("[Stripe Verifier] 🔍 Verifying payment by email:", email);

    // Buscar customers por email
    const customers = await stripe.customers.list({
      email: email,
      limit: 10,
    });

    if (customers.data.length === 0) {
      const result: PaymentVerificationResult = {
        paid: false,
        email,
        error: "No customer found with this email",
      };
      verificationCache.set(cacheKey, { result, timestamp: Date.now() });
      return result;
    }

    // Buscar checkout sessions completadas para esses customers
    // (últimas 24 horas)
    const oneDayAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;

    for (const customer of customers.data) {
      // Buscar sessões de checkout completadas
      const sessions = await stripe.checkout.sessions.list({
        customer: customer.id,
        limit: 10,
      });

      // Encontrar sessão paga recente
      const paidSession = sessions.data.find(
        (s) =>
          s.payment_status === "paid" &&
          s.status === "complete" &&
          s.created >= oneDayAgo
      );

      if (paidSession) {
        // Determinar plano
        let plan: "FREE" | "PRO" | "PRO_PLUS" = "FREE";
        if (
          paidSession.line_items?.data &&
          paidSession.line_items.data.length > 0
        ) {
          const priceId = paidSession.line_items.data[0].price.id;
          plan = getPlanFromPriceId(priceId);
        }

        const result: PaymentVerificationResult = {
          paid: true,
          email: customer.email || email,
          plan,
          customerId: customer.id,
          sessionId: paidSession.id,
          amount: paidSession.amount_total
            ? paidSession.amount_total / 100
            : undefined,
          currency: paidSession.currency || undefined,
        };

        // Salvar no cache
        verificationCache.set(cacheKey, { result, timestamp: Date.now() });
        console.log("[Stripe Verifier] ✅ Payment verified by email:", {
          email,
          plan,
        });

        return result;
      }
    }

    // Nenhum pagamento encontrado
    const result: PaymentVerificationResult = {
      paid: false,
      email,
      error: "No recent paid sessions found for this email",
    };
    verificationCache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      "[Stripe Verifier] ❌ Error verifying payment by email:",
      errorMessage
    );

    const result: PaymentVerificationResult = {
      paid: false,
      email,
      error: errorMessage,
    };

    // Cache erro por menos tempo
    verificationCache.set(cacheKey, {
      result,
      timestamp: Date.now() - (CACHE_TTL - 60000),
    });
    return result;
  }
}

/**
 * Limpa cache de verificação (útil para testes ou quando necessário forçar nova verificação)
 */
export function clearVerificationCache(sessionId?: string, email?: string) {
  if (sessionId) {
    verificationCache.delete(`session_${sessionId}`);
  }
  if (email) {
    verificationCache.delete(`email_${email}`);
  }
  if (!sessionId && !email) {
    verificationCache.clear();
  }
}
