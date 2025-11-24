import { NextResponse } from "next/server";
import { db } from "@/lib/db/mongodb";
import type { UserDocument } from "@/lib/db/models/User";

/**
 * DEVELOPMENT ONLY: Test endpoint for Stripe webhooks
 * Allows testing webhook functionality without configuring Stripe Dashboard
 *
 * Usage:
 * POST /api/webhooks/stripe/test
 * Body: { "eventType": "checkout.session.completed", "userId": "test_user", ... }
 */

/**
 * Create mock Stripe event for testing
 */
function createMockStripeEvent(eventType: string, mockData?: any) {
  const baseEvent = {
    id: `evt_test_${Date.now()}`,
    object: "event",
    api_version: "2020-08-27",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: mockData || {},
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_test_${Date.now()}`,
      idempotency_key: null,
    },
    type: eventType,
  };

  // Customize based on event type
  if (eventType === "checkout.session.completed") {
    baseEvent.data.object = {
      id: `cs_test_${Date.now()}`,
      object: "checkout.session",
      customer_email: mockData?.customerEmail || "test@example.com",
      metadata: {
        userId: mockData?.userId,
        sessionId: mockData?.sessionId,
      },
      ...mockData,
    };
  } else if (
    eventType === "customer.subscription.updated" ||
    eventType === "customer.subscription.created"
  ) {
    baseEvent.data.object = {
      id: `sub_test_${Date.now()}`,
      object: "subscription",
      customer: mockData?.customerId || `cus_test_${Date.now()}`,
      status: mockData?.status || "active",
      items: {
        data: [
          {
            price: {
              id: mockData?.priceId || "price_test_pro",
            },
          },
        ],
      },
      metadata: {
        userId: mockData?.userId,
      },
      ...mockData,
    };
  }

  return baseEvent;
}

export async function POST(request: Request) {
  // Only allow in development
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Test endpoint only available in development" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { eventType, ...mockData } = body;

    if (!eventType) {
      return NextResponse.json(
        { error: "eventType is required" },
        { status: 400 }
      );
    }

    console.log("[Stripe Test Webhook] 🔧 Creating mock event:", {
      eventType,
      mockData,
    });

    // Create mock event
    const event = createMockStripeEvent(eventType, mockData);

    console.log("[Stripe Test Webhook] 📥 Processing mock event:", event.type);

    // Process checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      let userId = session.metadata?.userId;
      const sessionId =
        session.metadata?.sessionId || session.client_reference_id;

      if (!userId) {
        // Create a test user if none provided
        const testUserId = `test_user_${Date.now()}`;
        console.log("[Stripe Test Webhook] 🆕 Creating test user:", testUserId);
        userId = testUserId;
      }

      console.log(
        "[Stripe Test Webhook] 🔄 Processing test checkout completion",
        {
          userId,
          sessionId: sessionId || "all",
          customerEmail: session.customer_email,
        }
      );

      try {
        // 1. Create or update user in MongoDB
        // ✅ CORREÇÃO: Verificar primeiro por email para evitar duplicatas
        const customerEmail = session.customer_email;

        let existingUser: UserDocument | null = null;

        // Tentar encontrar por email primeiro (se email existe)
        if (customerEmail) {
          existingUser = await db.findOne<UserDocument>("users", {
            email: customerEmail,
          });
        }

        // Se não encontrou por email, tentar por clerkUserId
        if (!existingUser) {
          existingUser = await db.findOne<UserDocument>("users", {
            clerkUserId: userId,
          });
        }

        const userDoc: Omit<UserDocument, "_id" | "createdAt" | "updatedAt"> = {
          clerkUserId: userId,
          email: customerEmail || undefined,
          plan: "PRO", // Test with PRO plan
          usage: existingUser?.usage || {
            tokensUsed: 0,
            companiesCount: 0,
            contactsCount: 0,
            filesUploaded: 0,
            lastResetDate: new Date(),
          },
        };

        // Se encontrou usuário existente, atualizar
        if (existingUser) {
          console.log("[Stripe Test Webhook] 🔄 Updating existing user:", {
            _id: existingUser._id,
            email: existingUser.email,
            clerkUserId: existingUser.clerkUserId,
            newClerkUserId: userId,
          });

          await db.updateOne(
            "users",
            { _id: existingUser._id } as any, // ObjectId precisa ser tratado como any para TypeScript
            {
              $set: {
                clerkUserId: userId, // Atualizar clerkUserId se mudou
                email: customerEmail || existingUser.email,
                plan: "PRO",
                updatedAt: new Date(),
              },
            }
          );
        } else {
          // Criar novo usuário
          // ✅ CORREÇÃO: Usar email como filtro se disponível para evitar duplicatas
          const upsertFilter = customerEmail
            ? { email: customerEmail }
            : { clerkUserId: userId };

          console.log("[Stripe Test Webhook] 🆕 Creating new user:", {
            clerkUserId: userId,
            email: customerEmail,
            upsertFilter,
          });

          await db.findOneAndUpdate<UserDocument>(
            "users",
            upsertFilter,
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
        }

        console.log(
          "[Stripe Test Webhook] ✅ Test user created/updated in MongoDB:",
          userId
        );

        // 2. Migrate guest data to member
        // ✅ CORREÇÃO: Migração não pode acessar localStorage no servidor
        // A migração deve ser feita no cliente após pagamento confirmado
        // Por enquanto, apenas logar que migração seria necessária
        console.log(
          "[Stripe Test Webhook] ℹ️ Migration should be triggered from client after payment confirmation"
        );
        console.log(
          "[Stripe Test Webhook] ℹ️ User created/updated in MongoDB. Client should call migration endpoint."
        );

        const migrationResult = {
          success: true,
          workspacesMigrated: 0,
          companiesMigrated: 0,
          errors: [
            "Migration skipped: Cannot access localStorage from server. Client should trigger migration after payment confirmation.",
          ],
        };

        return NextResponse.json({
          success: true,
          message: "Test webhook processed successfully",
          userId,
          migration: migrationResult,
          event: {
            type: event.type,
            id: event.id,
          },
        });
      } catch (migrationError) {
        const errorMessage =
          migrationError instanceof Error
            ? migrationError.message
            : String(migrationError);
        console.error(
          "[Stripe Test Webhook] ❌ Error processing test webhook:",
          {
            userId,
            error: errorMessage,
          }
        );
        return NextResponse.json(
          { error: "Test webhook processing failed", details: errorMessage },
          { status: 500 }
        );
      }
    }

    // Handle other test events
    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.created"
    ) {
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId;

      if (userId) {
        // Import plans helper
        const { getPlanFromPriceId } = await import("@/lib/saas/plans");
        const priceId = subscription.items.data[0].price.id;
        const newPlan = getPlanFromPriceId(priceId);

        await db.updateOne(
          "users",
          { clerkUserId: userId },
          {
            $set: {
              plan: newPlan,
              stripeCustomerId: subscription.customer as string,
              subscriptionId: subscription.id,
              subscriptionStatus: subscription.status,
              updatedAt: new Date(),
            },
          }
        );
        console.log(
          `[Stripe Test Webhook] ✅ Test plan updated for user ${userId} to ${newPlan}`
        );

        return NextResponse.json({
          success: true,
          message: "Test subscription updated",
          userId,
          newPlan,
        });
      }
    }

    // Unknown test event type
    console.log(
      "[Stripe Test Webhook] ℹ️ Unhandled test event type:",
      event.type
    );
    return NextResponse.json({
      success: true,
      message: "Test event received but not processed",
      eventType: event.type,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      "[Stripe Test Webhook] ❌ Unexpected error in test webhook:",
      errorMessage
    );
    return NextResponse.json(
      { error: "Test webhook processing failed", details: errorMessage },
      { status: 500 }
    );
  }
}
