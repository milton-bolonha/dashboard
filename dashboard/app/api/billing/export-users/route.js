import { NextResponse } from "next/server";
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
    // Verificação básica de segurança - pode implementar auth mais robusta
    const { searchParams } = new URL(request.url);
    const adminKey = searchParams.get("key");

    if (adminKey !== process.env.ADMIN_EXPORT_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const format = searchParams.get("format") || "json";
    const includeStripe = searchParams.get("stripe") === "true";
    const limit = parseInt(searchParams.get("limit") || "500");

    console.log(`📊 Iniciando exportação de ${limit} usuários...`);

    // Buscar usuários do Clerk
    const users = await clerkClient.users.getUserList({
      limit: Math.min(limit, 500), // Limite máximo de segurança
    });

    console.log(`👥 Encontrados ${users.length} usuários`);

    const exportData = [];
    let processedCount = 0;

    for (const user of users) {
      processedCount++;

      if (processedCount % 50 === 0) {
        console.log(
          `📈 Processados ${processedCount}/${users.length} usuários...`
        );
      }

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
        // Dados básicos do Clerk
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "N/A",
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        createdAt: user.createdAt,
        lastSignInAt: user.lastSignInAt,

        // Dados de billing do metadata
        stripeCustomerId: metadata.stripeCustomerId || null,
        currentPlans: metadata.plans?.active || [],
        expiredPlans: metadata.plans?.expired || [],
        totalSpent: metadata.billing?.totalSpent || 0,
        lastPayment: metadata.billing?.lastPayment || null,
        lastVerified: metadata.plans?.lastVerified || null,

        // Dados calculados
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

      exportData.push(userData);
    }

    console.log(`✅ Exportação concluída: ${exportData.length} usuários`);

    // Gerar estatísticas resumidas
    const stats = generateStats(exportData);

    if (format === "csv") {
      const csv = convertToCSV(exportData);
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="users-export-${
            new Date().toISOString().split("T")[0]
          }.csv"`,
        },
      });
    }

    return NextResponse.json({
      users: exportData,
      stats,
      meta: {
        exportedAt: new Date().toISOString(),
        total: exportData.length,
        includeStripe,
        format,
      },
    });
  } catch (error) {
    console.error("❌ Erro na exportação:", error);
    return NextResponse.json(
      {
        error: "Export failed",
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
      limit: 100,
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

function generateStats(userData) {
  const total = userData.length;
  const activeCustomers = userData.filter((u) => u.isActiveCustomer).length;
  const withStripeId = userData.filter((u) => u.stripeCustomerId).length;

  const totalRevenue = userData.reduce(
    (sum, u) => sum + (u.totalSpent || 0),
    0
  );

  const planDistribution = {};
  userData.forEach((user) => {
    user.currentPlans.forEach((plan) => {
      planDistribution[plan] = (planDistribution[plan] || 0) + 1;
    });
  });

  return {
    total,
    activeCustomers,
    conversionRate:
      total > 0 ? ((activeCustomers / total) * 100).toFixed(2) + "%" : "0%",
    withStripeId,
    stripeIntegrationRate:
      total > 0 ? ((withStripeId / total) * 100).toFixed(2) + "%" : "0%",
    totalRevenue: totalRevenue.toFixed(2),
    averageRevenuePerUser: total > 0 ? (totalRevenue / total).toFixed(2) : "0",
    planDistribution,
  };
}

function convertToCSV(data) {
  if (data.length === 0) return "";

  // Headers
  const headers = [
    "clerkId",
    "email",
    "firstName",
    "lastName",
    "createdAt",
    "lastSignInAt",
    "stripeCustomerId",
    "currentPlans",
    "expiredPlans",
    "totalSpent",
    "lastPayment",
    "lastVerified",
    "planCount",
    "isActiveCustomer",
    "daysSinceCreation",
    "daysSinceLastLogin",
  ];

  // Adicionar headers do Stripe se existirem
  if (data[0].stripeData) {
    headers.push(
      "activeSubscriptions",
      "stripeTotalSpent",
      "lastStripePayment",
      "stripeInvoiceCount"
    );
  }

  const csvHeaders = headers.join(",");

  // Rows
  const csvRows = data.map((user) => {
    const row = [
      user.clerkId,
      `"${user.email}"`,
      `"${user.firstName}"`,
      `"${user.lastName}"`,
      user.createdAt,
      user.lastSignInAt || "",
      user.stripeCustomerId || "",
      `"${user.currentPlans.join(";")}"`,
      `"${user.expiredPlans.join(";")}"`,
      user.totalSpent,
      user.lastPayment || "",
      user.lastVerified || "",
      user.planCount,
      user.isActiveCustomer,
      user.daysSinceCreation,
      user.daysSinceLastLogin || "",
    ];

    // Adicionar dados do Stripe se existirem
    if (user.stripeData) {
      row.push(
        user.stripeData.activeSubscriptions,
        user.stripeData.stripeTotalSpent,
        user.stripeData.lastStripePayment || "",
        user.stripeData.stripeInvoiceCount
      );
    }

    return row.join(",");
  });

  return [csvHeaders, ...csvRows].join("\n");
}
