import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Mapeamento de Price IDs para Plan IDs
const STRIPE_PLAN_MAPPING = {
  // Configure aqui seus Price IDs reais do Stripe
  price_test_cupido123: "cupido",
  price_test_afrodite456: "afrodite",
  price_test_zeus789: "zeus",
  // Adicione mais conforme necessário
};

export async function handler(event, context) {
  const sig = event.headers["stripe-signature"];

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error("Webhook signature verification failed.", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  console.log(`🎣 Webhook recebido: ${stripeEvent.type}`);

  try {
    switch (stripeEvent.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(stripeEvent.data.object);
        break;

      case "invoice.paid":
        await handleInvoicePaid(stripeEvent.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(stripeEvent.data.object);
        break;

      case "payment_intent.succeeded":
        await handlePaymentSucceeded(stripeEvent.data.object);
        break;

      default:
        console.log(`⚠️ Evento não tratado: ${stripeEvent.type}`);
    }

    return { statusCode: 200, body: "Webhook processed successfully" };
  } catch (error) {
    console.error("❌ Erro no processamento do webhook:", error);
    return { statusCode: 500, body: `Processing error: ${error.message}` };
  }
}

async function handleCheckoutCompleted(session) {
  console.log("🎉 Checkout completado:", session.id);

  try {
    // Buscar dados completos da sessão
    const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
      expand: ["line_items", "customer"],
    });

    const customer = fullSession.customer;
    const lineItems = fullSession.line_items?.data || [];

    if (!customer || !customer.email) {
      console.error("❌ Cliente ou email não encontrado na sessão");
      return;
    }

    console.log(`👤 Cliente identificado: ${customer.email}`);

    // Identificar planos comprados
    const planIds = [];
    for (const item of lineItems) {
      const priceId = item.price?.id;
      const planId = STRIPE_PLAN_MAPPING[priceId];

      if (planId) {
        planIds.push(planId);
        console.log(`📦 Plano identificado: ${priceId} → ${planId}`);
      } else {
        console.warn(`⚠️ Price ID não mapeado: ${priceId}`);
      }
    }

    if (planIds.length === 0) {
      console.error("❌ Nenhum plano identificado na compra");
      return;
    }

    // Triangulação: Clerk → Stripe → API
    await triangulateUserPurchase({
      customerEmail: customer.email,
      stripeCustomerId: customer.id,
      sessionId: session.id,
      planIds,
      amount: session.amount_total / 100,
      currency: session.currency,
      status: "completed",
      type: "checkout",
      stripeCreatedAt: session.created,
    });
  } catch (error) {
    console.error("❌ Erro no handleCheckoutCompleted:", error);
    throw error;
  }
}

async function handleInvoicePaid(invoice) {
  console.log("💳 Invoice paga:", invoice.id);

  try {
    const customer = await stripe.customers.retrieve(invoice.customer);

    // Identificar planos da subscription
    const planIds = [];
    for (const line of invoice.lines.data) {
      if (line.price) {
        const planId = STRIPE_PLAN_MAPPING[line.price.id];
        if (planId && !planIds.includes(planId)) {
          planIds.push(planId);
        }
      }
    }

    await triangulateUserPurchase({
      customerEmail: customer.email,
      stripeCustomerId: customer.id,
      sessionId: invoice.id,
      planIds,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: "completed",
      type: "subscription",
      stripeCreatedAt: invoice.created,
    });
  } catch (error) {
    console.error("❌ Erro no handleInvoicePaid:", error);
    throw error;
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log("❌ Subscription cancelada:", subscription.id);

  try {
    const customer = await stripe.customers.retrieve(subscription.customer);

    await triangulateUserCancellation({
      customerEmail: customer.email,
      stripeCustomerId: customer.id,
      subscriptionId: subscription.id,
      canceledAt: subscription.canceled_at,
    });
  } catch (error) {
    console.error("❌ Erro no handleSubscriptionDeleted:", error);
    throw error;
  }
}

async function handlePaymentSucceeded(paymentIntent) {
  console.log("✅ Pagamento bem-sucedido:", paymentIntent.id);

  // Implementar se necessário para pagamentos únicos
}

async function triangulateUserPurchase(purchaseData) {
  try {
    console.log("🔄 Iniciando triangulação...");

    // 1. Encontrar usuário no Clerk pelo email
    const clerkUser = await findClerkUserByEmail(purchaseData.customerEmail);

    if (!clerkUser) {
      console.error(
        `❌ Usuário não encontrado no Clerk: ${purchaseData.customerEmail}`
      );
      // Salvar transação mesmo assim para auditoria
      await saveTransactionToAPI({
        ...purchaseData,
        userId: null,
        error: "user_not_found_in_clerk",
      });
      return;
    }

    console.log(`✅ Usuário encontrado no Clerk: ${clerkUser.id}`);

    // 2. Atualizar metadata do Clerk
    await updateClerkUserMetadata(clerkUser, purchaseData);

    // 3. Salvar transação na nossa API
    await saveTransactionToAPI({
      ...purchaseData,
      userId: clerkUser.id,
    });

    console.log("✅ Triangulação completada com sucesso!");
  } catch (error) {
    console.error("❌ Erro na triangulação:", error);
    throw error;
  }
}

async function findClerkUserByEmail(email) {
  try {
    // Usar a API do Clerk para buscar usuário por email
    const response = await fetch(
      `https://api.clerk.dev/v1/users?email_address=${encodeURIComponent(
        email
      )}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Clerk API error: ${response.status}`);
    }

    const users = await response.json();
    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error("❌ Erro ao buscar usuário no Clerk:", error);
    return null;
  }
}

