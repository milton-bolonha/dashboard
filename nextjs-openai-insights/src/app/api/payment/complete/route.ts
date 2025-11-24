import { NextResponse } from "next/server";
import {
  verifyPaymentBySessionId,
  verifyPaymentByEmail,
} from "@/lib/payment/stripe-verifier";
// Migration será feita no cliente após onboarding
import { db } from "@/lib/db/mongodb";
import type { UserDocument } from "@/lib/db/models/User";
import { v4 as uuidv4 } from "uuid";

/**
 * Payment Completion Endpoint
 *
 * Completa processo de pagamento:
 * 1. Verifica pagamento no Stripe
 * 2. Cria/atualiza usuário no MongoDB
 * 3. Migra dados do localStorage → MongoDB
 * 4. Retorna status de onboarding
 *
 * POST /api/payment/complete
 * Body: { session_id?: string, email?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { session_id, email } = body;

    // Validar que temos pelo menos um parâmetro
    if (!session_id && !email) {
      return NextResponse.json(
        { error: "session_id or email is required" },
        { status: 400 }
      );
    }

    console.log("[Payment Complete] 🔄 Starting payment completion", {
      session_id,
      email,
    });

    // 1. Verificar pagamento no Stripe
    let verification;
    if (session_id) {
      verification = await verifyPaymentBySessionId(session_id);
    } else if (email) {
      verification = await verifyPaymentByEmail(email);
    } else {
      return NextResponse.json(
        { error: "session_id or email is required" },
        { status: 400 }
      );
    }

    if (!verification.paid) {
      return NextResponse.json(
        {
          success: false,
          error: "Payment not verified",
          details: verification.error,
        },
        { status: 400 }
      );
    }

    if (!verification.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Email not found in payment verification",
        },
        { status: 400 }
      );
    }

    // 2. Determinar userId
    // Primeiro, tentar encontrar usuário existente por email
    let userId: string | undefined;
    const existingUser = await db.findOne<UserDocument>("users", {
      email: verification.email,
    });

    if (existingUser) {
      userId = existingUser.clerkUserId;
      console.log("[Payment Complete] ✅ Found existing user:", userId);
    } else {
      // Criar novo userId temporário (será vinculado ao Clerk no onboarding)
      userId = `stripe_${uuidv4()}`;
      console.log("[Payment Complete] 🆕 Generated temporary userId:", userId);
    }

    // 3. Criar ou atualizar usuário no MongoDB
    const userDoc: Omit<UserDocument, "_id" | "createdAt" | "updatedAt"> = {
      clerkUserId: userId,
      email: verification.email,
      plan: verification.plan || "PRO", // Default to PRO se não conseguir determinar
      stripeCustomerId: verification.customerId,
      usage: {
        tokensUsed: 0,
        companiesCount: 0,
        contactsCount: 0,
        filesUploaded: 0,
        lastResetDate: new Date(),
      },
    };

    await db.findOneAndUpdate<UserDocument>(
      "users",
      { clerkUserId: userId },
      {
        $set: {
          ...userDoc,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true }
    );

    console.log(
      "[Payment Complete] ✅ User created/updated in MongoDB:",
      userId
    );

    // ✅ CORREÇÃO: Migração NÃO pode ser feita aqui (servidor não tem acesso ao localStorage)
    // A migração será feita no cliente após onboarding através de /api/migration/migrate
    console.log(
      "[Payment Complete] ℹ️ Migration will be triggered from client after onboarding"
    );

    // 5. Determinar se precisa de onboarding
    // Precisa de onboarding se:
    // - Não tem Clerk account (userId começa com "stripe_")
    // - Ou se não tem nome completo no perfil
    const needsOnboarding =
      userId.startsWith("stripe_") ||
      !existingUser?.name ||
      existingUser?.name.trim() === "";

    return NextResponse.json({
      success: true,
      userId,
      email: verification.email,
      plan: verification.plan || "PRO",
      needsOnboarding,
      // Migration será feita no cliente após onboarding
      migration: {
        success: false,
        workspacesMigrated: 0,
        companiesMigrated: 0,
        errors: [
          "Migration skipped: Will be triggered from client after onboarding",
        ],
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      "[Payment Complete] ❌ Error completing payment:",
      errorMessage
    );

    return NextResponse.json(
      {
        success: false,
        error: "Payment completion failed",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
