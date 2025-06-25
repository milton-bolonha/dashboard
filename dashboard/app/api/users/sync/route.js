import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/nextjs/server";
import { getCollection } from "../../../../lib/db";

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

/**
 * API para Sincronização de Usuários: Clerk → MongoDB
 *
 * Endpoints para manter nossos próprios registros sincronizados
 */

export async function POST(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { action, targetUserId } = await request.json();

    console.log(`🔄 Sincronização solicitada: ${action}`);

    switch (action) {
      case "sync_current_user":
        return await syncCurrentUser(userId);

      case "sync_user":
        return await syncSpecificUser(targetUserId);

      case "sync_all_users":
        return await syncAllUsers();

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("❌ Erro na sincronização:", error);
    return NextResponse.json(
      {
        error: "Sync failed",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Buscar usuário atual no MongoDB
    const mongoUser = await getUserFromMongo(userId);

    if (!mongoUser) {
      // Se não existe, sincronizar automaticamente
      return await syncCurrentUser(userId);
    }

    return NextResponse.json({
      user: mongoUser,
      synced: true,
      lastSync: mongoUser.lastSyncAt,
    });
  } catch (error) {
    console.error("❌ Erro ao buscar usuário:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch user",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

async function syncCurrentUser(clerkUserId) {
  const clerkUser = await clerkClient.users.getUser(clerkUserId);
  const mongoUser = await syncUserToMongo(clerkUser);

  return NextResponse.json({
    message: "User synced successfully",
    user: mongoUser,
    syncedAt: new Date().toISOString(),
  });
}

async function syncSpecificUser(targetUserId) {
  const clerkUser = await clerkClient.users.getUser(targetUserId);
  const mongoUser = await syncUserToMongo(clerkUser);

  return NextResponse.json({
    message: "User synced successfully",
    user: mongoUser,
    syncedAt: new Date().toISOString(),
  });
}

async function syncAllUsers() {
  console.log("🔄 Iniciando sincronização de todos os usuários...");

  let offset = 0;
  const limit = 100;
  let totalSynced = 0;
  const errors = [];

  while (true) {
    try {
      const clerkUsers = await clerkClient.users.getUserList({
        limit,
        offset,
      });

      if (clerkUsers.length === 0) break;

      for (const clerkUser of clerkUsers) {
        try {
          await syncUserToMongo(clerkUser);
          totalSynced++;
        } catch (error) {
          console.error(`❌ Erro ao sincronizar ${clerkUser.id}:`, error);
          errors.push({ userId: clerkUser.id, error: error.message });
        }
      }

      offset += limit;

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      console.error("❌ Erro na sincronização em lote:", error);
      break;
    }
  }

  return NextResponse.json({
    message: "Bulk sync completed",
    totalSynced,
    errors: errors.length > 0 ? errors : null,
    syncedAt: new Date().toISOString(),
  });
}

async function syncUserToMongo(clerkUser) {
  const collection = await getCollection("users");

  // Criar índices se não existirem
  await collection.createIndex({ clerkId: 1 }, { unique: true });
  await collection.createIndex({ email: 1 }, { unique: true });

  const userData = {
    clerkId: clerkUser.id,
    email: clerkUser.emailAddresses[0]?.emailAddress,
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    profileImageUrl: clerkUser.profileImageUrl,

    // Dados de billing do metadata
    stripeCustomerId: clerkUser.unsafeMetadata?.stripeCustomerId,
    activePlans: clerkUser.unsafeMetadata?.plans?.active || [],
    expiredPlans: clerkUser.unsafeMetadata?.plans?.expired || [],
    totalSpent: clerkUser.unsafeMetadata?.billing?.totalSpent || 0,
    lastPayment: clerkUser.unsafeMetadata?.billing?.lastPayment,

    // Metadados de controle
    lastSyncAt: new Date(),
    clerkCreatedAt: new Date(clerkUser.createdAt),
    clerkLastSignInAt: clerkUser.lastSignInAt
      ? new Date(clerkUser.lastSignInAt)
      : null,

    // Audit trail
    updatedAt: new Date(),
  };

  try {
    const result = await collection.updateOne(
      { clerkId: clerkUser.id },
      {
        $set: userData,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    if (result.upsertedCount > 0) {
      console.log("✅ Usuário criado no MongoDB:", clerkUser.id);
    } else {
      console.log("🔄 Usuário atualizado no MongoDB:", clerkUser.id);
    }

    return await getUserFromMongo(clerkUser.id);
  } catch (error) {
    console.error("❌ Erro ao sincronizar usuário:", error);
    throw error;
  }
}

async function getUserFromMongo(clerkId) {
  const collection = await getCollection("users");
  return await collection.findOne({ clerkId });
}
