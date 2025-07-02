import Stripe from "stripe";
import { db } from "./db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Serviço de sincronização com o Stripe
 * Responsável por manter os dados de pagamento atualizados
 */
export class StripeSync {
  /**
   * Sincroniza o status de uma assinatura do Stripe com o workspace
   */
  static async syncSubscription(workspaceId, stripeSubscriptionId) {
    try {
      // Buscar assinatura no Stripe
      const subscription = await stripe.subscriptions.retrieve(
        stripeSubscriptionId,
        {
          expand: ["items.data.price.product", "customer", "latest_invoice"],
        }
      );

      // Mapear status do Stripe para nosso sistema
      const statusMap = {
        active: "active",
        past_due: "past_due",
        canceled: "canceled",
        incomplete: "pending",
        incomplete_expired: "canceled",
        trialing: "trialing",
        unpaid: "past_due",
      };

      // Buscar workspace
      const workspace = await db.findOne("workspaces", { _id: workspaceId });
      if (!workspace) {
        throw new Error("Workspace not found");
      }

      // Preparar dados de atualização
      const updateData = {
        planStatus: statusMap[subscription.status] || "active",
        "stripe.subscriptionId": subscription.id,
        "stripe.customerId": subscription.customer.id || subscription.customer,
        "stripe.priceId": subscription.items.data[0]?.price.id,
        "stripe.productId":
          subscription.items.data[0]?.price.product.id ||
          subscription.items.data[0]?.price.product,
        "stripe.lastSync": new Date(),
        "stripe.syncStatus": "synced",
        "stripe.subscriptionItems": subscription.items.data.map((item) => ({
          id: item.id,
          priceId: item.price.id,
          quantity: item.quantity,
        })),
        "stripe.lastInvoiceId":
          subscription.latest_invoice?.id || subscription.latest_invoice,
      };

      // Se tem trial, atualizar data de expiração
      if (subscription.trial_end) {
        updateData.trialEndsAt = new Date(subscription.trial_end * 1000);
      }

      // Buscar plano correspondente baseado no price ID
      const priceId = subscription.items.data[0]?.price.id;
      if (priceId) {
        const plan = await db.findOne("plans", {
          $or: [
            { "stripePriceIds.monthly": priceId },
            { "stripePriceIds.yearly": priceId },
          ],
        });

        if (plan) {
          updateData.planId = plan._id;
        }
      }

      // Atualizar workspace
      await db.updateOne(
        "workspaces",
        { _id: workspaceId },
        { $set: updateData }
      );

      return { success: true, subscription };
    } catch (error) {
      console.error("Erro ao sincronizar assinatura:", error);

      // Marcar erro de sincronização
      await db.updateOne(
        "workspaces",
        { _id: workspaceId },
        {
          $set: {
            "stripe.syncStatus": "error",
            "stripe.syncError": error.message,
            "stripe.lastSync": new Date(),
          },
        }
      );

      throw error;
    }
  }

  /**
   * Verifica se uma feature foi comprada (one-time ou subscription)
   */
  static async verifyFeaturePurchase(workspaceId, featureId) {
    try {
      const workspace = await db.findOne("workspaces", { _id: workspaceId });
      if (!workspace) return false;

      // Buscar feature comprada
      const purchasedFeature = workspace.purchasedFeatures?.find(
        (pf) => pf.featureId === featureId && pf.status === "active"
      );

      if (!purchasedFeature) return false;

      // Se é assinatura, verificar no Stripe
      if (purchasedFeature.stripe?.subscriptionId) {
        const subscription = await stripe.subscriptions.retrieve(
          purchasedFeature.stripe.subscriptionId
        );

        // Atualizar status se mudou
        if (
          subscription.status !== "active" &&
          subscription.status !== "trialing"
        ) {
          await db.updateOne(
            "workspaces",
            {
              _id: workspaceId,
              "purchasedFeatures.featureId": featureId,
            },
            {
              $set: {
                "purchasedFeatures.$.status": "canceled",
                "purchasedFeatures.$.canceledAt": new Date(),
              },
            }
          );
          return false;
        }
      }

      // Se é one-time com expiração, verificar
      if (
        purchasedFeature.expiresAt &&
        new Date(purchasedFeature.expiresAt) < new Date()
      ) {
        await db.updateOne(
          "workspaces",
          {
            _id: workspaceId,
            "purchasedFeatures.featureId": featureId,
          },
          {
            $set: {
              "purchasedFeatures.$.status": "expired",
            },
          }
        );
        return false;
      }

      return true;
    } catch (error) {
      console.error("Erro ao verificar compra de feature:", error);
      return false;
    }
  }

  /**
   * Processa webhook do Stripe
   */
  static async processWebhook(event) {
    switch (event.type) {
      case "checkout.session.completed":
        await this.handleCheckoutCompleted(event.data.object);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await this.handleSubscriptionUpdate(event.data.object);
        break;

      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await this.handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await this.handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        console.log(`Evento não tratado: ${event.type}`);
    }
  }

