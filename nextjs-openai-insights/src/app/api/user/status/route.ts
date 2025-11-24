import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";
import type { UserDocument } from "@/lib/db/models/User";
import { getPlanLimits } from "@/lib/saas/plans";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Get User Status Endpoint
 *
 * Retorna status completo do usuário:
 * - Dados do MongoDB (se tem conta)
 * - Plano atual
 * - Usage atual
 * - Limites do plano
 *
 * GET /api/user/status
 */
export async function GET() {
  try {
    // Tentar pegar usuário do Clerk
    let clerkUser;
    try {
      clerkUser = await currentUser();
    } catch (e) {
      // Se não tem Clerk configurado ou não está logado, retornar null
      clerkUser = null;
    }

    if (!clerkUser) {
      // Usuário não logado - retornar status guest
      return NextResponse.json({
        isAuthenticated: false,
        isGuest: true,
        source: "guest",
        message: "User not authenticated",
      });
    }

    // Buscar usuário no MongoDB
    const user = await db.findOne<UserDocument>("users", {
      clerkUserId: clerkUser.id,
    });

    if (!user) {
      // Usuário não existe no MongoDB ainda
      return NextResponse.json({
        isAuthenticated: true,
        isGuest: true,
        clerkUserId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        source: "clerk_only",
        message: "User authenticated but not found in database",
        plan: "FREE",
        usage: {
          tokensUsed: 0,
          companiesCount: 0,
          contactsCount: 0,
          filesUploaded: 0,
        },
        limits: getPlanLimits("FREE"),
      });
    }

    // Usuário encontrado - retornar dados completos
    const planLimits = getPlanLimits(user.plan);

    return NextResponse.json({
      isAuthenticated: true,
      isGuest: false,
      clerkUserId: user.clerkUserId,
      email: user.email,
      name: user.name,
      source: "mongodb",
      plan: user.plan,
      stripeCustomerId: user.stripeCustomerId,
      subscriptionId: user.subscriptionId,
      subscriptionStatus: user.subscriptionStatus,
      usage: user.usage || {
        tokensUsed: 0,
        companiesCount: 0,
        contactsCount: 0,
        filesUploaded: 0,
        lastResetDate: new Date(),
      },
      limits: planLimits,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[User Status] ❌ Error fetching user status:", errorMessage);

    return NextResponse.json(
      {
        error: "Failed to fetch user status",
        details: errorMessage,
      },
      { status: 500 }
    );
  }
}
