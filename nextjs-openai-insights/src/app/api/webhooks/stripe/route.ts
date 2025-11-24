import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { migrateGuestDataToMember } from "@/lib/db/migration-helpers";
import { db } from "@/lib/db/mongodb";
import type { UserDocument } from "@/lib/db/models/User";

/**
 * DEVELOPMENT HELPER: Create mock Stripe event for testing
 */
function createMockStripeEvent(eventType: string, mockData?: any) {
  const baseEvent = {
    id: `evt_mock_${Date.now()}`,
    object: "event",
    api_version: "2020-08-27",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: mockData || {},
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_mock_${Date.now()}`,
      idempotency_key: null,
    },
    type: eventType,
  };

  // Customize based on event type
  if (eventType === "checkout.session.completed") {
    baseEvent.data.object = {
      id: "cs_test_mock_session",
      object: "checkout.session",
      customer_email: mockData?.customerEmail || "test@example.com",
      metadata: {
        userId: mockData?.userId || `mock_user_${Date.now()}`,
        sessionId: mockData?.sessionId || "session_mock",
      },
      ...mockData,
    };
  }

  return baseEvent;
}

/**
 * Stripe Webhook Handler
 * Processes payment confirmation events and migrates guest data to MongoDB
 *
 * Security:
 * - Validates Stripe webhook signature
 * - Only processes events for authenticated users
 * - Associates all guest data with userId in MongoDB
 *
 * Events handled:
 * - checkout.session.completed: Migrate guest data to member after payment
 */
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("[Stripe Webhook] ❌ Missing stripe-signature header");
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    // Initialize Stripe
    const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    let event;

    // DEVELOPMENT MODE: Allow testing without webhook secret
    // PRODUCTION MODE: ALWAYS validate signature
    const isDevelopment = process.env.NODE_ENV !== "production";
    const hasWebhookSecret =
      process.env.STRIPE_WEBHOOK_SECRET &&
      process.env.STRIPE_WEBHOOK_SECRET.length > 10;

    // Security logging
    console.log("[Stripe Webhook] 🔐 Security check", {
      environment: process.env.NODE_ENV,
      hasSecret: hasWebhookSecret,
      hasSignature: !!signature,
      timestamp: new Date().toISOString(),
    });

    if (isDevelopment && !hasWebhookSecret) {
      // DEV MODE: Allow testing without secret (for local development only)
      console.warn(
        "[Stripe Webhook] ⚠️ DEVELOPMENT MODE: Skipping signature validation"
      );
      console.warn(
        "[Stripe Webhook] ⚠️ This is INSECURE and should NEVER be used in production"
      );
      console.warn(
        "[Stripe Webhook] ⚠️ Set STRIPE_WEBHOOK_SECRET before deploying to production"
      );

      try {
        event = JSON.parse(body);
        console.log(
          "[Stripe Webhook] 🔧 DEV MODE: Event parsed (unvalidated):",
          event.type
        );

        // Add dev-mode marker to event
        (event as any).__DEV_MODE_UNVALIDATED__ = true;
      } catch (parseErr) {
        console.error(
          "[Stripe Webhook] ❌ Failed to parse webhook body:",
          parseErr
        );
        return NextResponse.json(
          { error: "Invalid JSON in development mode" },
          { status: 400 }
        );
      }
    } else {
      // PRODUCTION MODE or DEV MODE WITH SECRET: Always validate signature
      if (!signature) {
        console.error("[Stripe Webhook] ❌ Missing stripe-signature header");
        return NextResponse.json(
          { error: "Missing signature" },
          { status: 400 }
        );
      }

      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        console.error(
          "[Stripe Webhook] ❌ STRIPE_WEBHOOK_SECRET not configured"
        );
        return NextResponse.json(
          { error: "Webhook secret not configured" },
          { status: 500 }
        );
      }

      try {
        event = stripe.webhooks.constructEvent(
          body,
          signature,
          process.env.STRIPE_WEBHOOK_SECRET
        );
        console.log("[Stripe Webhook] ✅ Signature validated successfully");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        console.error(
          "[Stripe Webhook] ❌ Signature verification failed:",
          errorMessage
        );
        return NextResponse.json(
          { error: "Invalid signature" },
          { status: 400 }
        );
      }
    }

    console.log("[Stripe Webhook] 📥 Received event:", event.type);

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      // 1. Try to get userId from metadata
      let userId = session.metadata?.userId;
      const sessionId =
        session.metadata?.sessionId || session.client_reference_id;

      if (!userId) {
        // If no userId, check if we have a client_reference_id (sessionId)
        // If so, we might need to create a placeholder user or handle it differently.
        // But wait, the migration logic REQUIRES a userId to migrate TO.
        // If the user just paid but has no account, we need to create one?
        // Or does the payment flow imply they signed up?
        // The user said: "pagou a gente cria a conta".
        // So we should create a new User here if one doesn't exist!

        console.log(
          "[Stripe Webhook] ⚠️ No userId in metadata, attempting to create user from session/email"
        );

        if (session.customer_email) {
          // Check if user exists by email
          const existingUser = await db.findOne<UserDocument>("users", {
            email: session.customer_email,
          });
          if (existingUser) {
            userId = existingUser.clerkUserId;
            console.log(
              "[Stripe Webhook] ✅ Found existing user by email:",
              userId
            );
          } else {
            // Create a new "Pending" user or use a placeholder ID?
            // Since we don't have Clerk ID yet, we might need to generate one or use Stripe Customer ID as temporary ID.
            // Let's use a UUID for now and they can "claim" it later?
            // Or better: We can't easily create a Clerk user from here without Clerk API key (which we might have).
            // But for now, let's assume we generate a placeholder ID.
            const { v4: uuidv4 } = await import("uuid");
            userId = `stripe_generated_${uuidv4()}`;
            console.log(
              "[Stripe Webhook] 🆕 Generated placeholder userId:",
              userId
            );
          }
        } else {
          console.error(
            "[Stripe Webhook] ❌ Missing userId and customer_email"
          );
          return NextResponse.json(
            { error: "Missing userId and email" },
            { status: 400 }
          );
        }
      }

      console.log("[Stripe Webhook] 🔄 Processing checkout.session.completed", {
        userId,
        sessionId: sessionId || "all",
        customerEmail: session.customer_email,
      });

      try {
        // 1. Create or update user in MongoDB with active plan
        const userDoc: Omit<UserDocument, "_id" | "createdAt" | "updatedAt"> = {
          clerkUserId: userId,
          email: session.customer_email || undefined,
          plan: "FREE", // Default to FREE, will be updated by subscription event if applicable
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
          "[Stripe Webhook] ✅ User criado/atualizado no MongoDB:",
          userId
        );

        // 2. Migrate all guest data (localStorage) to MongoDB (associated with userId)
        const migrationResult = await migrateGuestDataToMember(
          userId,
          sessionId || undefined
        );

        if (migrationResult.success) {
          console.log("[Stripe Webhook] ✅ Migração concluída:", {
            userId,
            workspacesMigrated: migrationResult.workspacesMigrated,
            companiesMigrated: migrationResult.companiesMigrated,
          });
        } else {
          console.error("[Stripe Webhook] ⚠️ Migração parcialmente falhou:", {
            userId,
            errors: migrationResult.errors,
          });
        }

        // Determinar se precisa de onboarding
        // Precisa se userId começa com "stripe_" (usuário temporário)
        const needsOnboarding = userId.startsWith("stripe_");

        return NextResponse.json({
          success: true,
          userId,
          needsOnboarding,
          migration: migrationResult,
        });
      } catch (migrationError) {
        const errorMessage =
          migrationError instanceof Error
            ? migrationError.message
            : String(migrationError);
        console.error("[Stripe Webhook] ❌ Erro ao processar migração:", {
          userId,
          error: errorMessage,
        });
        return NextResponse.json(
          { error: "Migration failed", details: errorMessage },
          { status: 500 }
        );
      }
    }

    // Handle other Stripe events (subscription updates, cancellations, etc.)
    if (
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.created"
    ) {
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId; // Ensure metadata is passed to subscription

      if (
        !subscription.items ||
        !subscription.items.data ||
        subscription.items.data.length === 0
      ) {
        console.error(
          "[Stripe Webhook] ❌ Missing items in subscription object"
        );
        return NextResponse.json({ error: "Missing items" }, { status: 400 });
      }

      const priceId = subscription.items.data[0].price.id;

      // Import here to avoid circular dependencies or early execution issues
      const { getPlanFromPriceId } = await import("@/lib/saas/plans");
      const newPlan = getPlanFromPriceId(priceId);

      if (userId) {
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
          `[Stripe Webhook] ✅ Plan updated for user ${userId} to ${newPlan}`
        );
      } else {
        // If userId is not in metadata, we might need to look up by customer ID if we saved it previously
        // For now, log warning
        console.warn("[Stripe Webhook] ⚠️ No userId in subscription metadata");
      }

      return NextResponse.json({ received: true });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      // Downgrade user to free plan
      // We need to find the user by subscriptionId or customerId
      const customerId = subscription.customer as string;

      await db.updateOne(
        "users",
        { stripeCustomerId: customerId },
        {
          $set: {
            plan: "FREE",
            subscriptionStatus: "canceled",
            updatedAt: new Date(),
          },
        }
      );

      console.log(
        "[Stripe Webhook] 📉 Subscription deleted, downgraded to FREE"
      );
      return NextResponse.json({ received: true });
    }

    // Unknown event type
    console.log("[Stripe Webhook] ℹ️ Unhandled event type:", event.type);
    return NextResponse.json({ received: true });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[Stripe Webhook] ❌ Unexpected error:", errorMessage);
    return NextResponse.json(
      { error: "Webhook processing failed", details: errorMessage },
      { status: 500 }
    );
  }
}
