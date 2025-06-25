import { connectDB } from "./db.js";
import { clerkClient } from "@clerk/nextjs";

/**
 * Sistema de Sincronização User: Clerk ↔ MongoDB
 *
 * Garante que temos nossos próprios registros de usuários
 * sincronizados com o Clerk, mantendo dados essenciais.
 */

export class UserSyncService {
  constructor() {
    this.collection = null;
  }

  async init() {
    if (!this.collection) {
      const db = await connectDB();
      this.collection = db.collection("users");

      // Criar índices únicos
      await this.collection.createIndex({ clerkId: 1 }, { unique: true });
      await this.collection.createIndex({ email: 1 }, { unique: true });
    }
  }

  /**
   * Sincroniza usuário do Clerk para nosso MongoDB
   */
  async syncUserFromClerk(clerkUser) {
    await this.init();

    console.log("👤 Sincronizando usuário:", clerkUser.id);

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
      // Upsert: atualiza se existe, cria se não existe
      const result = await this.collection.updateOne(
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

      return await this.getUserByClerkId(clerkUser.id);
    } catch (error) {
      console.error("❌ Erro ao sincronizar usuário:", error);
      throw error;
    }
  }

  /**
   * Busca usuário no MongoDB pelo Clerk ID
   */
  async getUserByClerkId(clerkId) {
    await this.init();
    return await this.collection.findOne({ clerkId });
  }

  /**
   * Busca usuário no MongoDB pelo email
   */
  async getUserByEmail(email) {
    await this.init();
    return await this.collection.findOne({ email });
  }

  /**
   * Atualiza dados de billing de um usuário
   */
  async updateUserBilling(clerkId, billingData) {
    await this.init();

    console.log("💰 Atualizando billing do usuário:", clerkId);

    const updateData = {
      ...billingData,
      lastSyncAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.collection.updateOne(
      { clerkId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      console.warn(
        "⚠️ Usuário não encontrado para atualizar billing:",
        clerkId
      );
      // Buscar no Clerk e sincronizar
      try {
        const clerkUser = await clerkClient.users.getUser(clerkId);
        await this.syncUserFromClerk(clerkUser);
        // Tentar novamente
        return await this.updateUserBilling(clerkId, billingData);
      } catch (error) {
        console.error("❌ Erro ao buscar usuário no Clerk:", error);
        throw error;
      }
    }

    console.log("✅ Billing atualizado com sucesso");
    return await this.getUserByClerkId(clerkId);
  }

  /**
   * Adiciona plano ativo ao usuário
   */
  async addActivePlan(clerkId, planId) {
    await this.init();

    const result = await this.collection.updateOne(
      { clerkId },
      {
        $addToSet: { activePlans: planId },
        $pull: { expiredPlans: planId },
        $set: {
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Remove plano ativo e adiciona aos expirados
   */
  async expirePlan(clerkId, planId) {
    await this.init();

    const result = await this.collection.updateOne(
      { clerkId },
      {
        $pull: { activePlans: planId },
        $addToSet: { expiredPlans: planId },
        $set: {
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        },
      }
    );

    return result.modifiedCount > 0;
  }

  /**
   * Lista todos os usuários com filtros
   */
  async listUsers(filters = {}, options = {}) {
    await this.init();

    const { limit = 50, skip = 0, sort = { createdAt: -1 } } = options;

    const users = await this.collection
      .find(filters)
      .sort(sort)
      .limit(limit)
      .skip(skip)
      .toArray();

    const total = await this.collection.countDocuments(filters);

    return {
      users,
      pagination: {
        total,
        limit,
        skip,
        hasMore: skip + limit < total,
      },
    };
  }

  /**
   * Sincroniza todos os usuários do Clerk
   */
  async syncAllUsersFromClerk() {
    console.log("🔄 Iniciando sincronização completa de usuários...");

    let offset = 0;
    const limit = 100;
    let totalSynced = 0;

    while (true) {
      try {
        const clerkUsers = await clerkClient.users.getUserList({
          limit,
          offset,
        });

        if (clerkUsers.length === 0) break;

        for (const clerkUser of clerkUsers) {
          try {
            await this.syncUserFromClerk(clerkUser);
            totalSynced++;
          } catch (error) {
            console.error(
              `❌ Erro ao sincronizar usuário ${clerkUser.id}:`,
              error
            );
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

    console.log(`✅ Sincronização completa: ${totalSynced} usuários`);
    return totalSynced;
  }

  /**
   * Estatísticas dos usuários
   */
  async getUserStats() {
    await this.init();

    const stats = await this.collection
      .aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            totalRevenue: { $sum: "$totalSpent" },
            usersWithPlans: {
              $sum: {
                $cond: [
                  { $gt: [{ $size: { $ifNull: ["$activePlans", []] } }, 0] },
                  1,
                  0,
                ],
              },
            },
            avgSpentPerUser: { $avg: "$totalSpent" },
          },
        },
      ])
      .toArray();

    const planStats = await this.collection
      .aggregate([
        {
          $unwind: { path: "$activePlans", preserveNullAndEmptyArrays: false },
        },
        { $group: { _id: "$activePlans", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ])
      .toArray();

    return {
      overview: stats[0] || {
        totalUsers: 0,
        totalRevenue: 0,
        usersWithPlans: 0,
        avgSpentPerUser: 0,
      },
      planDistribution: planStats,
    };
  }
}

// Singleton instance
export const userSync = new UserSyncService();
