import { connectDB } from "./db.js";
import { userSync } from "./userSync.js";

/**
 * Sistema de Sincronização Billing: Stripe ↔ MongoDB
 *
 * Mantém histórico completo de transações, subscriptions
 * e pagamentos sincronizados com Stripe.
 */

export class BillingSyncService {
  constructor() {
    this.transactionsCollection = null;
    this.subscriptionsCollection = null;
  }

  async init() {
    if (!this.transactionsCollection) {
      const db = await connectDB();
      this.transactionsCollection = db.collection("billing_transactions");
      this.subscriptionsCollection = db.collection("billing_subscriptions");

      // Índices para transações
      await this.transactionsCollection.createIndex(
        { stripeId: 1 },
        { unique: true }
      );
      await this.transactionsCollection.createIndex({ userId: 1 });
      await this.transactionsCollection.createIndex({ stripeCustomerId: 1 });
      await this.transactionsCollection.createIndex({ createdAt: -1 });

      // Índices para subscriptions
      await this.subscriptionsCollection.createIndex(
        { stripeSubscriptionId: 1 },
        { unique: true }
      );
      await this.subscriptionsCollection.createIndex({ userId: 1 });
    }
  }

  /**
   * Registra nova transação de billing
   */
  async createTransaction(transactionData) {
    await this.init();

    console.log("💳 Registrando transação:", transactionData.type);

    const transaction = {
      // IDs de referência
      stripeId: transactionData.stripeId, // session_id, payment_intent_id, etc.
      userId: transactionData.userId,
      stripeCustomerId: transactionData.stripeCustomerId,

      // Dados da transação
      type: transactionData.type, // 'checkout', 'subscription', 'invoice', 'refund'
      status: transactionData.status, // 'pending', 'completed', 'failed', 'refunded'
      amount: transactionData.amount,
      currency: transactionData.currency || "brl",

      // Dados do plano
      planId: transactionData.planId,
      planName: transactionData.planName,
      stripePriceId: transactionData.stripePriceId,

      // Metadados
      metadata: transactionData.metadata || {},
      stripeMetadata: transactionData.stripeMetadata || {},

      // Timestamps
      stripeCreatedAt: transactionData.stripeCreatedAt
        ? new Date(transactionData.stripeCreatedAt * 1000)
        : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      const result = await this.transactionsCollection.insertOne(transaction);

      // Atualizar dados do usuário
      if (transactionData.userId && transactionData.status === "completed") {
        await this.updateUserBillingSummary(transactionData.userId);
      }

      console.log("✅ Transação registrada:", result.insertedId);
      return result.insertedId;
    } catch (error) {
      if (error.code === 11000) {
        console.log("⚠️ Transação já existe:", transactionData.stripeId);
        return await this.updateTransaction(transactionData.stripeId, {
          status: transactionData.status,
          updatedAt: new Date(),
        });
      }
      throw error;
    }
  }

