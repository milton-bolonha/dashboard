#!/usr/bin/env node
/**
 * MIGRAÇÃO DIRETA PARA WORKSPACES
 * Script que conecta diretamente ao MongoDB sem depender de lib/db.js
 */

import { config } from "dotenv";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { MongoClient } from "mongodb";

// Carregar variáveis de ambiente do .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = resolve(__dirname, "../.env.local");

console.log("🔧 Carregando variáveis de ambiente de:", envPath);
config({ path: envPath });

// Debug MongoDB URI
console.log(
  "🔍 MONGODB_URI encontrada:",
  process.env.MONGODB_URI ? "SIM" : "NÃO"
);
console.log(
  "🔍 URI sendo usada:",
  process.env.MONGODB_URI ||
    "PADRÃO: mongodb://localhost:27017/dashboard-engine"
);

// Configuração direta do MongoDB
const uri =
  process.env.MONGODB_URI || "mongodb://localhost:27017/dashboard-engine";
const client = new MongoClient(uri);

async function migrate() {
  try {
    console.log("🔌 Conectando...");
    await client.connect();
    console.log("✅ Conectado!");

    const db = client.db();

    // Buscar usuários
    const users = await db.collection("contentTypes").distinct("userId");
    console.log(`👥 ${users.length} usuários encontrados`);

    if (users.length === 0) {
      console.log("✅ Nenhum usuário para migrar");
      return;
    }

    // Migrar cada usuário
    for (const userId of users) {
      console.log(`\n👤 Migrando: ${userId}`);

      // Verificar se já tem workspace
      const existing = await db
        .collection("workspaces")
        .findOne({ ownerId: userId });
      if (existing) {
        console.log("⚠️ Já tem workspace");
        continue;
      }

      // Criar workspace
      const workspace = {
        name: "Meu Workspace",
        slug: `ws-${userId.slice(-8)}-${Date.now()}`,
        ownerId: userId,
        plan: "free",
        members: [{ userId, role: "owner", permissions: { canExport: true } }],
        limits: {
          maxUsers: 1,
          maxContentTypes: 3,
          maxSections: 5,
          maxItems: 100,
        },
        isActive: true,
        createdAt: new Date(),
      };

      const result = await db.collection("workspaces").insertOne(workspace);
      console.log(`✅ Workspace criado: ${result.insertedId}`);

      // Migrar dados
      const collections = ["contentTypes", "sections", "items"];
      for (const collection of collections) {
        const updateResult = await db
          .collection(collection)
          .updateMany(
            { userId, workspaceId: { $exists: false } },
            { $set: { workspaceId: result.insertedId } }
          );
        console.log(`📋 ${collection}: ${updateResult.modifiedCount} migrados`);
      }
    }

    console.log("\n🎉 Migração concluída!");
  } catch (error) {
    console.error("❌ Erro:", error.message);
    throw error;
  } finally {
    await client.close();
  }
}

migrate().catch(console.error);