  /**
   * Processa checkout completado
   */
  static async handleCheckoutCompleted(session) {
    const workspaceId = session.client_reference_id;
    if (!workspaceId) {
      console.error("Checkout sem workspace ID");
      return;
    }

    // Expandir line items
    const expandedSession = await stripe.checkout.sessions.retrieve(
      session.id,
      {
        expand: ["line_items.data.price.product"],
      }
    );

    for (const item of expandedSession.line_items.data) {
      const priceId = item.price.id;
      const productId = item.price.product.id || item.price.product;

      // Verificar se é plano ou feature
      const plan = await db.findOne("plans", {
        $or: [
          { "stripePriceIds.monthly": priceId },
          { "stripePriceIds.yearly": priceId },
        ],
      });

      if (plan) {
        // É um plano - atualizar workspace
        await db.updateOne(
          "workspaces",
          { _id: workspaceId },
          {
            $set: {
              planId: plan._id,
              planStatus: "active",
              "stripe.priceId": priceId,
              "stripe.productId": productId,
              "stripe.checkoutSessionId": session.id,
              "stripe.customerId": session.customer,
              "stripe.subscriptionId": session.subscription,
            },
          }
        );
      } else {
        // Pode ser uma feature/addon
        const feature = await db.findOne("features", {
          "pricing.stripePriceId": priceId,
        });

        if (feature) {
          // Adicionar feature comprada
          const purchaseData = {
            featureId: feature._id,
            stripe: {
              priceId: priceId,
              productId: productId,
              checkoutSessionId: session.id,
              paymentIntentId: session.payment_intent,
              subscriptionId: session.subscription,
              invoiceId: session.invoice,
            },
            purchaseType:
              session.mode === "subscription" ? "subscription" : "one_time",
            amount: item.amount_total / 100, // Converter de centavos
            currency: item.currency.toUpperCase(),
            purchasedAt: new Date(),
            activatedAt: new Date(),
            status: "active",
          };

          // Se tem expiração definida na feature
          if (feature.config?.expirationDays) {
            const expiresAt = new Date();
            expiresAt.setDate(
              expiresAt.getDate() + feature.config.expirationDays
            );
            purchaseData.expiresAt = expiresAt;
          }

          await db.updateOne(
            "workspaces",
            { _id: workspaceId },
            {
              $push: {
                purchasedFeatures: purchaseData,
              },
            }
          );
        }
      }
    }
  }

  /**
   * Processa atualização de assinatura
   */
  static async handleSubscriptionUpdate(subscription) {
    // Buscar workspace pela subscription ID
    const workspace = await db.findOne("workspaces", {
      "stripe.subscriptionId": subscription.id,
    });

    if (workspace) {
      await this.syncSubscription(workspace._id, subscription.id);
    }
  }

  /**
   * Processa cancelamento de assinatura
   */
  static async handleSubscriptionDeleted(subscription) {
    const workspace = await db.findOne("workspaces", {
      "stripe.subscriptionId": subscription.id,
    });

    if (workspace) {
      await db.updateOne(
        "workspaces",
        { _id: workspace._id },
        {
          $set: {
            planStatus: "canceled",
            "stripe.syncStatus": "synced",
            "stripe.lastSync": new Date(),
          },
        }
      );

      // Cancelar features relacionadas
      await db.updateMany(
        "workspaces",
        {
          _id: workspace._id,
          "purchasedFeatures.stripe.subscriptionId": subscription.id,
        },
        {
          $set: {
            "purchasedFeatures.$.status": "canceled",
            "purchasedFeatures.$.canceledAt": new Date(),
          },
        }
      );
    }
  }

  /**
   * Processa pagamento de invoice bem-sucedido
   */
  static async handleInvoicePaymentSucceeded(invoice) {
    const workspace = await db.findOne("workspaces", {
      "stripe.customerId": invoice.customer,
    });

    if (workspace) {
      await db.updateOne(
        "workspaces",
        { _id: workspace._id },
        {
          $set: {
            "stripe.lastInvoiceId": invoice.id,
            "stripe.lastChargeId": invoice.charge,
            "stripe.lastPaymentIntentId": invoice.payment_intent,
          },
        }
      );
    }
  }

  /**
   * Processa falha de pagamento
   */
  static async handleInvoicePaymentFailed(invoice) {
    const workspace = await db.findOne("workspaces", {
      "stripe.customerId": invoice.customer,
    });

    if (workspace) {
      await db.updateOne(
        "workspaces",
        { _id: workspace._id },
        {
          $set: {
            planStatus: "past_due",
            "stripe.lastInvoiceId": invoice.id,
          },
        }
      );
    }
  }

  /**
   * Verifica e atualiza todos os status de assinatura
   * (Pode ser executado periodicamente via cron)
   */
  static async syncAllSubscriptions() {
    const workspaces = await db.find("workspaces", {
      "stripe.subscriptionId": { $exists: true, $ne: null },
    });

    const results = {
      total: workspaces.length,
      success: 0,
      errors: [],
    };

    for (const workspace of workspaces) {
      try {
        await this.syncSubscription(
          workspace._id,
          workspace.stripe.subscriptionId
        );
        results.success++;
      } catch (error) {
        results.errors.push({
          workspaceId: workspace._id,
          error: error.message,
        });
      }
    }

    return results;
  }
}
