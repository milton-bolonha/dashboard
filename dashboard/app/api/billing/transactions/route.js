import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { getCollection } from "../../../../lib/db";

export async function POST(request) {
  try {
    // Verificação de segurança - apenas chamadas internas ou autenticadas
    const authHeader = request.headers.get("authorization");
    const { userId } = auth();

    if (!authHeader?.includes(process.env.INTERNAL_API_KEY) && !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactionData = await request.json();

    console.log("💾 Salvando transação:", transactionData.type || "unknown");

    const collection = await getCollection("billing_transactions");

    // Criar índices se não existirem
    await collection.createIndex({ stripeId: 1 }, { unique: true });
    await collection.createIndex({ userId: 1 });
    await collection.createIndex({ stripeCustomerId: 1 });

    // Preparar documento da transação
    const transaction = {
      // IDs de referência
      stripeId: transactionData.stripeId,
      userId: transactionData.userId,
      stripeCustomerId: transactionData.stripeCustomerId,

      // Dados da transação
      type: transactionData.type || "unknown",
      status: transactionData.status || "pending",
      amount: transactionData.amount || 0,
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
      // Salvar transação (upsert para evitar duplicatas)
      const result = await collection.updateOne(
        { stripeId: transaction.stripeId },
        {
          $set: transaction,
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );

      let transactionId = result.upsertedId;

      if (result.matchedCount > 0) {
        console.log("🔄 Transação atualizada:", transaction.stripeId);
        const existing = await collection.findOne({
          stripeId: transaction.stripeId,
        });
        transactionId = existing._id;
      } else {
        console.log("✅ Transação criada:", transactionId);
      }

      // Atualizar resumo do usuário se transação foi completada
      if (transaction.userId && transaction.status === "completed") {
        await updateUserBillingSummary(transaction.userId);
      }

      return NextResponse.json({
        success: true,
        transactionId,
        message:
          result.upsertedCount > 0
            ? "Transaction created"
            : "Transaction updated",
      });
    } catch (error) {
      if (error.code === 11000) {
        console.log("⚠️ Transação já existe:", transaction.stripeId);
        return NextResponse.json({
          success: true,
          message: "Transaction already exists",
        });
      }
      throw error;
    }
  } catch (error) {
    console.error("❌ Erro ao salvar transação:", error);
    return NextResponse.json(
      {
        error: "Failed to save transaction",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { userId, error, status: authStatus } = await getAuthenticatedUser();

    if (error) {
      // Permitir chamadas internas com API Key como fallback
      const authHeader = request.headers.get("authorization");
      if (!authHeader?.includes(process.env.INTERNAL_API_KEY)) {
        return NextResponse.json({ error }, { status: authStatus });
      }
    }

    const { searchParams } = new URL(request.url);
    const targetUserId = searchParams.get("userId") || userId; // Usa o userId autenticado se nenhum for especificado
    if (!targetUserId) {
      return NextResponse.json(
        { error: "Unauthorized - User ID not found" },
        { status: 401 }
      );
    }

    const limit = parseInt(searchParams.get("limit") || "50");
    const skip = parseInt(searchParams.get("skip") || "0");
    const status = searchParams.get("status");
    const type = searchParams.get("type");

    const collection = await getCollection("billing_transactions");

    // Filtro
    const filter = {};
    if (targetUserId) filter.userId = targetUserId;
    if (status) filter.status = status;
    if (type) filter.type = type;

    // Buscar transações
    const transactions = await collection
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();

    // Contar total
    const total = await collection.countDocuments(filter);

    // Calcular estatísticas
    const stats = await collection
      .aggregate([
        { $match: { ...filter, status: "completed" } },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
            totalTransactions: { $sum: 1 },
            avgAmount: { $avg: "$amount" },
          },
        },
      ])
      .toArray();

    return NextResponse.json({
      transactions,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
      stats: stats[0] || {
        totalRevenue: 0,
        totalTransactions: 0,
        avgAmount: 0,
      },
    });
  } catch (error) {
    console.error("❌ Erro ao buscar transações:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch transactions",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

async function updateUserBillingSummary(userId) {
  const transactionsCollection = await getCollection("billing_transactions");
  const usersCollection = await getCollection("users");

  // Calcular total gasto
  const totalSpentResult = await transactionsCollection
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
  const lastTransaction = await transactionsCollection.findOne(
    { userId, status: "completed" },
    { sort: { createdAt: -1 } }
  );

  // Atualizar usuário
  await usersCollection.updateOne(
    { clerkId: userId },
    {
      $set: {
        totalSpent,
        lastPayment: lastTransaction?.createdAt,
        lastTransactionId: lastTransaction?._id,
        lastSyncAt: new Date(),
        updatedAt: new Date(),
      },
    }
  );

  console.log(`💰 Billing atualizado para usuário ${userId}: R$ ${totalSpent}`);

  return { totalSpent, lastPayment: lastTransaction?.createdAt };
}
