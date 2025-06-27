import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";
import { getCurrentUserId, getDevUserPlan, isDevMode } from "@/lib/auth";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

export async function GET(request) {
  try {
    // ✅ Usar autenticação real
    const adminUserId = await getCurrentUserId();
    console.log(`📊 Admin autenticado: ${adminUserId}`);

    const { searchParams } = new URL(request.url);
    const includeStripe = searchParams.get("stripe") === "true";
    const limit = parseInt(searchParams.get("limit") || "100");

    // 🎭 DEV MODE: Simular dados realistas mas com planos ativos
    if (isDevMode()) {
      console.log(
        "🎭 DEV MODE: Simulando usuários com planos para desenvolvimento"
      );

      const devPlan = getDevUserPlan();

      try {
        // 🔧 Verificar se as chaves do Clerk estão configuradas
        if (
          !process.env.CLERK_SECRET_KEY ||
          process.env.CLERK_SECRET_KEY === "sk_test_..."
        ) {
          throw new Error(
            "Chaves do Clerk não configuradas em desenvolvimento"
          );
        }

        // Tentar buscar usuários reais do Clerk
        const clerkUsersResponse = await clerkClient.users.getUserList({
          limit: Math.min(limit, 10), // Limitar em dev
        });

        // ✅ Verificar se a resposta é válida
        const clerkUsers = clerkUsersResponse?.data || clerkUsersResponse || [];

        if (!Array.isArray(clerkUsers)) {
          throw new Error("Resposta inválida do Clerk API");
        }

        console.log(
          `👥 Encontrados ${clerkUsers.length} usuários reais do Clerk`
        );

        const users = clerkUsers.map((user, index) => {
          // 🎭 Simular diferentes cenários de planos
          const scenarios = [
            { plans: ["cupido"], spent: 29.9, active: true },
            { plans: ["afrodite", "zeus"], spent: 147.5, active: true },
            { plans: [], spent: 0, active: false },
            { plans: ["zeus"], spent: 89.9, active: true },
          ];

          const scenario = scenarios[index % scenarios.length];

          return {
            clerkId: user.id,
            email: user.emailAddresses?.[0]?.emailAddress || "N/A",
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            createdAt: user.createdAt,
            lastSignInAt: user.lastSignInAt,
            stripeCustomerId: scenario.active ? `cus_dev_${user.id}` : null,
            currentPlans: scenario.plans,
            expiredPlans: [],
            totalSpent: scenario.spent,
            lastPayment: scenario.active
              ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
              : null,
            lastVerified: scenario.active ? new Date() : null,
            planCount: scenario.plans.length,
            isActiveCustomer: scenario.active,
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
        });

        // Gerar estatísticas baseadas nos dados simulados
        const stats = {
          total: users.length,
          activeCustomers: users.filter((u) => u.isActiveCustomer).length,
          totalRevenue: users.reduce((sum, u) => sum + (u.totalSpent || 0), 0),
          conversionRate:
            users.length > 0
              ? (
                  (users.filter((u) => u.isActiveCustomer).length /
                    users.length) *
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
            includeStripe: false,
            adminUserId,
            devMode: true,
            devPlan: devPlan.plan,
            source: "clerk_real_data",
          },
        });
      } catch (clerkError) {
        console.warn(
          "⚠️ Clerk indisponível em dev, usando dados simulados:",
          clerkError.message
        );

        // 🔧 FALLBACK: Dados mock bem estruturados para desenvolvimento
        const mockUsers = [
          {
            clerkId: adminUserId,
            email: "voce@dev.com",
            firstName: "Você",
            lastName: "Dev",
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            lastSignInAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
            stripeCustomerId: "cus_dev_you",
            currentPlans: [devPlan.plan],
            expiredPlans: [],
            totalSpent: 147.5,
            lastPayment: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            lastVerified: new Date(),
            planCount: 1,
            isActiveCustomer: true,
            daysSinceCreation: 30,
            daysSinceLastLogin: 0,
          },
          {
            clerkId: "demo_user_2",
            email: "usuario2@demo.com",
            firstName: "Maria",
            lastName: "Silva",
            createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
            lastSignInAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            stripeCustomerId: "cus_demo_2",
            currentPlans: ["cupido"],
            expiredPlans: [],
            totalSpent: 29.9,
            lastPayment: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            lastVerified: new Date(),
            planCount: 1,
            isActiveCustomer: true,
            daysSinceCreation: 15,
            daysSinceLastLogin: 2,
          },
          {
            clerkId: "demo_user_3",
            email: "joao@demo.com",
            firstName: "João",
            lastName: "Santos",
            createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
            lastSignInAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            stripeCustomerId: null,
            currentPlans: [],
            expiredPlans: ["cupido"],
            totalSpent: 29.9,
            lastPayment: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
            lastVerified: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            planCount: 0,
            isActiveCustomer: false,
            daysSinceCreation: 60,
            daysSinceLastLogin: 30,
          },
          {
            clerkId: "demo_user_4",
            email: "ana@demo.com",
            firstName: "Ana",
            lastName: "Costa",
            createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
            lastSignInAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            stripeCustomerId: "cus_demo_4",
            currentPlans: ["afrodite", "zeus"],
            expiredPlans: [],
            totalSpent: 239.8,
            lastPayment: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            lastVerified: new Date(),
            planCount: 2,
            isActiveCustomer: true,
            daysSinceCreation: 45,
            daysSinceLastLogin: 1,
          },
        ];

        const mockStats = {
          total: mockUsers.length,
          activeCustomers: mockUsers.filter((u) => u.isActiveCustomer).length,
          totalRevenue: mockUsers.reduce(
            (sum, u) => sum + (u.totalSpent || 0),
            0
          ),
          conversionRate: "75%",
        };

        console.log(
          `🔄 Retornando ${mockUsers.length} usuários simulados para desenvolvimento`
        );

        return NextResponse.json({
          users: mockUsers,
          stats: mockStats,
          meta: {
            fetchedAt: new Date().toISOString(),
            total: mockUsers.length,
            includeStripe: false,
            adminUserId,
            devMode: true,
            devPlan: devPlan.plan,
            source: "mock_data",
            reason: clerkError.message,
          },
        });
      }
    }

    // 🎯 PRODUÇÃO: Dados reais do Clerk + Stripe
    console.log("🎯 PRODUÇÃO: Buscando dados reais de usuários");

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
        adminUserId,
        devMode: false,
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

// ✅ Função auxiliar do Stripe (para produção)
async function getStripeCustomerSummary(customerId) {
  try {
    const [customer, subscriptions, invoices] = await Promise.all([
      stripe.customers.retrieve(customerId),
      stripe.subscriptions.list({ customer: customerId, limit: 10 }),
      stripe.invoices.list({ customer: customerId, limit: 10 }),
    ]);

    const activeSubscriptions = subscriptions.data.filter(
      (sub) => sub.status === "active"
    );

    const totalSpent =
      invoices.data
        .filter((inv) => inv.status === "paid")
        .reduce((sum, inv) => sum + inv.amount_paid, 0) / 100;

    const lastPayment = invoices.data.find((inv) => inv.status === "paid");

    return {
      activeSubscriptions: activeSubscriptions.length,
      totalSpent,
      lastPayment: lastPayment ? new Date(lastPayment.created * 1000) : null,
      invoiceCount: invoices.data.length,
      currency: customer.currency || "brl",
    };
  } catch (error) {
    console.warn(`⚠️ Erro ao buscar dados Stripe:`, error.message);
    return null;
  }
}
