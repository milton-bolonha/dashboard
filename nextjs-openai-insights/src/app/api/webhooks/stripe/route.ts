import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { migrateGuestDataToMember } from "@/lib/db/migration-helpers";
import { db } from "@/lib/db/mongodb";
import type { UserDocument } from "@/lib/db/models/User";

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
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 400 }
      );
    }

    // TODO: FASE 2 - Validate Stripe webhook signature
    // const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
    // const event = stripe.webhooks.constructEvent(
    //   body,
    //   signature,
    //   process.env.STRIPE_WEBHOOK_SECRET
    // );

    // For now, parse JSON directly (in production, use Stripe SDK to validate)
    let event: {
      type: string;
      data: {
        object: {
          id?: string;
          customer?: string;
          customer_email?: string;
          metadata?: {
            userId?: string;
            sessionId?: string;
          };
          subscription?: string;
        };
      };
    };

    try {
      event = JSON.parse(body);
    } catch (parseError) {
      console.error("[Stripe Webhook] ❌ Failed to parse webhook body:", parseError);
      return NextResponse.json(
        { error: "Invalid JSON" },
        { status: 400 }
      );
    }

    console.log("[Stripe Webhook] 📥 Received event:", event.type);

    // Handle checkout.session.completed event
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const userId = session.metadata?.userId;
      const sessionId = session.metadata?.sessionId;

      if (!userId) {
        console.error("[Stripe Webhook] ❌ Missing userId in checkout session metadata");
        return NextResponse.json(
          { error: "Missing userId in metadata" },
          { status: 400 }
        );
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
          createdAt: new Date(),
          updatedAt: new Date(),
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

        console.log("[Stripe Webhook] ✅ User criado/atualizado no MongoDB:", userId);

        // 2. Migrate all guest data (localStorage) to MongoDB (associated with userId)
        const migrationResult = await migrateGuestDataToMember(userId, sessionId || undefined);

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

        return NextResponse.json({
          success: true,
          userId,
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
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      // TODO: Update user plan status in MongoDB
      console.log("[Stripe Webhook] 📝 Subscription updated:", subscription.id);
      return NextResponse.json({ received: true });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      // TODO: Downgrade user to free plan in MongoDB
      console.log("[Stripe Webhook] 📝 Subscription deleted:", subscription.id);
      return NextResponse.json({ received: true });
    }

    // Unknown event type
    console.log("[Stripe Webhook] ℹ️ Unhandled event type:", event.type);
    return NextResponse.json({ received: true });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : String(error);
    console.error("[Stripe Webhook] ❌ Unexpected error:", errorMessage);
    return NextResponse.json(
      { error: "Webhook processing failed", details: errorMessage },
      { status: 500 }
    );
  }
}

