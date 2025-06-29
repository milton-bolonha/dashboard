/**
 * SCRIPT DE MIGRAÇÃO PARA WORKSPACES
 *
 * Este script migra dados existentes para o sistema de workspaces:
 * 1. Cria um workspace padrão para cada usuário único
 * 2. Migra content types, sections e items para o workspace
 * 3. Validações em cada etapa
 */

import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";

// Carregar variáveis de ambiente do .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, "../.env.local");

console.log("🔧 Carregando variáveis de ambiente de:", envPath);
config({ path: envPath });

// Debug: verificar se MongoDB URI foi carregada
console.log(
  "🔍 MONGODB_URI encontrada:",
  process.env.MONGODB_URI ? "SIM" : "NÃO"
);
console.log(
  "🔍 URI sendo usada:",
  process.env.MONGODB_URI ||
    "PADRÃO: mongodb://localhost:27017/dashboard-engine"
);

// import { db } from "../lib/db.js"; // << COMENTE OU REMOVA ESTA LINHA
import { ObjectId } from "mongodb";

async function migrateToWorkspaces() {
  console.log("🔄 Iniciando migração para workspaces...");
  const { db } = await import("../lib/db.js"); // << ADICIONE A IMPORTAÇÃO DINÂMICA AQUI

  try {
    // 1. Buscar todos os usuários únicos
    const uniqueUsers = await db.distinct("contentTypes", "userId");
    console.log(`📊 Encontrados ${uniqueUsers.length} usuários únicos`);

    if (uniqueUsers.length === 0) {
      console.log("✅ Nenhum usuário para migrar - sistema limpo");
      return;
    }

    let successCount = 0;
    let errorCount = 0;

    for (const userId of uniqueUsers) {
      try {
        console.log(`\n👤 Migrando usuário: ${userId}`);
        let workspaceId;

        // Verificar se já tem workspace
        const existingWorkspace = await db.findOne("workspaces", {
          ownerId: userId,
        });

        if (existingWorkspace) {
          console.log(
            `⚠️  Usuário já tem workspace: ${existingWorkspace.name} (${existingWorkspace._id})`
          );
          workspaceId = existingWorkspace._id;
        } else {
          // 2. Criar workspace padrão
          const workspaceData = {
            name: "Meu Workspace Principal",
            slug: `workspace-${userId.slice(-8)}-${Date.now()}`,
            ownerId: userId,
            description: "Workspace criado automaticamente na migração",
            plan: "free",
            members: [
              {
                userId,
                role: "owner",
                permissions: {
                  canExport: true,
                  canInvite: true,
                  canManageBilling: true,
                },
                joinedAt: new Date(),
              },
            ],
            limits: {
              maxUsers: 1,
              maxContentTypes: 3,
              maxSections: 5,
              maxItems: 100,
              maxAPICallsPerMonth: 1000,
            },
            security: {
              apiKeyEnabled: false,
              allowedIPs: [],
            },
            isActive: true,
            createdAt: new Date(),
            lastActivity: new Date(),
          };

          const workspaceResult = await db.insertOne(
            "workspaces",
            workspaceData
          );
          workspaceId = workspaceResult.insertedId;

          console.log(`✅ Workspace criado: ${workspaceId}`);
        }

        // 3. Migrar dados existentes (COM VALIDAÇÃO)
        const migrations = [
          {
            collection: "contentTypes",
            count: await db.count("contentTypes", {
              userId,
              workspaceId: { $exists: false },
            }),
          },
          {
            collection: "sections",
            count: await db.count("sections", {
              userId,
              workspaceId: { $exists: false },
            }),
          },
          {
            collection: "items",
            count: await db.count("items", {
              userId,
              workspaceId: { $exists: false },
            }),
          },
        ];

        // Migrar cada coleção
        for (const migration of migrations) {
          if (migration.count > 0) {
            console.log(
              `📋 Migrando ${migration.collection}: ${migration.count} registros`
            );

            const result = await db.updateMany(
              migration.collection,
              { userId, workspaceId: { $exists: false } },
              { workspaceId: workspaceId }
            );

            console.log(
              `   ✅ ${migration.collection}: ${result.modifiedCount}/${migration.count} migrados`
            );

            // Validação
            if (result.modifiedCount !== migration.count) {
              console.log(`   ⚠️ Nem todos os registros foram migrados!`);
            }
          } else {
            console.log(`📋 ${migration.collection}: 0 registros (ok)`);
          }
        }

        successCount++;
        console.log(`✅ Usuário ${userId} migrado com sucesso!`);
      } catch (userError) {
        console.error(`❌ Erro ao migrar usuário ${userId}:`, userError);
        errorCount++;
      }
    }

    console.log("\n🎯 RELATÓRIO DE MIGRAÇÃO:");
    console.log(`✅ Sucessos: ${successCount}`);
    console.log(`❌ Erros: ${errorCount}`);
    console.log(`📊 Total: ${uniqueUsers.length}`);

    if (errorCount === 0) {
      console.log("🎉 Migração concluída com sucesso!");
    } else {
      console.log("⚠️ Migração concluída com alguns erros - revisar logs");
    }
  } catch (error) {
    console.error("❌ Erro crítico na migração:", error);
    throw error;
  }
}

/**
 * Função para verificar status da migração
 */
async function checkMigrationStatus() {
  console.log("🔍 Verificando status da migração...");
  const { db } = await import("../lib/db.js"); // << ADICIONE A IMPORTAÇÃO DINÂMICA AQUI

  try {
    const stats = {
      totalWorkspaces: await db.count("workspaces"),
      contentTypesWithWorkspace: await db.count("contentTypes", {
        workspaceId: { $exists: true },
      }),
      contentTypesWithoutWorkspace: await db.count("contentTypes", {
        workspaceId: { $exists: false },
      }),
      sectionsWithWorkspace: await db.count("sections", {
        workspaceId: { $exists: true },
      }),
      sectionsWithoutWorkspace: await db.count("sections", {
        workspaceId: { $exists: false },
      }),
      itemsWithWorkspace: await db.count("items", {
        workspaceId: { $exists: true },
      }),
      itemsWithoutWorkspace: await db.count("items", {
        workspaceId: { $exists: false },
      }),
    };

    console.log("📊 Status da migração:");
    console.log(`   Workspaces criados: ${stats.totalWorkspaces}`);
    console.log(
      `   Content Types migrados: ${stats.contentTypesWithWorkspace}`
    );
    console.log(
      `   Content Types pendentes: ${stats.contentTypesWithoutWorkspace}`
    );
    console.log(`   Sections migradas: ${stats.sectionsWithWorkspace}`);
    console.log(`   Sections pendentes: ${stats.sectionsWithoutWorkspace}`);
    console.log(`   Items migrados: ${stats.itemsWithWorkspace}`);
    console.log(`   Items pendentes: ${stats.itemsWithoutWorkspace}`);

    const pendingTotal =
      stats.contentTypesWithoutWorkspace +
      stats.sectionsWithoutWorkspace +
      stats.itemsWithoutWorkspace;

    if (pendingTotal === 0) {
      console.log("✅ Migração 100% completa!");
    } else {
      console.log(`⚠️ ${pendingTotal} registros ainda precisam ser migrados`);
    }

    return stats;
  } catch (error) {
    console.error("❌ Erro ao verificar status:", error);
    throw error;
  }
}

// Exportar funções
export { migrateToWorkspaces, checkMigrationStatus };
