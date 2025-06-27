import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function GET(request) {
  try {
    // Verificar autenticação
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const includeStripe = searchParams.get("stripe") === "true";
    const limit = parseInt(searchParams.get("limit") || "100");

    console.log(`📊 Listando ${limit} usuários para admin: ${userId}`);

    // Buscar usuários do Clerk
    const clerkUsers = await clerkClient.users.getUserList({
      limit: Math.min(limit, 200),
    });

    console.log(`👥 Encontrados ${clerkUsers.length} usuários`);

    const users = await Promise.all(
      clerkUsers.map(async (user) => {
        const metadata = user.unsafeMetadata || {};

        let stripeData = null;
        if (includeStripe && metadata.stripeCustomerId) {
          try {
            stripeData = await getStripeCustomerSummary(
              metadata.stripeCustomerId
            );
          } catch (e) {
            console.warn(
              `⚠️ Erro ao buscar dados Stripe para ${user.id}:`,
              e.message
            );
          }
        }

        const userData = {
          clerkId: user.id,
          email: user.emailAddresses[0]?.emailAddress || "N/A",
          firstName: user.firstName || "",
          lastName: user.lastName || "",
          createdAt: user.createdAt,
          lastSignInAt: user.lastSignInAt,
          stripeCustomerId: metadata.stripeCustomerId || null,
          currentPlans: metadata.plans?.active || [],
          expiredPlans: metadata.plans?.expired || [],
          totalSpent: metadata.billing?.totalSpent || 0,
          lastPayment: metadata.billing?.lastPayment || null,
          lastVerified: metadata.plans?.lastVerified || null,
          planCount: (metadata.plans?.active || []).length,
          isActiveCustomer: (metadata.plans?.active || []).length > 0,
          daysSinceCreation: Math.floor(
            (Date.now() - new Date(user.createdAt).getTime()) /
              (1000 * 60 * 60 * 24)
          ),
          daysSinceLastLogin: user.lastSignInAt
            ? Math.floor(
                (Date.now() - new Date(user.lastSignInAt).getTime()) /
                  (1000 * 60 * 60 * 24)
              )
            : null,
        };

        // Adicionar dados do Stripe se solicitado
        if (stripeData) {
          userData.stripeData = {
            activeSubscriptions: stripeData.activeSubscriptions,
            stripeTotalSpent: stripeData.totalSpent,
            lastStripePayment: stripeData.lastPayment,
            stripeInvoiceCount: stripeData.invoiceCount,
            stripeCurrency: stripeData.currency,
          };
        }

        return userData;
      })
    );

    // Gerar estatísticas
    const stats = {
      total: users.length,
      activeCustomers: users.filter((u) => u.isActiveCustomer).length,
      totalRevenue: users.reduce((sum, u) => sum + (u.totalSpent || 0), 0),
      conversionRate:
        users.length > 0
          ? (
              (users.filter((u) => u.isActiveCustomer).length / users.length) *
              100
            ).toFixed(2) + "%"
          : "0%",
    };

    return NextResponse.json({
      users,
      stats,
      meta: {
        fetchedAt: new Date().toISOString(),
        total: users.length,
        includeStripe,
        adminUserId: userId,
      },
    });
  } catch (error) {
    console.error("❌ Erro na listagem de usuários:", error);
    return NextResponse.json(
      {
        error: "Failed to list users",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

async function getStripeCustomerSummary(customerId) {
  try {
    // Buscar customer info
    const customer = await stripe.customers.retrieve(customerId);

    // Buscar invoices recentes
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 50,
    });

    // Buscar subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 10,
    });

    // Calcular total gasto
    const totalSpent = invoices.data
      .filter((inv) => inv.status === "paid")
      .reduce((sum, inv) => sum + inv.amount_paid / 100, 0);

    // Último pagamento
    const lastPayment = invoices.data
      .filter((inv) => inv.status === "paid")
      .sort((a, b) => b.created - a.created)[0];

    return {
      activeSubscriptions: subscriptions.data.filter(
        (sub) => sub.status === "active"
      ).length,
      totalSpent,
      lastPayment: lastPayment
        ? new Date(lastPayment.created * 1000).toISOString()
        : null,
      invoiceCount: invoices.data.length,
      currency: customer.currency || "brl",
    };
  } catch (error) {
    console.error("❌ Erro ao buscar resumo do Stripe:", error);
    throw error;
  }
}
