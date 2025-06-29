#!/usr/bin/env node
/**
 * SINCRONIZAÇÃO CLERK → WORKSPACES
 *
 * Este script busca usuários ativos no Clerk e cria workspaces
 * automaticamente para cada usuário que não tem workspace ainda.
 */

import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { MongoClient } from "mongodb";
import { clerkClient } from "@clerk/nextjs/server";

// Carregar variáveis de ambiente
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, "../.env.local");

console.log("🔧 Carregando .env.local");
config({ path: envPath });

// URI do MongoDB
const uri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/dashboard-engine";
console.log("🔍 MongoDB:", uri.includes("mongodb+srv") ? "Atlas" : "Local");

const client = new MongoClient(uri);

async function syncClerkUsers() {
  try {
    console.log("🚀 Sincronizando Usuários Clerk → Workspaces");
    console.log("━".repeat(50));

    // 1. Conectar MongoDB
    console.log("🔌 Conectando ao MongoDB...");
    await client.connect();
    console.log("✅ MongoDB conectado!");

    const db = client.db();

    // 2. Buscar usuários do Clerk
    console.log("\n👥 Buscando usuários do Clerk...");
    const clerkUsers = await clerkClient.users.getUserList({
      limit: 100, // Ajustar se necessário
    });

    console.log(`✅ ${clerkUsers.data.length} usuários encontrados no Clerk`);

    if (clerkUsers.data.length === 0) {
      console.log("⚠️ Nenhum usuário encontrado no Clerk");
      return;
    }

    // 3. Processar cada usuário
    let created = 0;
    let existing = 0;
    let errors = 0;

    for (const user of clerkUsers.data) {
      try {
        console.log(
          `\n👤 Processando: ${user.firstName || "Usuário"} (${user.id})`
        );

        // Verificar se já tem workspace
        const existingWorkspace = await db.collection("workspaces").findOne({
          ownerId: user.id,
        });

        if (existingWorkspace) {
          console.log(`⚠️ Já tem workspace: ${existingWorkspace.name}`);
          existing++;
          continue;
        }

        // 4. Criar workspace automático
        const workspace = {
          name: `Workspace de ${user.firstName || "Usuário"}`,
          slug: `ws-${user.id.slice(-8)}-${Date.now()}`,
          ownerId: user.id,
          description: `Workspace criado automaticamente para ${user.emailAddresses[0]?.emailAddress}`,
          plan: "free",
          members: [
            {
              userId: user.id,
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

        const result = await db.collection("workspaces").insertOne(workspace);
        console.log(`✅ Workspace criado: ${result.insertedId}`);
        console.log(`   Nome: ${workspace.name}`);
        console.log(`   Slug: ${workspace.slug}`);

        created++;
      } catch (userError) {
        console.error(
          `❌ Erro ao processar usuário ${user.id}:`,
          userError.message
        );
        errors++;
      }
    }

    // 5. Relatório final
    console.log("\n🎯 RELATÓRIO DE SINCRONIZAÇÃO:");
    console.log(`✅ Workspaces criados: ${created}`);
    console.log(`⚠️ Já existiam: ${existing}`);
    console.log(`❌ Erros: ${errors}`);
    console.log(`📊 Total usuários: ${clerkUsers.data.length}`);

    if (created > 0) {
      console.log("\n🎉 Sincronização concluída com sucesso!");
      console.log("💡 Agora todos os usuários do Clerk têm workspaces!");
    } else if (existing > 0) {
      console.log("\n✅ Todos os usuários já têm workspaces!");
    }
  } catch (error) {
    console.error("❌ Erro crítico:", error.message);
    if (error.message.includes("Clerk")) {
      console.error(
        "💡 Dica: Verifique se as chaves do Clerk estão corretas no .env.local"
      );
    }
    throw error;
  } finally {
    await client.close();
    console.log("\n🔌 Conexão MongoDB fechada");
  }
}

// Executar sincronização
syncClerkUsers()
  .then(() => {
    console.log("\n✅ Sincronização finalizada!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 ERRO CRÍTICO:", error.message);
    process.exit(1);
  });