  /**
   * Atualiza transação existente
   */
  async updateTransaction(stripeId, updateData) {
    await this.init();

    const result = await this.transactionsCollection.updateOne(
      { stripeId },
      {
        $set: {
          ...updateData,
          updatedAt: new Date(),
        },
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Busca transações de um usuário
   */
  async getUserTransactions(userId, options = {}) {
    await this.init();

    const {
      limit = 50,
      skip = 0,
      status = null,
      type = null,
      sort = { createdAt: -1 },
    } = options;

    const filter = { userId };
    if (status) filter.status = status;
    if (type) filter.type = type;

    const transactions = await this.transactionsCollection
      .find(filter)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .toArray();

    const total = await this.transactionsCollection.countDocuments(filter);

    return {
      transactions,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    };
  }

  /**
   * Registra/atualiza subscription
   */
  async upsertSubscription(subscriptionData) {
    await this.init();

    console.log(
      "📅 Registrando subscription:",
      subscriptionData.stripeSubscriptionId
    );

    const subscription = {
      stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
      userId: subscriptionData.userId,
      stripeCustomerId: subscriptionData.stripeCustomerId,

      status: subscriptionData.status, // 'active', 'canceled', 'past_due', etc.
      planId: subscriptionData.planId,
      stripePriceId: subscriptionData.stripePriceId,

      currentPeriodStart: subscriptionData.currentPeriodStart
        ? new Date(subscriptionData.currentPeriodStart * 1000)
        : null,
      currentPeriodEnd: subscriptionData.currentPeriodEnd
        ? new Date(subscriptionData.currentPeriodEnd * 1000)
        : null,
      cancelAtPeriodEnd: subscriptionData.cancelAtPeriodEnd || false,
      canceledAt: subscriptionData.canceledAt
        ? new Date(subscriptionData.canceledAt * 1000)
        : null,

      stripeCreatedAt: subscriptionData.stripeCreatedAt
        ? new Date(subscriptionData.stripeCreatedAt * 1000)
        : null,
      updatedAt: new Date(),
    };

    const result = await this.subscriptionsCollection.updateOne(
      { stripeSubscriptionId: subscriptionData.stripeSubscriptionId },
      {
        $set: subscription,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    // Atualizar planos do usuário
    if (subscription.userId) {
      if (subscription.status === "active") {
        await userSync.addActivePlan(subscription.userId, subscription.planId);
      } else if (["canceled", "past_due"].includes(subscription.status)) {
        await userSync.expirePlan(subscription.userId, subscription.planId);
      }
    }

    return result.upsertedId || result.modifiedCount > 0;
  }

  /**
   * Atualiza resumo de billing do usuário
   */
  async updateUserBillingSummary(userId) {
    await this.init();

    // Calcular total gasto
    const totalSpentResult = await this.transactionsCollection
      .aggregate([
        {
          $match: {
            userId,
            status: "completed",
            type: { $in: ["checkout", "subscription", "invoice"] },
          },
        },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ])
      .toArray();

    const totalSpent = totalSpentResult[0]?.total || 0;

    // Última transação
    const lastTransaction = await this.transactionsCollection.findOne(
      { userId, status: "completed" },
      { sort: { createdAt: -1 } }
    );

    // Atualizar no userSync
    await userSync.updateUserBilling(userId, {
      totalSpent,
      lastPayment: lastTransaction?.createdAt,
      lastTransactionId: lastTransaction?._id,
    });

    return { totalSpent, lastPayment: lastTransaction?.createdAt };
  }

  /**
   * Busca transação pelo Stripe ID
   */
  async getTransactionByStripeId(stripeId) {
    await this.init();
    return await this.transactionsCollection.findOne({ stripeId });
  }

  /**
   * Estatísticas de billing
   */
  async getBillingStats(timeframe = "30d") {
    await this.init();

    // Calcular período
    const now = new Date();
    const periodStart = new Date();

    switch (timeframe) {
      case "7d":
        periodStart.setDate(now.getDate() - 7);
        break;
      case "30d":
        periodStart.setDate(now.getDate() - 30);
        break;
      case "90d":
        periodStart.setDate(now.getDate() - 90);
        break;
      case "1y":
        periodStart.setFullYear(now.getFullYear() - 1);
        break;
      default:
        periodStart.setDate(now.getDate() - 30);
    }

    const stats = await this.transactionsCollection
      .aggregate([
        {
          $match: {
            createdAt: { $gte: periodStart },
            status: "completed",
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
            totalTransactions: { $sum: 1 },
            avgTransactionValue: { $avg: "$amount" },
            uniqueCustomers: { $addToSet: "$userId" },
          },
        },
        {
          $addFields: {
            uniqueCustomersCount: { $size: "$uniqueCustomers" },
          },
        },
      ])
      .toArray();

    // Estatísticas por plano
    const planStats = await this.transactionsCollection
      .aggregate([
        {
          $match: {
            createdAt: { $gte: periodStart },
            status: "completed",
          },
        },
        {
          $group: {
            _id: "$planId",
            revenue: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { revenue: -1 } },
      ])
      .toArray();

    // Estatísticas por dia (útil para gráficos)
    const dailyStats = await this.transactionsCollection
      .aggregate([
        {
          $match: {
            createdAt: { $gte: periodStart },
            status: "completed",
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            revenue: { $sum: "$amount" },
            transactions: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ])
      .toArray();

    return {
      period: {
        start: periodStart,
        end: now,
        timeframe,
      },
      overview: stats[0] || {
        totalRevenue: 0,
        totalTransactions: 0,
        avgTransactionValue: 0,
        uniqueCustomersCount: 0,
      },
      planBreakdown: planStats,
      dailyTrend: dailyStats,
    };
  }

  /**
   * Exporta dados de billing para análise
   */
  async exportBillingData(filters = {}, format = "json") {
    await this.init();

    const transactions = await this.transactionsCollection
      .find(filters)
      .sort({ createdAt: -1 })
      .toArray();

    if (format === "csv") {
      return this.convertTransactionsToCSV(transactions);
    }

    return transactions;
  }

  convertTransactionsToCSV(transactions) {
    if (transactions.length === 0) return "";

    const headers = [
      "id",
      "stripeId",
      "userId",
      "type",
      "status",
      "amount",
      "currency",
      "planId",
      "stripePriceId",
      "createdAt",
      "stripeCreatedAt",
    ];

    const rows = transactions.map((t) => [
      t._id,
      t.stripeId,
      t.userId,
      t.type,
      t.status,
      t.amount,
      t.currency,
      t.planId,
      t.stripePriceId,
      t.createdAt?.toISOString(),
      t.stripeCreatedAt?.toISOString(),
    ]);

    return [headers, ...rows].map((row) => row.join(",")).join("\n");
  }
}

// Singleton instance
export const billingSync = new BillingSyncService();
