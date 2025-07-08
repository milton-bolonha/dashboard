import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/nextjs/server";
import Stripe from "stripe";
import {
  mapStripePriceToPlan,
  CACHE_CONFIG,
} from "../../../../config/stripe-plans";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const forceRefresh = searchParams.get("force") === "true";

    console.log(`🔍 Verificando planos para usuário: ${userId}`);

    // Buscar dados atuais do usuário no Clerk
    const user = await clerkClient.users.getUser(userId);
    const metadata = user.unsafeMetadata || {};
    const plans = metadata.plans || { active: [], expired: [] };
    const billing = metadata.billing || {};

    // Verificar se precisa de atualização
    const lastVerified = plans.lastVerified;
    const needsUpdate =
      forceRefresh ||
      !lastVerified ||
      Date.now() - new Date(lastVerified).getTime() >
        CACHE_CONFIG.planVerificationTTL;

    if (!needsUpdate) {
      console.log("✅ Cache ainda válido, retornando dados existentes");
      return NextResponse.json({
        plans,
        billing,
        lastVerified,
        source: "cache",
        needsUpdate: false,
      });
    }

    console.log("🔄 Cache expirado, verificando no Stripe...");

    // Se não tem stripeCustomerId, apenas atualizar timestamp
    if (!metadata.stripeCustomerId) {
      console.log("ℹ️ Usuário sem Stripe Customer ID");

      const updatedPlans = {
        ...plans,
        lastVerified: new Date().toISOString(),
      };

      await clerkClient.users.updateUserMetadata(userId, {
        unsafeMetadata: {
          ...metadata,
          plans: updatedPlans,
        },
      });

      return NextResponse.json({
        plans: updatedPlans,
        billing,
        lastVerified: updatedPlans.lastVerified,
        source: "no_stripe_id",
        needsUpdate: false,
      });
    }

    // Verificar dados atuais no Stripe
    const stripeData = await getStripeCustomerData(metadata.stripeCustomerId);

    // Determinar planos ativos baseado no Stripe
    const activePlansFromStripe = stripeData.activePlans;
    const billingFromStripe = stripeData.billing;

    // Preparar dados atualizados
    const updatedPlans = {
      active: activePlansFromStripe,
      expired: plans.expired || [],
      lastVerified: new Date().toISOString(),
    };

    const updatedBilling = {
      ...billing,
      ...billingFromStripe,
    };

    // Atualizar Clerk se houver mudanças
    if (
      JSON.stringify(plans.active) !== JSON.stringify(activePlansFromStripe) ||
      billing.totalSpent !== billingFromStripe.totalSpent
    ) {
      console.log("🔄 Atualizando dados no Clerk...");

      await clerkClient.users.updateUserMetadata(userId, {
        unsafeMetadata: {
          ...metadata,
          plans: updatedPlans,
          billing: updatedBilling,
        },
      });

      return NextResponse.json({
        plans: updatedPlans,
        billing: updatedBilling,
        lastVerified: updatedPlans.lastVerified,
        source: "stripe_sync",
        needsUpdate: true,
      });
    }

    // Apenas atualizar timestamp se não houve mudanças
    const timestampUpdatedPlans = {
      ...plans,
      lastVerified: new Date().toISOString(),
    };

    // Preservar os metadados privados (como a role de superadmin) ao atualizar os metadados públicos.
    // Sem isso, a permissão de superadmin era apagada a cada verificação de plano.
    const privateMetadata = user.privateMetadata || {};

    await clerkClient.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...metadata,
        plans: timestampUpdatedPlans,
      },
      privateMetadata, // Garante que os metadados privados não sejam apagados
    });

    return NextResponse.json({
      plans: timestampUpdatedPlans,
      billing,
      lastVerified: timestampUpdatedPlans.lastVerified,
      source: "stripe_verified",
      needsUpdate: false,
    });
  } catch (error) {
    console.error("❌ Erro na verificação de planos:", error);
    return NextResponse.json(
      {
        error: "Verification failed",
        details: error.message,
        plans: { active: [], expired: [] },
        billing: {},
        source: "error",
      },
      { status: 500 }
    );
  }
}

async function getStripeCustomerData(stripeCustomerId) {
  try {
    console.log(`🔍 Buscando dados do Stripe para: ${stripeCustomerId}`);

    // Buscar customer
    const customer = await stripe.customers.retrieve(stripeCustomerId);

    // Buscar subscriptions ativas
    const subscriptions = await stripe.subscriptions.list({
      customer: stripeCustomerId,
      status: "active",
      limit: 10,
    });

    // Buscar invoices pagas
    const invoices = await stripe.invoices.list({
      customer: stripeCustomerId,
      status: "paid",
      limit: 50,
    });

    // Mapear subscriptions para nossos planos
    const activePlans = [];
    for (const subscription of subscriptions.data) {
      for (const item of subscription.items.data) {
        const planId = mapStripePriceToPlan(item.price.id);
        if (planId && !activePlans.includes(planId)) {
          activePlans.push(planId);
        }
      }
    }

    // Calcular dados de billing
    const totalSpent = invoices.data.reduce(
      (sum, invoice) => sum + invoice.amount_paid / 100,
      0
    );

    const lastPayment =
      invoices.data.length > 0
        ? new Date(invoices.data[0].created * 1000).toISOString()
        : null;

    return {
      activePlans,
      billing: {
        totalSpent,
        lastPayment,
        stripeCustomerId,
        lastStripeCheck: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("❌ Erro ao consultar Stripe:", error);

    // Em caso de erro, retornar dados vazios mas não falhar
    return {
      activePlans: [],
      billing: {
        totalSpent: 0,
        lastPayment: null,
        stripeCustomerId,
        lastStripeCheck: new Date().toISOString(),
        error: error.message,
      },
    };
  }
}