async function updateClerkUserMetadata(clerkUser, purchaseData) {
  try {
    const currentMetadata = clerkUser.unsafe_metadata || {};
    const currentPlans = currentMetadata.plans || { active: [], expired: [] };
    const currentBilling = currentMetadata.billing || {};

    // Adicionar novos planos aos ativos
    const updatedActivePlans = [
      ...new Set([...currentPlans.active, ...purchaseData.planIds]),
    ];

    // Atualizar dados de billing
    const updatedBilling = {
      ...currentBilling,
      totalSpent: (currentBilling.totalSpent || 0) + purchaseData.amount,
      lastPayment: new Date().toISOString(),
      stripeCustomerId: purchaseData.stripeCustomerId,
    };

    const updatedMetadata = {
      ...currentMetadata,
      stripeCustomerId: purchaseData.stripeCustomerId,
      plans: {
        active: updatedActivePlans,
        expired: currentPlans.expired || [],
        lastVerified: new Date().toISOString(),
      },
      billing: updatedBilling,
    };

    // Atualizar no Clerk
    const response = await fetch(
      `https://api.clerk.dev/v1/users/${clerkUser.id}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          unsafe_metadata: updatedMetadata,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Erro ao atualizar Clerk: ${response.status}`);
    }

    console.log("✅ Metadata do Clerk atualizada");
  } catch (error) {
    console.error("❌ Erro ao atualizar metadata do Clerk:", error);
    throw error;
  }
}

async function saveTransactionToAPI(transactionData) {
  try {
    // Salvar na nossa API para auditoria
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL}/api/billing/transactions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.INTERNAL_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          stripeId: transactionData.sessionId,
          userId: transactionData.userId,
          stripeCustomerId: transactionData.stripeCustomerId,
          planId: transactionData.planIds.join(","),
          amount: transactionData.amount,
          currency: transactionData.currency,
          status: transactionData.status,
          type: transactionData.type,
          stripeCreatedAt: transactionData.stripeCreatedAt,
          metadata: {
            email: transactionData.customerEmail,
            planIds: transactionData.planIds,
          },
        }),
      }
    );

    if (response.ok) {
      console.log("✅ Transação salva na API");
    } else {
      console.warn(`⚠️ Falha ao salvar transação: ${response.status}`);
    }
  } catch (error) {
    console.error("❌ Erro ao salvar transação:", error);
    // Não fazer throw aqui para não quebrar o webhook
  }
}

async function triangulateUserCancellation(cancellationData) {
  try {
    console.log("🔄 Processando cancelamento...");

    const clerkUser = await findClerkUserByEmail(
      cancellationData.customerEmail
    );

    if (clerkUser) {
      // Implementar lógica de cancelamento se necessário
      console.log("✅ Cancelamento processado para:", clerkUser.id);
    }
  } catch (error) {
    console.error("❌ Erro no cancelamento:", error);
  }
}
